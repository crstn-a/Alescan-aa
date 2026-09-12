import os
import logging
from datetime import date
from supabase import create_client, Client

logger = logging.getLogger(__name__)
_client: Client = None

def get_supabase() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be configured in environment variables.")
        _client = create_client(url, key)
    return _client


def get_all_active_commodities() -> list[str]:
    """Return distinct list of commodity names currently present in price_records/products."""
    try:
        sb = get_supabase()
        names = []
        res = sb.table("products").select("name, display_name").execute()
        if res.data:
            for row in res.data:
                c_name = row.get("display_name") or row.get("name")
                if c_name and c_name not in names:
                    names.append(c_name)
        if not names:
            try:
                p_res = sb.table("price_records").select("commodity_name").execute()
                if p_res.data:
                    for row in p_res.data:
                        c_name = row.get("commodity_name")
                        if c_name and c_name not in names:
                            names.append(c_name)
            except Exception:
                pass
        return names
    except Exception as e:
        logger.error(f"Failed to fetch active commodities: {e}")
        return []


def get_product_by_name(commodity_name: str) -> dict | None:
    """
    Fetch product record from 'products' table by slug, exact name, or fuzzy match.
    Returns dict containing product 'id', 'name', 'display_name', 'slug', or None.
    """
    if not commodity_name:
        return None
    sb = get_supabase()
    try:
        import re
        slug = re.sub(r"[^a-z0-9]+", "_", commodity_name.lower()).strip("_")

        # Step 1: Exact slug match
        prod_res_by_slug = (
            sb.table("products")
            .select("id, name, display_name, slug")
            .eq("slug", slug)
            .execute()
        )
        if prod_res_by_slug.data:
            return prod_res_by_slug.data[0]

        # Step 2: Exact name match
        try:
            prod_res_by_name = (
                sb.table("products")
                .select("id, name, display_name, slug")
                .eq("name", commodity_name)
                .execute()
            )
            if prod_res_by_name.data:
                return prod_res_by_name.data[0]
        except Exception:
            pass

        # Step 3: Word-level fuzzy match
        all_prods = sb.table("products").select("id, name, display_name, slug").execute()
        c_low = commodity_name.lower()
        c_words = set(w for w in re.split(r"\W+", c_low) if len(w) > 2)
        best_prod = None
        best_score = 0

        for p in (all_prods.data or []):
            p_name = (p.get("display_name") or p.get("name") or "").lower()
            p_words = set(w for w in re.split(r"\W+", p_name) if len(w) > 2)

            if c_words and p_words:
                overlap = len(c_words & p_words)
                union = len(c_words | p_words)
                jaccard = overlap / union if union > 0 else 0

                if overlap > 0 and jaccard >= 0.5:
                    if jaccard > best_score:
                        best_score = jaccard
                        best_prod = p

        return best_prod
    except Exception as e:
        logger.error(f"get_product_by_name failed for {commodity_name}: {e}")
        return None


def get_latest_price(commodity_name: str) -> dict | None:
    """
    Fetch the most recent monitored price for a commodity name.
    Tries exact match by product name/slug first, then a conservative
    fuzzy match (requires full root word match, not just substring).
    """
    if not commodity_name:
        return None
    sb = get_supabase()
    try:
        prod = get_product_by_name(commodity_name)
        prod_id = prod["id"] if prod else None
        matched_name = (prod.get("display_name") or prod.get("name") if prod else commodity_name)

        if prod_id:
            price_res = (
                sb.table("price_records")
                .select("*")
                .eq("product_id", prod_id)
                .order("week_of", desc=True)   # Use week_of: most recent DA price data window
                .limit(1)
                .execute()
            )
            if price_res.data:
                rec = price_res.data[0]
                price_val = float(rec.get("price_prevailing") or rec.get("price_per_kg") or 0.0)
                return {
                    "id": rec.get("id"),
                    "product_id": prod_id,
                    "commodity_name": rec.get("commodity_name") or matched_name,
                    "category": rec.get("category", "General"),
                    "specification": rec.get("specification"),
                    "unit": rec.get("unit", "kg"),
                    "price_prevailing": price_val,
                    "price_low": float(rec.get("price_low") if rec.get("price_low") is not None else price_val),
                    "price_high": float(rec.get("price_high") if rec.get("price_high") is not None else price_val),
                    "price_average": float(rec.get("price_average") if rec.get("price_average") is not None else price_val),
                    "price_per_kg": float(rec.get("price_per_kg") or price_val),
                    "source": rec.get("source", "DA Bantay Presyo (Sheet Sync)"),
                    "period_month": rec.get("period_month"),
                    "period_year": rec.get("period_year"),
                    "created_at": rec.get("created_at"),
                }

        logger.warning(f"No price record found for commodity: {commodity_name}")
        return None
    except Exception as e:
        logger.error(f"get_latest_price failed for {commodity_name}: {e}")
        return None


def log_scan_event(
    result: dict,
    price: dict | None,
    latitude: float | None = None,
    longitude: float | None = None,
    location_accuracy: float | None = None,
    client_scanned_at: str | None = None,
    processing_latency_ms: float | None = None,
):
    """Write a scan event row regardless of confidence outcome."""
    try:
        sb = get_supabase()
        product_id = result.get("product_id") if isinstance(result, dict) else None
        if not product_id and price and isinstance(price, dict):
            product_id = price.get("product_id")
        if not product_id and result and isinstance(result, dict) and result.get("commodity_name"):
            prod = get_product_by_name(result.get("commodity_name"))
            if prod:
                product_id = prod.get("id")

        price_shown = price.get("price_prevailing") if price and isinstance(price, dict) else None

        # Validate coordinates & accuracy
        if latitude is not None and not (-90.0 <= latitude <= 90.0):
            latitude = None
        if longitude is not None and not (-180.0 <= longitude <= 180.0):
            longitude = None
        if location_accuracy is not None and location_accuracy < 0:
            location_accuracy = None

        payload = {
            "product_id": product_id,
            "confidence": result.get("confidence") if isinstance(result, dict) else None,
            "price_shown": price_shown,
            "latitude": latitude,
            "longitude": longitude,
            "location_accuracy": location_accuracy,
            "client_scanned_at": client_scanned_at,
            "processing_latency_ms": processing_latency_ms,
        }
        sb.table("scan_events").insert(payload).execute()
    except Exception as e:
        logger.error(f"Failed to log scan event: {e}")



def format_friendly_error(module: str, message: str) -> str:
    """
    Translates raw technical error messages and exception stack traces
    into clear, non-technical descriptions for administration error logging.
    Example: 'Could not load YOLOv26 model from best.pt, contact developer'
    """
    if not message:
        return f"An unknown issue occurred in the {module or 'system'} module, contact developer"

    msg_lower = message.lower()

    # 1. Vision / YOLO Model loading or inference errors
    if any(k in msg_lower for k in ["best.pt", "yolo", "model weights", "ultralytics", "cuda", "pytorch"]):
        if "not found" in msg_lower or "best.pt" in msg_lower or "weights" in msg_lower:
            return "Could not load YOLOv26 model from best.pt, contact developer"
        return "AI vision model error encountered during detection, contact developer"

    if "decode image" in msg_lower or "image read" in msg_lower or "cannot identify image" in msg_lower:
        return "Could not decode uploaded scan image file, contact developer"

    # 2. Sync / DA Google Sheet errors
    if any(k in msg_lower for k in ["sheet", "google sheet", "csv", "fetch_sheet", "parse_sheet"]):
        return "Could not fetch or sync commodity prices from DA Google Sheet, contact developer"

    if "upsert failed" in msg_lower or "upsert error" in msg_lower:
        return "Could not update database price records during sync, contact developer"

    # 3. Database / Supabase / Network connection errors
    if any(k in msg_lower for k in ["postgrest", "supabase", "connection refused", "timeout", "socket", "500", "503", "jwt"]):
        return f"Database connection issue encountered in {module or 'system'} module, contact developer"

    # 4. Admin / Query / Endpoint operation failures
    if "get_stats" in msg_lower or "scan_logs" in msg_lower or "sync_logs" in msg_lower or "error_logs" in msg_lower:
        return f"Failed to load administrative logs or statistics in {module or 'system'} module, contact developer"

    if "user_register" in msg_lower or "submit_report" in msg_lower or "my_reports" in msg_lower:
        return f"Vendor report processing issue in {module or 'system'} module, contact developer"

    if "violation" in msg_lower:
        return f"Consumer violation complaint handling issue in {module or 'system'} module, contact developer"

    # 5. Clean fallback: Strip Python exception headers & stack traces if present
    cleaned = message
    if ":" in cleaned and any(cleaned.startswith(p) for p in ["RuntimeError", "ValueError", "Exception", "KeyError", "TypeError", "AttributeError", "HTTPException"]):
        cleaned = cleaned.split(":", 1)[1].strip()

    import re
    cleaned = re.sub(r'[A-Za-z]:\\[^:\n]+', '', cleaned)
    cleaned = re.sub(r'/[^\s:\n]+', '', cleaned)
    cleaned = cleaned.strip(" .:")

    if not cleaned:
        cleaned = f"An issue occurred in the {module or 'system'} module"

    if "contact developer" not in cleaned.lower() and "contact admin" not in cleaned.lower():
        cleaned = f"{cleaned}, contact developer"

    return cleaned


def log_error(module: str, message: str):
    """Write to error_logs from any module with non-tech friendly description."""
    friendly_message = format_friendly_error(module, message)
    try:
        get_supabase().table("error_logs").insert({
            "module": module,
            "message": friendly_message
        }).execute()
    except Exception as e:
        logger.error(f"[{module}] Failed to record log to Supabase ({e}): {friendly_message}")

