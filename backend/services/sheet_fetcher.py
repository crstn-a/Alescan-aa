import os
import csv
import io
import re
import logging
import requests
from datetime import datetime

logger = logging.getLogger(__name__)

DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1gRn9QDtVOKjHPj-T89VqkrZf1DMeNU-NEViXgAH2hOQ/export?format=csv&gid=0"
SPREADSHEET_ID = "1gRn9QDtVOKjHPj-T89VqkrZf1DMeNU-NEViXgAH2hOQ"

KNOWN_CATEGORIES = [
    "IMPORTED COMMERCIAL RICE",
    "LOCAL COMMERCIAL RICE",
    "CORN PRODUCTS",
    "LEGUMES",
    "FISH PRODUCTS",
    "BEEF PRODUCTS",
    "PORK PRODUCTS",
    "POULTRY PRODUCTS",
    "LOWLAND VEGETABLES",
    "HIGHLAND VEGETABLES",
    "SPICES",
    "FRUITS",
    "OTHER BASIC COMMODITIES",
]


def fetch_sheet_csv() -> str:
    """
    Fetch CSV data from Google Sheet.
    Tries direct CSV export URL first. If HTTP 401/403 or error occurs,
    attempts Google Sheets API v4 fallback if API key / Service Account is configured.
    """
    csv_url = os.getenv("GOOGLE_SHEETS_CSV_URL", DEFAULT_SHEET_URL)
    logger.info(f"Fetching Google Sheet CSV from: {csv_url}")

    try:
        resp = requests.get(csv_url, timeout=15)
        if resp.status_code == 200 and "text/csv" in resp.headers.get("Content-Type", "").lower() or resp.text.strip().startswith(("COMMODITY", "Category", "DAILY", "MONTHLY", "Department", "Region", "Republic")):
            logger.info("Successfully fetched direct CSV stream from Google Sheet")
            return resp.text
        else:
            logger.warning(f"Direct CSV fetch returned status={resp.status_code}, content-type={resp.headers.get('Content-Type')}")
    except Exception as e:
        logger.warning(f"Direct CSV fetch failed ({e}). Trying Sheets API v4 fallback...")

    # Fallback: Google Sheets API v4 using API key or Service Account
    api_key = os.getenv("GOOGLE_SHEETS_API_KEY")
    if api_key:
        logger.info("Attempting Google Sheets API v4 with API Key fallback...")
        api_url = f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/A1:Z200?key={api_key}"
        resp = requests.get(api_url, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            rows = data.get("values", [])
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerows(rows)
            return output.getvalue()
        else:
            logger.error(f"Sheets API v4 returned status {resp.status_code}: {resp.text}")

    # If direct fetch returned raw text (even if headers differed), return it for parsing attempt
    if 'resp' in locals() and resp and resp.text:
        return resp.text

    raise RuntimeError(
        "Could not fetch Google Sheet. Please set the sheet sharing to 'Anyone with the link - Viewer' "
        "or configure GOOGLE_SHEETS_API_KEY in backend/.env"
    )


def clean_price(val: str) -> float | None:
    """Parse numeric price string safely."""
    if not val:
        return None
    cleaned = re.sub(r"[^\d.]", "", str(val).strip())
    if not cleaned:
        return None
    try:
        p = float(cleaned)
        return p if 1.0 <= p <= 5000.0 else None
    except ValueError:
        return None


def parse_sheet_csv(csv_text: str) -> list[dict]:
    """
    Parse DA Monthly Summary CSV into normalized commodity records.
    Handles section headers (ALL-CAPS category rows) and commodity detail rows.
    """
    reader = csv.reader(io.StringIO(csv_text))
    rows = list(reader)

    records = []
    current_category = "GENERAL COMMODITIES"
    now = datetime.now()
    month_name = now.strftime("%B")
    year = now.year

    # Extract month/year from metadata header rows if present
    for row in rows[:10]:
        row_str = " ".join(row).upper()
        month_match = re.search(r"\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\b", row_str)
        if month_match:
            month_name = month_match.group(1).capitalize()
        year_match = re.search(r"\b(202[0-9])\b", row_str)
        if year_match:
            year = int(year_match.group(1))

    header_indices = {}

    for row_idx, row in enumerate(rows):
        if not row or not any(c.strip() for c in row):
            continue

        non_empty = [c.strip() for c in row if c.strip()]
        line_str = " ".join(non_empty).upper()

        # Check if line is a Category Header row (e.g. "PORK PRODUCTS", "FISH PRODUCTS")
        matched_cat = None
        for cat in KNOWN_CATEGORIES:
            if cat in line_str and len(non_empty) <= 3:
                matched_cat = cat
                break
        
        if not matched_cat and len(non_empty) == 1 and non_empty[0].isupper() and len(non_empty[0]) > 3:
            # Single ALL-CAPS text column row is a category header
            matched_cat = non_empty[0].title()

        if matched_cat:
            current_category = matched_cat.title()
            continue

        # Look for table header column mapping (COMMODITY, SPECIFICATION, UNIT, LOW, HIGH, AVERAGE, PREVAILING)
        if "COMMODITY" in line_str or "PREVAILING" in line_str:
            for idx, col in enumerate(row):
                c_clean = col.strip().upper()
                if "COMMODITY" in c_clean:
                    header_indices["commodity"] = idx
                elif "SPECIFICATION" in c_clean or "SPEC" in c_clean:
                    header_indices["specification"] = idx
                elif "UNIT" in c_clean:
                    header_indices["unit"] = idx
                elif "LOW" in c_clean:
                    header_indices["low"] = idx
                elif "HIGH" in c_clean:
                    header_indices["high"] = idx
                elif "AVG" in c_clean or "AVERAGE" in c_clean:
                    header_indices["average"] = idx
                elif "PREVAILING" in c_clean:
                    header_indices["prevailing"] = idx
            continue

        # Commodity row parsing logic
        # Expect at least a commodity name and at least one price field
        col_comm = header_indices.get("commodity", 0)
        col_spec = header_indices.get("specification", 1 if len(row) > 1 else None)
        col_unit = header_indices.get("unit", 2 if len(row) > 2 else None)
        col_low = header_indices.get("low", 3 if len(row) > 3 else None)
        col_high = header_indices.get("high", 4 if len(row) > 4 else None)
        col_avg = header_indices.get("average", 5 if len(row) > 5 else None)
        col_prev = header_indices.get("prevailing", 6 if len(row) > 6 else None)

        if col_comm >= len(row):
            continue

        comm_name = row[col_comm].strip()
        if not comm_name or comm_name.upper() in ["COMMODITY", "MONTHLY SUMMARY", "TOTAL", "SPECIFICATION", "UNIT"]:
            continue

        spec = row[col_spec].strip() if col_spec is not None and col_spec < len(row) else ""
        unit = row[col_unit].strip() if col_unit is not None and col_unit < len(row) else "kg"
        if not unit:
            unit = "kg"

        p_low = clean_price(row[col_low]) if col_low is not None and col_low < len(row) else None
        p_high = clean_price(row[col_high]) if col_high is not None and col_high < len(row) else None
        p_avg = clean_price(row[col_avg]) if col_avg is not None and col_avg < len(row) else None
        p_prev = clean_price(row[col_prev]) if col_prev is not None and col_prev < len(row) else None

        # Fall back prevailing price to average, high, or low if missing
        if p_prev is None:
            p_prev = p_avg or p_high or p_low

        if p_prev is None and p_low is None and p_high is None:
            continue

        if p_low is None: p_low = p_prev
        if p_high is None: p_high = p_prev
        if p_avg is None: p_avg = p_prev

        # Format clean commodity title (e.g. "Bangus", "Pork Liempo", "Tilapia")
        comm_title = re.sub(r"\s+", " ", comm_name).strip().title()

        records.append({
            "category": current_category,
            "commodity_name": comm_title,
            "specification": spec if spec else None,
            "unit": unit,
            "price_low": p_low,
            "price_high": p_high,
            "price_average": p_avg,
            "price_prevailing": p_prev,
            "period_month": month_name,
            "period_year": year,
            "source": "DA Bantay Presyo (Sheet Sync)",
        })

    logger.info(f"Parsed {len(records)} commodity records across categories from Google Sheet CSV")
    return records
