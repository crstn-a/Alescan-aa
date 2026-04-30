from fastapi import APIRouter, HTTPException
from services.db import get_supabase, log_error

router = APIRouter()

@router.get("/prices/{slug}")
def get_price_by_slug(slug: str):
    """Return latest SRP for one commodity by its slug."""
    sb = get_supabase()
    try:
        product = (
            sb.table("products")
            .select("id, display_name")
            .eq("slug", slug)
            .single()
            .execute()
        )
    except Exception as e:
        log_error("scan", str(e))
        raise HTTPException(status_code=404, detail="Product not found")

    price = (
        sb.table("price_records")
        .select("price_per_kg, week_of, source")
        .eq("product_id", product.data["id"])
        .order("week_of", desc=True)
        .limit(1)
        .execute()
    )
    if not price.data:
        raise HTTPException(
            status_code=404,
            detail="No price data yet. Run a sync from the admin panel."
        )

    return {
        "slug":         slug,
        "product":      product.data["display_name"],
        "official_srp": price.data[0]["price_per_kg"],
        "week_of":      price.data[0]["week_of"],
        "source":       price.data[0]["source"],
    }


@router.get("/prices")
def get_all_prices():
    """Return latest SRP for all three commodities."""
    slugs = ["pork_liempo", "tilapia_local", "whole_chicken"]
    return [get_price_by_slug(s) for s in slugs]