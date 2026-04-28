"""
backend/services/extractor_llamaparse.py

Key fixes vs the Phase 4 original:
  1. CARRY-FORWARD logic — when a line matches a commodity name but has
     no price on the same line, the slug is held and the NEXT price-bearing
     line is used. This handles LlamaParse's OCR output for Tilapia where
     "Tilapia" appears alone and "154.76" appears one or two lines later.
  2. PRICE REGEX now requires 3+ digit numbers (d{3,4}) so the spec
     "5-8 pcs/kg" is never mistaken for a price range.
  3. SECTION HEADER guard clears the carry-forward state so a commodity
     slug does not accidentally absorb the first price in the next section.
  4. Debug logging shows every line decision — set LOG_LLAMA_DEBUG=1 in
     your .env to enable without modifying code.
"""

import os
import re
import logging
from datetime import date
from services.normalizer import match_commodity_name

logger = logging.getLogger(__name__)
DEBUG = os.getenv("LOG_LLAMA_DEBUG", "0") == "1"

# ── Section headers that mark a new food category in the PDF ─────────
SECTION_HEADERS = {
    "fish products",
    "beef products",
    "pork products",
    "poultry products",
    "corn products",
    "legumes",
    "lowland vegetables",
    "highland vegetables",
    "spices",
    "fruits",
    "other basic commodities",
    "imported commercial rice",
    "local commercial rice",
    "kadwa rice for all",
    "rice",
}

# ── Price regex: 3-4 digit numbers only ──────────────────────────────
# Requires at least 3 digits so "5-8" (pcs/kg spec) is never matched.
# Handles: "154.76", "₱210", "180–200"
PRICE_RE = re.compile(
    r"₱?\s*(\d{3,4}(?:\.\d{1,2})?(?:\s*[-–]\s*\d{3,4}(?:\.\d{1,2})?)?)"
)

# Maximum number of lines to look ahead for a price after a commodity
# name is found without a price on the same line.
CARRY_FORWARD_MAX_LINES = 4


def extract_with_llamaparse(pdf_path: str) -> list[dict]:
    """
    Use LlamaParse (cloud OCR) to extract commodity price rows.
    Returns a list of {slug, price, week_of} dicts — may be empty.
    Raises on hard failure (missing API key, network error, etc.)
    so sync.py can log and handle it appropriately.
    """
    try:
        from llama_parse import LlamaParse
    except ImportError:
        raise RuntimeError(
            "llama-parse not installed — run: pip install llama-parse"
        )

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

    all_rows: list[dict] = []
    today = date.today().isoformat()

    for doc_idx, doc in enumerate(documents):
        logger.info(f"Processing LlamaParse document {doc_idx + 1}/{len(documents)}")
        if DEBUG:
            logger.debug(f"Raw LlamaParse text:\n{doc.text}")
        rows = _parse_text(doc.text, today)
        all_rows.extend(rows)

    # Deduplicate: keep first occurrence per slug
    seen: set[str] = set()
    unique: list[dict] = []
    for row in all_rows:
        if row["slug"] not in seen:
            seen.add(row["slug"])
            unique.append(row)

    logger.info(
        f"LlamaParse extraction complete — "
        f"{len(unique)} unique commodities: {[r['slug'] for r in unique]}"
    )
    return unique


def _parse_text(text: str, week_of: str) -> list[dict]:
    """
    Parse LlamaParse markdown/text output into price rows.

    Two-pass strategy:
      Pass 1 (same-line): commodity name AND price are on the same line.
      Pass 2 (carry-forward): commodity name is on line N, price is on
                              line N+1 through N+CARRY_FORWARD_MAX_LINES.

    This handles LlamaParse's OCR behaviour for Tilapia where the table
    cell wraps across lines:
        "Tilapia"          ← line N   (commodity name, no price)
        "Medium (5-8 ..."  ← line N+1 (specification, no price, no commodity)
        "154.76"           ← line N+2 (price only → carry-forward captures it)
    """
    rows: list[dict] = []
    lines = [ln.strip() for ln in text.splitlines()]

    # Track carry-forward state
    carry_slug: str | None = None
    carry_lines_remaining: int = 0

    for i, line in enumerate(lines):
        if not line or "---" in line:
            if DEBUG:
                logger.debug(f"[L{i}] SKIP empty/separator: {repr(line)}")
            continue

        # ── Section header guard ──────────────────────────────────────
        # Clear carry-forward so a commodity slug doesn't absorb the
        # first price that belongs to a completely different section.
        if _is_section_header(line):
            if carry_slug and DEBUG:
                logger.debug(
                    f"[L{i}] SECTION HEADER — clearing carry {carry_slug}: {repr(line)}"
                )
            carry_slug = None
            carry_lines_remaining = 0
            continue

        window = " ".join(lines[i:i+4])  # lookahead window
        slug = match_commodity_name(line)

        if slug:
            # ── Case 1: commodity name found on this line ─────────────
            price = _extract_price(line)

            if price is not None:
                # Best case: name and price on the same line
                if DEBUG:
                    logger.debug(
                        f"[L{i}] SAME-LINE match: slug={slug} price={price} line={repr(line)}"
                    )
                rows.append({"slug": slug, "price": price, "week_of": week_of})
                carry_slug = None
                carry_lines_remaining = 0
            else:
                # Name found but no price yet — carry forward
                if DEBUG:
                    logger.debug(
                        f"[L{i}] CARRY-START: slug={slug} (no price on this line) line={repr(line)}"
                    )
                carry_slug = slug
                carry_lines_remaining = CARRY_FORWARD_MAX_LINES

        elif carry_slug and carry_lines_remaining > 0:
            # ── Case 2: currently carrying a slug, look for price ─────
            carry_lines_remaining -= 1
            price = _extract_price(line)

            if price is not None:
                if DEBUG:
                    logger.debug(
                        f"[L{i}] CARRY-FOUND: slug={carry_slug} price={price} "
                        f"from line={repr(line)}"
                    )
                rows.append({"slug": carry_slug, "price": price, "week_of": week_of})
                carry_slug = None
                carry_lines_remaining = 0
            else:
                if DEBUG:
                    logger.debug(
                        f"[L{i}] CARRY-SKIP ({carry_lines_remaining} left): {repr(line)}"
                    )
        else:
            if DEBUG and carry_slug:
                logger.debug(
                    f"[L{i}] CARRY-EXPIRED for {carry_slug} — no price found within "
                    f"{CARRY_FORWARD_MAX_LINES} lines"
                )
            carry_slug = None
            carry_lines_remaining = 0

    return rows


def _is_section_header(line: str) -> bool:
    """Return True if the line is a known section header in the PDF."""
    return line.lower().strip() in SECTION_HEADERS


def _extract_price(line: str) -> float | None:
    """
    Extract a valid PHP food price from a text line.

    Rules:
    - Must be 3-4 digit number (100-9999), optionally with 2 decimals
    - Ranges like "180-200" are averaged → 190.0
    - Numbers below 50 or above 1500 are rejected (not a food price)
    - "5-8" in a spec like "5-8 pcs/kg" is rejected (both numbers < 50)
    """
    clean = line.replace("₱", "").replace(",", "").strip()

    # Remove markdown table pipes so "| 154.76 |" → "154.76"
    clean = re.sub(r"\|", " ", clean).strip()

    match = PRICE_RE.search(clean)
    if not match:
        return None

    raw = match.group(1).strip()
    return _parse_price_str(raw)


def _parse_price_str(text: str) -> float | None:
    """
    Parse a raw price string into a float.
    Returns None if the result falls outside the realistic PHP food
    price range (50–1500 PHP/kg).
    """
    text = text.replace(",", "").strip()

    # Range: e.g. "180–200" or "180-200"
    range_match = re.search(r"(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)", text)
    if range_match:
        low  = float(range_match.group(1))
        high = float(range_match.group(2))
        # Both ends must be plausible food prices
        if low < 50 or high < 50 or high > 1500:
            return None
        return round((low + high) / 2, 2)

    # Single number
    single = re.search(r"\d+\.?\d*", text)
    if not single:
        return None
    val = float(single.group())
    if not (50 <= val <= 1500):
        return None
    return val