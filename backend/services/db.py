import os
from supabase import create_client, Client
from datetime import date

_client: Client = None

def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")  # service_role key
        )
    return _client

def upsert_price_record(*args, **kwargs):
    print("Stub: upsert_price_record called")
    return {"status": "stub"}

def log_sync(*args, **kwargs):
    print("Stub: log_sync called")
    return {"status": "stub"}


def get_latest_price(product_slug: str) -> dict | None:
    """Fetch the most recent SRP for a given product slug."""
    sb = get_supabase()
    product = (
        sb.table("products")
        .select("id")
        .eq("slug", product_slug)
        .single()
        .execute()
    )
    if not product.data:
        return None

    price = (
        sb.table("price_records")
        .select("price_per_kg, week_of, source")
        .eq("product_id", product.data["id"])
        .order("week_of", desc=True)
        .limit(1)
        .execute()
    )
    return price.data[0] if price.data else None


def log_scan_event(result: dict, price: dict | None):
    """Write a scan event row regardless of confidence outcome."""
    sb = get_supabase()
    sb.table("scan_events").insert({
        "product_id": result.get("product_id"),
        "confidence": result.get("confidence"),
        "price_shown": price["price_per_kg"] if price else None,
    }).execute()


def log_error(module: str, message: str):
    """Write to error_logs from any module."""
    get_supabase().table("error_logs").insert({
        "module": module,
        "message": message
    }).execute()