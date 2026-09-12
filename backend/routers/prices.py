import time
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from services.db import get_supabase, get_latest_price, log_error

router = APIRouter()

# In-memory TTL cache for all prices
_PRICES_CACHE: Optional[List[Dict[str, Any]]] = None
_PRICES_CACHE_TIME: float = 0.0
CACHE_TTL_SECONDS = 30.0


def clear_prices_cache():
    """Invalidate prices cache, e.g. when sync runs."""
    global _PRICES_CACHE, _PRICES_CACHE_TIME
    _PRICES_CACHE = None
    _PRICES_CACHE_TIME = 0.0


def fetch_all_latest_prices_batch() -> List[Dict[str, Any]]:
    """
    Fetch the latest price records for all active commodities in 2 batch queries
    instead of N+1 individual queries.
    """
    sb = get_supabase()

    # 1. Fetch all products
    prod_res = sb.table("products").select("id, name, display_name, slug").execute()
    products = prod_res.data or []
    if not products:
        return []

    prod_map = {}
    for p in products:
        prod_id = p.get("id")
        if prod_id:
            prod_map[prod_id] = p.get("display_name") or p.get("name") or ""

    # 2. Fetch price records ordered by week_of / created_at descending
    price_res = (
        sb.table("price_records")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    records = price_res.data or []

    # Group by product_id to pick the latest price record for each product
    seen_prod_ids = set()
    results = []

    for r in records:
        pid = r.get("product_id")
        if not pid or pid in seen_prod_ids:
            continue
        
        seen_prod_ids.add(pid)
        comm_name = r.get("commodity_name") or prod_map.get(pid) or "Commodity"
        price_val = float(r.get("price_prevailing") or r.get("price_per_kg") or 0.0)

        results.append({
            "commodity_name": comm_name,
            "product": comm_name,
            "category": r.get("category", "General"),
            "specification": r.get("specification"),
            "unit": r.get("unit", "kg"),
            "price_prevailing": price_val,
            "price_low": float(r.get("price_low") if r.get("price_low") is not None else price_val),
            "price_high": float(r.get("price_high") if r.get("price_high") is not None else price_val),
            "price_average": float(r.get("price_average") if r.get("price_average") is not None else price_val),
            "period_month": r.get("period_month"),
            "period_year": r.get("period_year"),
            "source": r.get("source", "DA Bantay Presyo (Sheet Sync)"),
        })

    return results


@router.get("/prices/{identifier}")
def get_price_by_identifier(identifier: str):
    """Return latest monitored market price for a commodity name or slug."""
    price = get_latest_price(identifier)
    if not price:
        raise HTTPException(
            status_code=404,
            detail=f"No price record found for '{identifier}'. Run a sheet sync from Admin."
        )

    return {
        "commodity_name":   price.get("commodity_name", identifier),
        "product":          price.get("commodity_name", identifier),
        "category":         price.get("category", "General"),
        "specification":    price.get("specification"),
        "unit":             price.get("unit", "kg"),
        "price_prevailing": price.get("price_prevailing"),
        "price_low":        price.get("price_low"),
        "price_high":       price.get("price_high"),
        "price_average":    price.get("price_average"),
        "period_month":     price.get("period_month"),
        "period_year":      price.get("period_year"),
        "source":           price.get("source", "DA Bantay Presyo (Sheet Sync)"),
    }


@router.get("/prices")
def get_all_prices():
    """Return latest monitored market price for all active commodities."""
    global _PRICES_CACHE, _PRICES_CACHE_TIME
    now = time.time()

    # Serve from cache if fresh
    if _PRICES_CACHE is not None and (now - _PRICES_CACHE_TIME) < CACHE_TTL_SECONDS:
        return _PRICES_CACHE

    try:
        results = fetch_all_latest_prices_batch()
        _PRICES_CACHE = results
        _PRICES_CACHE_TIME = now
        return results
    except Exception as e:
        log_error("prices", str(e))
        raise HTTPException(status_code=500, detail=str(e))
