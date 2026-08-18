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
        res = sb.table("products").select("commodity_name").execute()
        names = []
        if res.data:
            for row in res.data:
                c_name = row.get("commodity_name")
                if c_name and c_name not in names:
                    names.append(c_name)
        if not names:
            # Fallback query from price_records
            p_res = sb.table("price_records").select("commodity_name").execute()
            if p_res.data:
                for row in p_res.data:
                    c_name = row.get("commodity_name")
                    if c_name and c_name not in names:
                        names.append(c_name)
        return names
    except Exception as e:
        logger.error(f"Failed to fetch active commodities: {e}")
        return []


def get_latest_price(commodity_name: str) -> dict | None:
    """
    Fetch the most recent monitored price for a commodity name.
    If multiple specification rows exist for one commodity name (e.g. Bangus Local vs Imported),
    prefers "Local" over "Imported", else returns the first matching row.
    """
    sb = get_supabase()
    try:
        # Query latest records for this commodity_name
        res = (
            sb.table("price_records")
            .select("id, category, commodity_name, specification, unit, price_low, price_high, price_average, price_prevailing, period_month, period_year, source, created_at")
            .ilike("commodity_name", commodity_name)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        if not res.data:
            # Try fuzzy or slug match if exact commodity_name query returned 0
            res = (
                sb.table("price_records")
                .select("id, category, commodity_name, specification, unit, price_low, price_high, price_average, price_prevailing, period_month, period_year, source, created_at")
                .order("created_at", desc=True)
                .limit(50)
                .execute()
            )
            matched = [r for r in (res.data or []) if r.get("commodity_name", "").lower() == commodity_name.lower()]
            if not matched:
                return None
            records = matched
        else:
            records = res.data

        # Spec auto-resolution logic: prefer "Local" over "Imported" when both exist, else first
        local_recs = [r for r in records if r.get("specification") and "local" in r.get("specification", "").lower()]
        if local_recs:
            return local_recs[0]
        
        non_imported = [r for r in records if not (r.get("specification") and "imported" in r.get("specification", "").lower())]
        if non_imported:
            return non_imported[0]
        
        return records[0]
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