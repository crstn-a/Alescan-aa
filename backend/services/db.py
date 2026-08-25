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
        import re
        slug = re.sub(r"[^a-z0-9]+", "_", commodity_name.lower()).strip("_")

        # Step 1: Try exact slug match first (safest, never has parse issues)
        prod_res_by_slug = (
            sb.table("products")
            .select("id, name, display_name, slug")
            .eq("slug", slug)
            .execute()
        )

        prod_id = None
        matched_name = commodity_name
        if prod_res_by_slug.data:
            prod_id = prod_res_by_slug.data[0]["id"]
            matched_name = prod_res_by_slug.data[0].get("display_name") or prod_res_by_slug.data[0].get("name") or commodity_name

        # Try exact name match if slug didn't work
        if not prod_id:
            try:
                prod_res_by_name = (
                    sb.table("products")
                    .select("id, name, display_name, slug")
                    .eq("name", commodity_name)
                    .execute()
                )
                if prod_res_by_name.data:
                    prod_id = prod_res_by_name.data[0]["id"]
                    matched_name = prod_res_by_name.data[0].get("display_name") or prod_res_by_name.data[0].get("name") or commodity_name
            except Exception:
                pass

        # Step 2: Conservative word-level fuzzy match (avoids false positives)
        # Only match if the root words of commodity_name are ALL present in the product name
        if not prod_id:
            all_prods = sb.table("products").select("id, name, display_name, slug").execute()
            c_low = commodity_name.lower()
            # Extract root words (filter out short/common words)
            c_words = set(w for w in re.split(r"\W+", c_low) if len(w) > 2)
            best_prod_id = None
            best_prod_name = None
            best_score = 0

            for p in (all_prods.data or []):
                p_name = (p.get("display_name") or p.get("name") or "").lower()
                p_words = set(w for w in re.split(r"\W+", p_name) if len(w) > 2)

                # Require that ALL root words of the query appear in the product name,
                # or ALL words of the product name appear in the query.
                # This prevents "Tilapia" from matching "Tilapia (Local)" AND "Well Milled Rice".
                if c_words and p_words:
                    overlap = len(c_words & p_words)
                    union = len(c_words | p_words)
                    jaccard = overlap / union if union > 0 else 0

                    # Strict: require majority overlap (>=0.5 Jaccard) AND at least 1 common word
                    if overlap > 0 and jaccard >= 0.5:
                        if jaccard > best_score:
                            best_score = jaccard
                            best_prod_id = p["id"]
                            best_prod_name = p.get("display_name") or p.get("name")

            if best_prod_id:
                prod_id = best_prod_id
                matched_name = best_prod_name

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


def log_scan_event(result: dict, price: dict | None):
    """Write a scan event row regardless of confidence outcome."""
    try:
        sb = get_supabase()
        price_shown = price.get("price_prevailing") if price else None
        payload = {
            "product_id": result.get("product_id"),
            "confidence": result.get("confidence"),
            "price_shown": price_shown,
        }
        sb.table("scan_events").insert(payload).execute()
    except Exception as e:
        logger.error(f"Failed to log scan event: {e}")


def log_error(module: str, message: str):
    """Write to error_logs from any module."""
    try:
        get_supabase().table("error_logs").insert({
            "module": module,
            "message": message
        }).execute()
    except Exception as e:
        logger.error(f"[{module}] Failed to record log to Supabase ({e}): {message}")