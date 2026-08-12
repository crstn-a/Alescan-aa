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

    # ── Stage 4: Refresh YOLO-World Dynamic Prompts ──────────
    try:
        from services.vision import refresh_yolo_world_prompts
        refresh_yolo_world_prompts()
    except Exception as e:
        logger.warning(f"Vision prompt refresh non-fatal warning: {e}")

    # ── Stage 5: Log Success ────────────────────────────────
    _write_sync_log(extractor, "success", f"Inserted {len(records)} prices from DA Google Sheet")
    logger.info(f"Sync complete — {len(records)} prices via {extractor}")

    return {
        "status": "success",
        "extractor": extractor,
        "count": len(records)
    }


def _upsert_sheet_prices(records: list[dict]):
    """Insert or update products and price_records in Supabase."""
    sb = get_supabase()

    for rec in records:
        comm_name = rec["commodity_name"]
        category = rec["category"]
        slug = re.sub(r"[^a-z0-9]+", "_", comm_name.lower()).strip("_")

        # 1. Upsert product entry
        prod_res = (
            sb.table("products")
            .select("id")
            .eq("commodity_name", comm_name)
            .execute()
        )

        product_id = None
        if prod_res.data:
            product_id = prod_res.data[0]["id"]
            sb.table("products").update({
                "slug": slug,
                "category": category,
            }).eq("id", product_id).execute()
        else:
            new_prod = sb.table("products").insert({
                "commodity_name": comm_name,
                "display_name": comm_name,
                "slug": slug,
                "category": category,
            }).execute()
            if new_prod.data:
                product_id = new_prod.data[0]["id"]

        # 2. Insert price record
        sb.table("price_records").insert({
            "product_id": product_id,
            "category": category,
            "commodity_name": comm_name,
            "specification": rec.get("specification"),
            "unit": rec.get("unit", "kg"),
            "price_low": rec.get("price_low"),
            "price_high": rec.get("price_high"),
            "price_average": rec.get("price_average"),
            "price_prevailing": rec.get("price_prevailing"),
            "period_month": rec.get("period_month"),
            "period_year": rec.get("period_year"),
            "source": rec.get("source", "DA Bantay Presyo (Sheet Sync)"),
        }).execute()


def _write_sync_log(extractor: str, status: str, notes: str = None):
    try:
        get_supabase().table("sync_logs").insert({
            "extractor_used": extractor,
            "status": status,
            "pdf_url": "https://docs.google.com/spreadsheets/d/1gRn9QDtVOKjHPj-T89VqkrZf1DMeNU-NEViXgAH2hOQ",
            "notes": notes,
        }).execute()
    except Exception as e:
        logger.error(f"Failed to write sync log: {e}")