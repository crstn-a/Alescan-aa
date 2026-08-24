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
    """
    if not commodity_name:
        return None
    sb = get_supabase()
    try:
        # Step 1: Query products table by name, display_name, or slug
        import re
        slug = re.sub(r"[^a-z0-9]+", "_", commodity_name.lower()).strip("_")
        
        prod_res = (
            sb.table("products")
            .select("id, name, display_name, slug")
            .or_(f"name.ilike.{commodity_name},display_name.ilike.{commodity_name},slug.eq.{slug}")
            .execute()
        )
        
        prod_id = None
        matched_name = commodity_name
        if prod_res.data:
            prod_id = prod_res.data[0]["id"]
            matched_name = prod_res.data[0].get("display_name") or prod_res.data[0].get("name") or commodity_name

        # If not found by exact/or, try fuzzy matching against all products
        if not prod_id:
            all_prods = sb.table("products").select("id, name, display_name, slug").execute()
            c_low = commodity_name.lower()
            for p in (all_prods.data or []):
                p_name = (p.get("display_name") or p.get("name") or "").lower()
                if c_low in p_name or p_name in c_low:
                    prod_id = p["id"]
                    matched_name = p.get("display_name") or p.get("name")
                    break

        if prod_id:
            price_res = (
                sb.table("price_records")
                .select("*")
                .eq("product_id", prod_id)
                .order("created_at", desc=True)
                .limit(10)
                .execute()
            )
            if price_res.data:
                records = price_res.data
                local_recs = [r for r in records if r.get("specification") and "local" in str(r.get("specification")).lower()]
                rec = local_recs[0] if local_recs else records[0]
                
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

        # Fallback: direct query if price_records has commodity_name column
        try:
            p_direct = (
                sb.table("price_records")
                .select("*")
                .ilike("commodity_name", commodity_name)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if p_direct.data:
                rec = p_direct.data[0]
                price_val = float(rec.get("price_prevailing") or rec.get("price_per_kg") or 0.0)
                return {
                    "id": rec.get("id"),
                    "product_id": rec.get("product_id"),
                    "commodity_name": rec.get("commodity_name") or commodity_name,
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
        except Exception:
            pass

        return None
    except Exception as e:
        logger.error(f"get_latest_price failed for {commodity_name}: {e}")
        return None


def log_scan_event(result: dict, price: dict | None, latitude: float | None = None, longitude: float | None = None, location_name: str | None = None):
    """Write a scan event row regardless of confidence outcome, including geolocation parameters if provided."""
    try:
        sb = get_supabase()
        price_shown = price.get("price_prevailing") if price else None
        payload = {
            "product_id": result.get("product_id"),
            "confidence": result.get("confidence"),
            "price_shown": price_shown,
        }
        if latitude is not None:
            payload["latitude"] = float(latitude)
        if longitude is not None:
            payload["longitude"] = float(longitude)
        if location_name:
            payload["location_name"] = location_name

        try:
            sb.table("scan_events").insert(payload).execute()
        except Exception as insert_err:
            # Fallback to basic payload if latitude/longitude columns are not yet migrated in Supabase
            if "latitude" in str(insert_err) or "column" in str(insert_err):
                logger.warning(f"Geolocation columns missing in Supabase scan_events, falling back: {insert_err}")
                sb.table("scan_events").insert({
                    "product_id": result.get("product_id"),
                    "confidence": result.get("confidence"),
                    "price_shown": price_shown,
                }).execute()
            else:
                raise insert_err
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