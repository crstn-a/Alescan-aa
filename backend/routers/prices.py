from fastapi import APIRouter, HTTPException
from services.db import get_supabase, get_latest_price, get_all_active_commodities, log_error

router = APIRouter()


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
    try:
        commodities = get_all_active_commodities()
        if not commodities:
            sb = get_supabase()
            res = sb.table("products").select("name, display_name").execute()
            if res.data:
                commodities = list(dict.fromkeys([r.get("display_name") or r.get("name") for r in res.data if (r.get("display_name") or r.get("name"))]))
        
        results = []
        for comm in commodities:
            p = get_latest_price(comm)
            if p:
                results.append({
                    "commodity_name":   p.get("commodity_name", comm),
                    "product":          p.get("commodity_name", comm),
                    "category":         p.get("category", "General"),
                    "specification":    p.get("specification"),
                    "unit":             p.get("unit", "kg"),
                    "price_prevailing": p.get("price_prevailing"),
                    "price_low":        p.get("price_low"),
                    "price_high":       p.get("price_high"),
                    "price_average":    p.get("price_average"),
                    "period_month":     p.get("period_month"),
                    "period_year":      p.get("period_year"),
                    "source":           p.get("source", "DA Bantay Presyo (Sheet Sync)"),
                })
        return results
    except Exception as e:
        log_error("prices", str(e))
        raise HTTPException(status_code=500, detail=str(e))