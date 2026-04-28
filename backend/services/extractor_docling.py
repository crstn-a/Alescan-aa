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

# ─────────────────────────────────────────────────────────────
# PUBLIC ENTRY
# ─────────────────────────────────────────────────────────────

def extract_with_docling(pdf_path: str) -> list[dict]:
    """
    Convert PDF with docling and extract commodity price rows.
    """
    converter = DocumentConverter()
    result = converter.convert(pdf_path)
    doc = result.document

    rows = []

    # ── Path A: structured tables ─────────────────────────────
    if hasattr(doc, "tables") and doc.tables:
        for table in doc.tables:
            rows.extend(_parse_table_object(table))
        logger.info(f"docling table path: {len(rows)} rows from {len(doc.tables)} tables")

    # ── Path B: markdown fallback ─────────────────────────────
    if not rows:
        logger.info("No table objects — trying markdown fallback")
        markdown = doc.export_to_markdown()
        rows = _parse_markdown(markdown)
        logger.info(f"docling markdown path: {len(rows)} rows")

    return rows


# ─────────────────────────────────────────────────────────────
# CORE FIX: TABLE → LINE → SEMANTIC PARSING
# ─────────────────────────────────────────────────────────────

def _parse_table_object(table) -> list[dict]:
    rows = []

    matrix = _normalize_table_to_matrix(table)
    if not matrix or len(matrix) < 2:
        return rows

    # Remove header row
    matrix = matrix[1:]

    # 🔑 KEY CHANGE: flatten table → lines
    lines = _flatten_table(matrix)

    # 🔑 KEY CHANGE: semantic parsing (carry-forward)
    parsed = _parse_lines(lines)

    today = date.today().isoformat()
    for row in parsed:
        row["week_of"] = today

    return parsed


def _normalize_table_to_matrix(table):
    """
    Normalize docling table into matrix form.
    """
    matrix = None

    if hasattr(table, "data"):
        data = table.data

        if hasattr(data, "grid") and data.grid:
            matrix = data.grid

        elif hasattr(data, "rows") and data.rows:
            matrix = data.rows

        elif hasattr(data, "cells") and data.cells:
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

    return matrix


# ─────────────────────────────────────────────────────────────
# 🔥 CRITICAL FIXES START HERE
# ─────────────────────────────────────────────────────────────

def _flatten_table(matrix):
    """
    Convert table rows into linear text lines.
    """
    lines = []

    for row in matrix:
        texts = [str(c).strip() for c in row if str(c).strip()]
        if not texts:
            continue

        line = " ".join(texts)

        # Skip section headers
        if line.lower().strip() in SECTION_HEADERS:
            continue

        lines.append(line)

    return lines


def _parse_lines(lines: list[str]) -> list[dict]:
    """
    Reconstruct logical rows using carry-forward strategy.
    """
    rows = []
    carry_slug = None

    for i, line in enumerate(lines):
        norm_line = _normalize_text(line)

        slug = match_commodity_name(norm_line) or match_commodity_name(line)
        price = _parse_price(line)

        if slug and price:
            rows.append({"slug": slug, "price": price})
            carry_slug = None

        elif slug:
            carry_slug = slug

        elif carry_slug and price:
            rows.append({"slug": carry_slug, "price": price})
            carry_slug = None

    return rows


# ─────────────────────────────────────────────────────────────
# MARKDOWN FALLBACK (IMPROVED WITH SAME STRATEGY)
# ─────────────────────────────────────────────────────────────

def _parse_markdown(markdown: str) -> list[dict]:
    rows = []
    today = date.today().isoformat()

    lines = []
    for line in markdown.splitlines():
        if "|" not in line or "---" in line:
            continue

        cols = [c.strip() for c in line.split("|") if c.strip()]
        if not cols:
            continue

        lines.append(" ".join(cols))

    parsed = _parse_lines(lines)

    for row in parsed:
        row["week_of"] = today

    return parsed


# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────

def _normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"\([^)]*\)", "", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    return text.strip()


def _parse_price(text: str) -> float | None:
    """
    Extract price (handles ranges and filtering).
    """
    text = text.replace("₱", "").replace(",", "").strip()

    # Range
    range_match = re.search(r"(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)", text)
    if range_match:
        low  = float(range_match.group(1))
        high = float(range_match.group(2))
        if high < 50:
            return None
        return round((low + high) / 2, 2)

    # Single number
    single = re.search(r"\d+\.?\d*", text)
    if not single:
        return None

    val = float(single.group())

    # Sanity filter for PH market prices
    if not (50 <= val <= 1500):
        return None

    return val