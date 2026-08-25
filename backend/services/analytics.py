import logging
from collections import defaultdict
from datetime import datetime, timedelta
from services.db import get_supabase

logger = logging.getLogger(__name__)

def get_analytics_prices():
    try:
        sb = get_supabase()
        # Query price records safely using valid columns
        try:
            res = (
                sb.table("price_records")
                .select("price_per_kg, price_prevailing, week_of, created_at, source, commodity_name, products(display_name, name)")
                .order("week_of", desc=False)
                .execute()
            )
        except Exception:
            res = (
                sb.table("price_records")
                .select("price_per_kg, week_of, created_at, source, products(display_name, name)")
                .order("week_of", desc=False)
                .execute()
            )
        
        # Group by product and week/date
        data = defaultdict(list)
        for row in (res.data or []):
            prod = row.get("products") or {}
            prod_name = row.get("commodity_name") or prod.get("display_name") or prod.get("name")
            if not prod_name: continue
            
            p_val = float(row.get("price_prevailing") if row.get("price_prevailing") is not None else (row.get("price_per_kg") or 0.0))
            date_val = row.get("week_of") or (row["created_at"][:10] if row.get("created_at") else datetime.now().strftime("%Y-%m-%d"))
            data[prod_name].append({
                "date": date_val,
                "price": p_val,
                "source": row.get("source", "DA Bantay Presyo (Sheet Sync)")
            })
        
        all_dates = sorted(list(set([
            row.get("week_of") or (row["created_at"][:10] if row.get("created_at") else datetime.now().strftime("%Y-%m-%d"))
            for row in (res.data or [])
        ])))
        
        chart_data = []
        for d in all_dates:
            entry = {"date": d}
            for prod_name, records in data.items():
                price_for_date = next((r["price"] for r in records if r["date"] == d), None)
                if price_for_date is not None:
                    entry[prod_name] = price_for_date
                else:
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
        
        # Fetch ALL scan events for detection performance (overall totals)
        all_scans = sb.table("scan_events").select("confidence, scanned_at, products(display_name)").execute()
        
        # 1. Detection performance (pie chart) - overall totals
        success = 0
        low_conf = 0
        failed = 0
        total = len(all_scans.data)
        
        # 2. Daily volume (last 7 days only)
        seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
        daily_volume = defaultdict(int)
        
        # 3. Commodity performance — initialize for ALL active products so every commodity is tracked
        commodity_perf = defaultdict(lambda: {"total": 0, "failed": 0, "low_conf": 0, "success": 0})
        
        try:
            db_prods = sb.table("products").select("display_name, name").execute()
            for p in (db_prods.data or []):
                pname = p.get("display_name") or p.get("name")
                if pname:
                    _ = commodity_perf[pname]
        except Exception as e:
            logger.warning(f"Could not pre-populate active products: {e}")

        for row in (all_scans.data or []):
            conf = row.get("confidence") or 0
            is_success = conf >= 0.75
            is_low_conf = 0.5 <= conf < 0.75
            is_failed = conf < 0.5 or not row.get("products")
            
            if is_success: success += 1
            elif is_low_conf: low_conf += 1
            else: failed += 1
            
            # Daily volume only for recent scans
            scanned_at = row.get("scanned_at")
            if scanned_at and scanned_at >= seven_days_ago:
                date_str = scanned_at[:10]  # YYYY-MM-DD
                daily_volume[date_str] += 1
            
            prod = row.get("products") or {}
            prod_name = prod.get("display_name") or prod.get("name") or "Unidentified"
            commodity_perf[prod_name]["total"] += 1
            if is_failed:
                commodity_perf[prod_name]["failed"] += 1
            elif is_low_conf:
                commodity_perf[prod_name]["low_conf"] += 1
            else:
                commodity_perf[prod_name]["success"] += 1

        volume_chart = [{"date": k, "scans": v} for k, v in sorted(daily_volume.items())]
        perf_chart = [
            {"name": k, "total": v["total"], "Success": v["success"], "Low Confidence": v["low_conf"], "Failed": v["failed"]}
            for k, v in sorted(commodity_perf.items(), key=lambda item: (-item[1]["total"], item[0]))
        ]
        
        # Convert detection split to percentages
        if total > 0:
            detection_split = [
                {"name": "High Confidence", "value": round((success / total) * 100, 1)},
                {"name": "Low Confidence", "value": round((low_conf / total) * 100, 1)},
                {"name": "Failed/Unidentified", "value": round((failed / total) * 100, 1)}
            ]
        else:
            detection_split = [
                {"name": "High Confidence", "value": 0},
                {"name": "Low Confidence", "value": 0},
                {"name": "Failed/Unidentified", "value": 0}
            ]
        
        return {
            "total_scans": total,
            "detection_split": detection_split,
            "daily_volume": volume_chart,
            "commodity_performance": perf_chart
        }
    except Exception as e:
        logger.error(f"Error fetching scan analytics: {e}")
        return {"total_scans": 0, "detection_split": [], "daily_volume": [], "commodity_performance": []}

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

def get_daily_volume(start_date: str, end_date: str):
    """Fetch daily scan volume for a specific date range."""
    try:
        sb = get_supabase()
        
        # Query scans within the date range
        scans = (
            sb.table("scan_events")
            .select("scanned_at")
            .gte("scanned_at", f"{start_date}T00:00:00")
            .lte("scanned_at", f"{end_date}T23:59:59")
            .execute()
        )
        
        daily_volume = defaultdict(int)
        for row in scans.data:
            date_str = row["scanned_at"][:10]  # YYYY-MM-DD
            daily_volume[date_str] += 1
        
        # Fill in missing dates with 0
        from datetime import date as date_type
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
        current = start
        result = []
        while current <= end:
            d = current.isoformat()
            result.append({"date": d, "scans": daily_volume.get(d, 0)})
            current += timedelta(days=1)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching daily volume: {e}")
        return []
