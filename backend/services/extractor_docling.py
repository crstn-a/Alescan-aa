import re
import logging
from datetime import date
from docling.document_converter import DocumentConverter
from services.normalizer import match_commodity_name

logger = logging.getLogger(__name__)


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
    """Parse a docling table data structure into price rows."""
    rows = []

    # --- FIX 1: Normalize TableData → matrix ---
    matrix = None

    if hasattr(table.data, "grid") and table.data.grid:
        matrix = table.data.grid

    elif hasattr(table.data, "rows") and table.data.rows:
        matrix = table.data.rows

    elif hasattr(table.data, "cells") and table.data.cells:
        matrix = []
        current_row = []
        current_index = None

        for cell in table.data.cells:
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

    # --- If no usable structure ---
    if not matrix or len(matrix) < 2:
        return rows

    today = date.today().isoformat()

    # --- FIX 2: Semantic row parsing (NOT column index dependent) ---
    for row in matrix[1:]:
        texts = [str(c).strip() for c in row if str(c).strip()]

        if len(texts) < 2:
            continue

        # Skip section headers like "PORK PRODUCTS"
        if len(texts) == 1:
            continue

        name = texts[0]

        # Skip unit-only noise
        if name.lower() in ["kg", "pc"]:
            continue

        # Clean name (remove specs in parentheses)
        name = re.sub(r"\(.*?\)", "", name).strip()

        # Extract price from last numeric token
        price = None
        for t in reversed(texts):
            parsed = _parse_price(t)
            if parsed is not None:
                price = parsed
                break

        if price is None:
            continue

        slug = match_commodity_name(name)

        if slug and price is not None:
            rows.append({
                "slug": slug,
                "price": price,
                "week_of": today
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
        slug  = match_commodity_name(cols[0])
        price = _parse_price(cols[-1])
        if slug and price:
            rows.append({"slug": slug, "price": price, "week_of": today})
    return rows


def _find_col(headers: list[str], keywords: list[str]) -> int | None:
    for i, h in enumerate(headers):
        if any(kw in h for kw in keywords):
            return i
    return None


def _parse_price(text: str) -> float | None:
    """
    Extract a PHP price from strings like '210', '₱210', '180-200'.
    Ranges (180-200) are averaged → 190.0.
    """
    text = text.replace("₱", "").replace(",", "").strip()
    range_match = re.search(r"(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)", text)
    if range_match:
        low  = float(range_match.group(1))
        high = float(range_match.group(2))
        return round((low + high) / 2, 2)
    single = re.search(r"\d+\.?\d*", text)
    return float(single.group()) if single else None