import logging
from collections import defaultdict
from datetime import datetime, timedelta
from services.db import get_supabase

logger = logging.getLogger(__name__)

def get_analytics_prices():
    try:
        sb = get_supabase()
        # Fetch the latest prices for active products
        prices = sb.table("price_records").select("price_per_kg, week_of, source, products(display_name)").order("week_of", desc=False).execute()
        
        # Group by product and week
        data = defaultdict(list)
        for row in prices.data:
            if not row.get("products"): continue
            prod_name = row["products"]["display_name"]
            data[prod_name].append({
                "date": row["week_of"],
                "price": row["price_per_kg"],
                "source": row["source"]
            })
        
        # Format for Recharts: { name: "Week 1", "Whole Chicken": 200, "Tilapia": 150 }
        # Let's get all unique dates
        all_dates = sorted(list(set([row["week_of"] for row in prices.data])))
        
        chart_data = []
        for d in all_dates:
            entry = {"date": d}
            for prod_name, records in data.items():
                # find the record for this date or the last known price
                price_for_date = next((r["price"] for r in records if r["date"] == d), None)
                if price_for_date is not None:
                    entry[prod_name] = price_for_date
                else:
                    # carry over the last known price if it exists
                    past_prices = [r["price"] for r in records if r["date"] <= d]
                    if past_prices:
                        entry[prod_name] = past_prices[-1]
            chart_data.append(entry)
            
        return chart_data
    except Exception as e:
        logger.error(f"Error fetching analytics prices: {e}")
        return []

def get_analytics_scans():
    try:
        sb = get_supabase()
        
        # Fetch recent scan events
        seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
        scans = sb.table("scan_events").select("confidence, scanned_at, products(display_name)").gte("scanned_at", seven_days_ago).execute()
        
        # 1. Detection performance (pie chart)
        success = 0
        low_conf = 0
        failed = 0
        
        # 2. Daily volume
        daily_volume = defaultdict(int)
        
        # 3. Commodity performance
        commodity_perf = defaultdict(lambda: {"total": 0, "failed": 0, "success": 0})
        
        for row in scans.data:
            conf = row["confidence"] or 0
            is_success = conf >= 0.75
            is_low_conf = 0.5 <= conf < 0.75
            is_failed = conf < 0.5 or not row.get("products")
            
            if is_success: success += 1
            elif is_low_conf: low_conf += 1
            else: failed += 1
            
            date_str = row["scanned_at"][:10] # YYYY-MM-DD
            daily_volume[date_str] += 1
            
            prod_name = row.get("products", {}).get("display_name", "Unidentified") if row.get("products") else "Unidentified"
            commodity_perf[prod_name]["total"] += 1
            if is_failed or is_low_conf:
                commodity_perf[prod_name]["failed"] += 1
            else:
                commodity_perf[prod_name]["success"] += 1

        volume_chart = [{"date": k, "scans": v} for k, v in sorted(daily_volume.items())]
        perf_chart = [{"name": k, "Success": v["success"], "Failed/Low Conf": v["failed"]} for k, v in commodity_perf.items()]
        
        return {
            "detection_split": [
                {"name": "High Confidence", "value": success},
                {"name": "Low Confidence", "value": low_conf},
                {"name": "Failed/Unidentified", "value": failed}
            ],
            "daily_volume": volume_chart,
            "commodity_performance": perf_chart
        }
    except Exception as e:
        logger.error(f"Error fetching scan analytics: {e}")
        return {"detection_split": [], "daily_volume": [], "commodity_performance": []}

def get_analytics_evaluations():
    try:
        sb = get_supabase()
        models = sb.table("model_evaluations").select("*").order("created_at", desc=False).execute()
        extractors = sb.table("extractor_evaluations").select("*").order("created_at", desc=False).execute()
        
        return {
            "models": models.data,
            "extractors": extractors.data
        }
    except Exception as e:
        logger.error(f"Error fetching evaluations: {e}")
        return {"models": [], "extractors": []}
