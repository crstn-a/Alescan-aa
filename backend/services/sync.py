import re
import logging
from datetime import datetime
from services.sheet_fetcher import fetch_sheet_csv, parse_sheet_csv
from services.db import get_supabase, log_error

logger = logging.getLogger(__name__)


def run_sync() -> dict:
    """
    Monthly price sync pipeline using DA Google Sheet data.
    Triggered monthly by scheduler or manually via POST /admin/api/sync.
    """
    extractor = "sheet"

    # ── Stage 1 & 2: Fetch and Parse Google Sheet CSV ───────
    try:
        logger.info("Starting DA Google Sheet price sync...")
        csv_text = fetch_sheet_csv()
        records = parse_sheet_csv(csv_text)

        if not isinstance(records, list) or len(records) == 0:
            raise ValueError("Google Sheet parser returned 0 commodity records")

        logger.info(f"Google Sheet parser extracted {len(records)} commodity records")

    except Exception as e:
        logger.error(f"Sheet fetch/parse failed: {e}")
        log_error("sync", f"Sheet sync failed: {e}")
        _write_sync_log(extractor, "failed", str(e))
        return {
            "status": "failed",
            "stage": "extract",
            "extractor": extractor,
            "error": str(e)
        }

    # ── Stage 3: Upsert to Products & Price Records ──────────
    try:
        _upsert_sheet_prices(records)
    except Exception as e:
        logger.error(f"Price records upsert failed: {e}")
        log_error("sync", f"Upsert failed: {e}")
        _write_sync_log(extractor, "failed", f"Upsert error: {e}")
        return {
            "status": "failed",
            "stage": "upsert",
            "extractor": extractor,
            "error": str(e)
        }

    # ── Stage 4: Log Success & Clean Cache ──────────────────
    _write_sync_log(extractor, "success", f"Inserted {len(records)} prices from DA Google Sheet")
    _trigger_background_cleanup(max_per_product=10)
    try:
        from routers.prices import clear_prices_cache
        clear_prices_cache()
    except Exception as e:
        logger.warning(f"Could not clear prices cache: {e}")

    logger.info(f"Sync complete — {len(records)} prices via {extractor}")

    return {
        "status": "success",
        "extractor": extractor,
        "count": len(records)
    }


def _upsert_sheet_prices(records: list[dict]):
    """Insert or update products and price_records in Supabase using fast batching.
    Prefetches existing products and today's price records in single queries,
    bulk-inserts missing products, and batch-updates/inserts price records.
    """
    if not records:
        return

    sb = get_supabase()
    today_iso = datetime.now().strftime("%Y-%m-%d")

    # 1. Fetch all existing products in ONE query
    prods_res = sb.table("products").select("id, slug, name, display_name").execute()
    existing_prods = prods_res.data or []

    prod_by_slug = {}
    prod_by_name = {}
    for p in existing_prods:
        pid = p.get("id")
        if p.get("slug"):
            prod_by_slug[p["slug"]] = pid
        if p.get("name"):
            prod_by_name[p["name"].strip().lower()] = pid

    # 2. Identify products that need to be created
    new_products_payload = []
    seen_new_slugs = set()

    for rec in records:
        comm_name = rec["commodity_name"]
        slug = re.sub(r"[^a-z0-9]+", "_", comm_name.lower()).strip("_")
        name_clean = comm_name.strip().lower()

        existing_pid = prod_by_slug.get(slug) or prod_by_name.get(name_clean)
        if not existing_pid and slug not in seen_new_slugs:
            seen_new_slugs.add(slug)
            new_products_payload.append({
                "name": comm_name,
                "display_name": comm_name,
                "slug": slug,
            })

    # Bulk insert newly discovered products in one batch request
    if new_products_payload:
        try:
            ins_res = sb.table("products").insert(new_products_payload).execute()
            for p in (ins_res.data or []):
                pid = p.get("id")
                if p.get("slug"):
                    prod_by_slug[p["slug"]] = pid
                if p.get("name"):
                    prod_by_name[p["name"].strip().lower()] = pid
            logger.info(f"Batch inserted {len(new_products_payload)} new products")
        except Exception as e:
            logger.warning(f"Batch insert of products failed ({e}), falling back individually...")
            for item in new_products_payload:
                try:
                    s_res = sb.table("products").insert(item).execute()
                    if s_res.data:
                        sp = s_res.data[0]
                        if sp.get("slug"):
                            prod_by_slug[sp["slug"]] = sp["id"]
                        if sp.get("name"):
                            prod_by_name[sp["name"].strip().lower()] = sp["id"]
                except Exception as ex:
                    logger.warning(f"Could not insert product {item['name']}: {ex}")

    # 3. Fetch all price records for today in ONE query
    today_prices_res = (
        sb.table("price_records")
        .select("id, product_id")
        .eq("week_of", today_iso)
        .execute()
    )
    today_records = today_prices_res.data or []
    existing_price_map = {r["product_id"]: r["id"] for r in today_records if r.get("product_id")}

    # 4. Prepare batch insert and batch update payloads
    to_insert = []
    to_update = []
    seen_product_ids = set()

    for rec in records:
        comm_name = rec["commodity_name"]
        slug = re.sub(r"[^a-z0-9]+", "_", comm_name.lower()).strip("_")
        name_clean = comm_name.strip().lower()
        prod_id = prod_by_slug.get(slug) or prod_by_name.get(name_clean)

        if not prod_id or prod_id in seen_product_ids:
            continue
        seen_product_ids.add(prod_id)

        price_val = rec.get("price_prevailing") or rec.get("price_average") or rec.get("price_low") or 0.0

        price_payload = {
            "product_id": prod_id,
            "price_per_kg": float(price_val),
            "source": rec.get("source", "DA Bantay Presyo (Sheet Sync)"),
            "week_of": today_iso,
        }

        if prod_id in existing_price_map:
            to_update.append({
                "id": existing_price_map[prod_id],
                **price_payload
            })
        else:
            to_insert.append(price_payload)

    # 5. Execute batch writes in chunks of 100
    BATCH_SIZE = 100

    if to_insert:
        for i in range(0, len(to_insert), BATCH_SIZE):
            chunk = to_insert[i:i + BATCH_SIZE]
            try:
                sb.table("price_records").insert(chunk).execute()
            except Exception as e:
                logger.warning(f"Batch insert of price_records failed: {e}")

    if to_update:
        for i in range(0, len(to_update), BATCH_SIZE):
            chunk = to_update[i:i + BATCH_SIZE]
            try:
                sb.table("price_records").upsert(chunk).execute()
            except Exception as e:
                logger.warning(f"Batch update of price_records failed: {e}")

    logger.info(f"Sync upsert complete: {len(to_insert)} inserted, {len(to_update)} updated.")


def _trigger_background_cleanup(max_per_product: int = 10):
    """Run price record pruning asynchronously so it doesn't block the sync response."""
    import threading
    t = threading.Thread(target=_cleanup_old_price_records, args=(max_per_product,), daemon=True)
    t.start()


def _cleanup_sync_logs(max_keep: int = 10):
    """Keep only the latest `max_keep` (10 max) sync log entries and delete older ones."""
    try:
        sb = get_supabase()
        logs_res = (
            sb.table("sync_logs")
            .select("id, synced_at")
            .order("synced_at", desc=True)
            .execute()
        )
        logs = logs_res.data or []
        if len(logs) > max_keep:
            to_delete_ids = [log["id"] for log in logs[max_keep:]]
            sb.table("sync_logs").delete().in_("id", to_delete_ids).execute()
            logger.info(f"Cleaned up {len(to_delete_ids)} old sync logs, keeping latest {max_keep}")
    except Exception as e:
        logger.error(f"Failed to cleanup old sync logs: {e}")


def _cleanup_old_price_records(max_per_product: int = 10):
    """Keep at most `max_per_product` price records per product to prevent database bloat.
    Uses batch retrieval and grouping instead of N+1 individual queries.
    """
    try:
        sb = get_supabase()
        res = (
            sb.table("price_records")
            .select("id, product_id, created_at")
            .order("created_at", desc=True)
            .execute()
        )
        records = res.data or []
        if not records:
            return

        counts_per_prod = {}
        to_delete_ids = []

        for r in records:
            pid = r.get("product_id")
            if not pid:
                continue
            counts_per_prod[pid] = counts_per_prod.get(pid, 0) + 1
            if counts_per_prod[pid] > max_per_product:
                to_delete_ids.append(r["id"])

        if to_delete_ids:
            for i in range(0, len(to_delete_ids), 100):
                chunk = to_delete_ids[i:i + 100]
                sb.table("price_records").delete().in_("id", chunk).execute()
            logger.info(f"Cleaned up {len(to_delete_ids)} old price records across all products")
    except Exception as e:
        logger.error(f"Failed to cleanup old price records: {e}")


def _write_sync_log(extractor: str, status: str, notes: str = None):
    try:
        get_supabase().table("sync_logs").insert({
            "extractor_used": extractor,
            "status": status,
            "pdf_url": "https://docs.google.com/spreadsheets/d/1QW1KwKXEPSPIKqTss0aD56O6knQTFvbK4hjdP5fqdZI",
            "notes": notes,
        }).execute()
        _cleanup_sync_logs(max_keep=10)
    except Exception as e:
        logger.error(f"Failed to write sync log: {e}")

