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

    # ── Stage 4: Log Success ────────────────────────────────
    _write_sync_log(extractor, "success", f"Inserted {len(records)} prices from DA Google Sheet")
    logger.info(f"Sync complete — {len(records)} prices via {extractor}")

    return {
        "status": "success",
        "extractor": extractor,
        "count": len(records)
    }


def _upsert_sheet_prices(records: list[dict]):
    """Insert or update products and price_records in Supabase safely.
    Uses upsert on product slug to avoid duplicates, and upsert on
    product_id+week_of for price_records to prevent daily sync bloat.
    """
    sb = get_supabase()
    today_iso = datetime.now().strftime("%Y-%m-%d")

    for rec in records:
        comm_name = rec["commodity_name"]
        category = rec["category"]
        slug = re.sub(r"[^a-z0-9]+", "_", comm_name.lower()).strip("_")
        price_val = rec.get("price_prevailing") or rec.get("price_average") or rec.get("price_low") or 0.0

        # 1. Upsert product by slug (prevents duplicate product rows on every sync)
        prod_id = None
        try:
            # Try to find existing product by slug first
            res_slug = sb.table("products").select("id").eq("slug", slug).execute()
            if res_slug.data:
                prod_id = res_slug.data[0]["id"]
                # Update display_name in case it changed
                sb.table("products").update({"display_name": comm_name, "name": comm_name}).eq("id", prod_id).execute()
            else:
                # Try by exact name
                res_name = sb.table("products").select("id").eq("name", comm_name).execute()
                if res_name.data:
                    prod_id = res_name.data[0]["id"]
                else:
                    # Insert new product
                    prod_payload = {
                        "name": comm_name,
                        "display_name": comm_name,
                        "slug": slug,
                    }
                    new_prod = sb.table("products").insert(prod_payload).execute()
                    if new_prod.data:
                        prod_id = new_prod.data[0]["id"]
        except Exception as e:
            logger.warning(f"Product upsert failed for {comm_name}: {e}")
            continue

        if not prod_id:
            logger.warning(f"Could not resolve or create product_id for {comm_name}")
            continue

        # 2. Check if a price record already exists for this product + week
        #    If yes: update it. If no: insert it. This prevents duplicate rows
        #    on every daily sync run.
        price_payload = {
            "product_id": prod_id,
            "price_per_kg": float(price_val),
            "source": rec.get("source", "DA Bantay Presyo (Sheet Sync)"),
            "week_of": today_iso,
        }

        try:
            # Check for existing record this week
            existing = (
                sb.table("price_records")
                .select("id")
                .eq("product_id", prod_id)
                .eq("week_of", today_iso)
                .execute()
            )
            if existing.data:
                # Update existing record for this week
                sb.table("price_records").update(price_payload).eq("id", existing.data[0]["id"]).execute()
                logger.debug(f"Updated price record for {comm_name} (week {today_iso})")
            else:
                # Insert new record for this week
                sb.table("price_records").insert(price_payload).execute()
                logger.debug(f"Inserted price record for {comm_name} (week {today_iso})")
        except Exception as e:
            logger.warning(f"Price record upsert failed for {comm_name}: {e}")


def _write_sync_log(extractor: str, status: str, notes: str = None):
    try:
        get_supabase().table("sync_logs").insert({
            "extractor_used": extractor,
            "status": status,
            "pdf_url": "https://docs.google.com/spreadsheets/d/1QW1KwKXEPSPIKqTss0aD56O6knQTFvbK4hjdP5fqdZI",
            "notes": notes,
        }).execute()
    except Exception as e:
        logger.error(f"Failed to write sync log: {e}")
