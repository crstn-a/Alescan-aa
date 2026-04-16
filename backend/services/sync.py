import os
import logging
from datetime import date
from services.pdf_fetcher import fetch_latest_pdf, cleanup_pdf
from services.extractor_docling import extract_with_docling
from services.extractor_llamaparse import extract_with_llamaparse
from services.normalizer import normalize_rows
from services.db import get_supabase, log_error

logger = logging.getLogger(__name__)


def run_sync() -> dict:
    """
    Full sync pipeline. Called by scheduler every Monday 8AM PHT
    and by POST /admin/sync for manual triggers.
    Returns a result dict logged to sync_logs.
    """
    pdf_path = None

    # Stage 1: Fetch PDF
    try:
        logger.info("Starting price sync...")
        pdf_path = fetch_latest_pdf()
        logger.info(f"PDF downloaded to: {pdf_path}")
    except Exception as e:
        log_error("sync", f"PDF fetch failed: {e}")
        return {"status": "failed", "stage": "fetch", "error": str(e)}

    # Stage 2: Extract prices (docling first, llamaparse fallback)
    extractor = "docling"
    rows = []
    try:
        rows = extract_with_docling(pdf_path)
        if not rows:
            raise ValueError("docling returned 0 commodity rows")
        logger.info(f"docling extracted {len(rows)} raw rows")
    except Exception as e:
        logger.warning(f"docling failed ({e}) — switching to llamaparse")
        log_error("sync", f"docling failed: {e}")
        extractor = "llamaparse"
        try:
            rows = extract_with_llamaparse(pdf_path)
            if not rows:
                raise ValueError("llamaparse returned 0 commodity rows")
            logger.info(f"llamaparse extracted {len(rows)} raw rows")
        except Exception as e2:
            log_error("sync", f"llamaparse also failed: {e2}")
            _write_sync_log(extractor, "failed", f"Both extractors failed: {e2}")
            if pdf_path: cleanup_pdf(pdf_path)
            return {"status": "failed", "extractor": extractor, "error": str(e2)}
    finally:
        if pdf_path: cleanup_pdf(pdf_path)

    # Stage 3: Normalize — match names → slugs, validate price range
    normalized = normalize_rows(rows)
    if not normalized:
        _write_sync_log(extractor, "failed", "No rows matched after normalization")
        return {"status": "failed", "error": "normalization returned 0 rows"}

    # Stage 4: Upsert to price_records
    _upsert_prices(normalized)

    # Stage 5: Log success
    _write_sync_log(extractor, "success", f"Upserted {len(normalized)} prices")
    logger.info(f"Sync complete — {len(normalized)} prices via {extractor}")
    return {"status": "success", "extractor": extractor, "count": len(normalized)}


def _upsert_prices(rows: list[dict]):
    """Insert new price_record rows for today's sync."""
    sb = get_supabase()
    today = date.today().isoformat()
    for row in rows:
        product = (
            sb.table("products")
            .select("id")
            .eq("slug", row["slug"])
            .single()
            .execute()
        )
        if not product.data:
            continue
        sb.table("price_records").insert({
            "product_id": product.data["id"],
            "price_per_kg": row["price"],
            "week_of": row.get("week_of", today),
            "source": "DA Bantay Presyo",
        }).execute()


def _write_sync_log(extractor: str, status: str, notes: str = None):
    get_supabase().table("sync_logs").insert({
        "extractor_used": extractor,
        "status": status,
        "pdf_url": os.getenv("DA_PDF_URL", "https://www.da.gov.ph/price-monitoring/"),
        "notes": notes,
    }).execute()