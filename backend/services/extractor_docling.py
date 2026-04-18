import re
import logging
from datetime import date
from docling.document_converter import DocumentConverter
from services.normalizer import match_commodity_name

logger = logging.getLogger(__name__)

SECTION_HEADERS = {
    "fish products", "beef products", "corn products", "rice",
    "legumes", "lowland vegetables", "highland vegetables",
    "spices", "fruits", "other basic commodities",
    "imported commercial rice", "local commercial rice",
    "kadwa rice for all",
}


def extract_with_docling(pdf_path: str) -> list[dict]:
    """
    Convert PDF with docling and extract commodity price rows.
    Returns list of {slug, price, week_of} dicts — may be empty.
    Raises on hard failure so sync.py can switch to llamaparse.
    """
    converter = DocumentConverter()
    result = converter.convert(pdf_path)
    doc = result.document

    rows = []

    # Path A: structured table objects (best case)
    if hasattr(doc, "tables") and doc.tables:
        for table in doc.tables:
            rows.extend(_parse_table_object(table))
        logger.info(f"docling table path: {len(rows)} rows from {len(doc.tables)} tables")

    # Path B: markdown fallback (scanned PDFs may not have table objects)
    if not rows:
        logger.info("No table objects — trying markdown export fallback")
        markdown = doc.export_to_markdown()
        rows = _parse_markdown(markdown)
        logger.info(f"docling markdown path: {len(rows)} rows")

    return rows


def _parse_table_object(table) -> list[dict]:
    """
    Parse a docling table data structure into price rows.
    Normalizes table.data into a matrix regardless of whether
    docling returns a grid, rows, or flat cells structure.
    """
    rows = []

    # ── Step 1: Normalize table.data → matrix ──────────────────────────────
    matrix = None

    if hasattr(table, "data"):
        data = table.data

        if hasattr(data, "grid") and data.grid:
            matrix = data.grid

        elif hasattr(data, "rows") and data.rows:
            matrix = data.rows

        elif hasattr(data, "cells") and data.cells:
            # Flat cell list — group by row index
            matrix = []
            current_row = []
            current_index = None

            for cell in data.cells:
                row_idx = getattr(cell, "row", None)
                if row_idx is None:
                    continue
                if current_index is None:
                    current_index = row_idx
                if row_idx != current_index:
                    if current_row:
                        matrix.append(current_row)
                    current_row = []
                    current_index = row_idx
                text = getattr(cell, "text", str(cell))
                current_row.append(text)

            if current_row:
                matrix.append(current_row)

    if not matrix or len(matrix) < 2:
        return rows

    # ── Step 2: Identify header row and column positions ───────────────────
    header = [str(c).lower().strip() for c in matrix[0]]
    commodity_col = _find_col(header, [
        "commodity", "items", "product", "particulars"
    ])
    price_col = _find_col(header, [
        "weekly average price",
        "weekly average",
        "average price",
        "price",
        "retail",
        "prevailing",
    ])

    today = date.today().isoformat()

    # ── Step 3: Parse each data row ────────────────────────────────────────
    for row in matrix[1:]:
        texts = [str(c).strip() for c in row if str(c).strip()]

        # Skip rows with too few cells to have both a name and a price
        if len(texts) < 2:
            continue

        # ── Determine commodity name ───────────────────────────────────────
        # Prefer the identified commodity column; fall back to first token
        if commodity_col is not None and commodity_col < len(row):
            name = str(row[commodity_col]).strip()
        else:
            name = texts[0]

        # Skip section headers (e.g. "FISH PRODUCTS", "BEEF PRODUCTS")
        if name.lower().strip() in SECTION_HEADERS:
            continue

        # Skip unit-only noise rows
        if name.lower() in {"kg", "pc", "pcs", "liter", "l", "ml"}:
            continue

        # Clean specification noise from name, e.g. "Tilapia (Medium)" → "Tilapia"
        # but keep "(Local)" since normalizer aliases include it
        name_clean = re.sub(r"\((?!local|imported)[^)]*\)", "", name, flags=re.IGNORECASE).strip()

        # ── Determine price ────────────────────────────────────────────────
        # Prefer the identified price column; fall back to last numeric token
        price = None
        if price_col is not None and price_col < len(row):
            price_str = str(row[price_col]).strip()
            if price_str and price_str not in {"-", "—", ""}:
                price = _parse_price(price_str)

        if price is None:
            # Fallback: scan tokens in reverse for the last valid price
            for token in reversed(texts):
                parsed = _parse_price(token)
                # Sanity check: realistic PHP food price range
                if parsed is not None and 50 <= parsed <= 1500:
                    price = parsed
                    break

        if price is None:
            continue

        # ── Match commodity name → slug ────────────────────────────────────
        slug = match_commodity_name(name_clean) or match_commodity_name(name)

        if slug:
            rows.append({
                "slug": slug,
                "price": price,
                "week_of": today,
            })

    return rows


def _parse_markdown(markdown: str) -> list[dict]:
    """
    Fallback: scan markdown table lines for commodity + price pairs.
    Handles | col1 | col2 | ... formatted rows.
    """
    rows = []
    today = date.today().isoformat()

    for line in markdown.splitlines():
        if "|" not in line or "---" in line:
            continue

        cols = [c.strip() for c in line.split("|") if c.strip()]
        if len(cols) < 2:
            continue

        name = cols[0]
        if name.lower().strip() in SECTION_HEADERS:
            continue

        # Try the last column first (price), then second-to-last
        price = None
        for col in reversed(cols[1:]):
            parsed = _parse_price(col)
            if parsed is not None and 50 <= parsed <= 1500:
                price = parsed
                break

        if price is None:
            continue

        name_clean = re.sub(r"\((?!local|imported)[^)]*\)", "", name, flags=re.IGNORECASE).strip()
        slug = match_commodity_name(name_clean) or match_commodity_name(name)

        if slug and price:
            rows.append({"slug": slug, "price": price, "week_of": today})

    return rows


def _find_col(headers: list[str], keywords: list[str]) -> int | None:
    """Return index of first header that contains any of the keywords."""
    for i, h in enumerate(headers):
        if any(kw in h for kw in keywords):
            return i
    return None


def _parse_price(text: str) -> float | None:
    """
    Extract a PHP price from strings like '210', '₱210.50', '180-200'.
    Ranges (180-200) are averaged → 190.0.
    Returns None if no valid number found.
    """
    text = text.replace("₱", "").replace(",", "").strip()

    # Range: e.g. "180-200" or "180–200"
    range_match = re.search(r"(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)", text)
    if range_match:
        low  = float(range_match.group(1))
        high = float(range_match.group(2))
        # Reject spec-like ranges e.g. "5-8" (pcs/kg) — too small for PHP food price
        if high < 50:
            return None
        return round((low + high) / 2, 2)

    # Single number
    single = re.search(r"\d+\.?\d*", text)
    return float(single.group()) if single else None