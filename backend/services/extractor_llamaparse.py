import os
import re
import logging
from datetime import date
from services.normalizer import match_commodity_name

logger = logging.getLogger(__name__)


def extract_with_llamaparse(pdf_path: str) -> list[dict]:
    """
    Use LlamaParse cloud OCR as fallback when docling cannot extract data.
    Requires pip install llama-parse and LLAMACLOUD_API_KEY in .env.
    """
    try:
        from llama_parse import LlamaParse
    except ImportError:
        raise RuntimeError("llama-parse not installed — run: pip install llama-parse")

    api_key = os.getenv("LLAMACLOUD_API_KEY")
    if not api_key:
        raise ValueError("LLAMACLOUD_API_KEY not set in backend/.env")

    parser = LlamaParse(
        api_key=api_key,
        result_type="markdown",
        verbose=False,
        language="en",
    )

    logger.info(f"Sending PDF to LlamaCloud: {pdf_path}")
    documents = parser.load_data(pdf_path)

    rows = []
    today = date.today().isoformat()
    for doc in documents:
        rows.extend(_parse_text(doc.text, today))

    # Deduplicate: keep first match per slug
    seen: set[str] = set()
    unique = []
    for row in rows:
        if row["slug"] not in seen:
            seen.add(row["slug"])
            unique.append(row)

    logger.info(f"llamaparse: {len(unique)} unique commodities matched")
    return unique


def _parse_text(text: str, week_of: str) -> list[dict]:
    """
    Scan every line of the markdown/text output.
    A valid row must contain BOTH a recognized commodity name
    AND a price-shaped number (2-4 digits, optionally ranged).
    """
    rows = []
    for line in text.splitlines():
        line = line.strip()
        if not line or "---" in line:
            continue

        slug = match_commodity_name(line)
        if not slug:
            continue

        # Match price: standalone number or range like 180-200 or ₱210
        price_match = re.search(
            r"₱?\s*(\d{3,4}(?:\.\d{1,2})?(?:\s*[-–]\s*\d{3,4}(?:\.\d{1,2})?)?)",
            line
        )
        if not price_match:
            continue

        price = _parse_price_str(price_match.group(1))
        if price and 50 < price < 2000:  # PHP sanity range
            rows.append({"slug": slug, "price": price, "week_of": week_of})

    return rows


def _parse_price_str(text: str) -> float | None:
    text = text.replace(",", "").strip()
    m = re.search(r"(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)", text)
    if m:
        return round((float(m.group(1)) + float(m.group(2))) / 2, 2)
    s = re.search(r"\d+\.?\d*", text)
    return float(s.group()) if s else None