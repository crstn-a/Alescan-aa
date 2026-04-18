"""
Commodity name normalization for Alescan.
Add new aliases here whenever the Bantay Presyo PDF uses a new name
for one of our three monitored commodities.
"""

COMMODITY_ALIASES: dict[str, list[str]] = {
    "whole_chicken": [
        # ── Exact strings from Bantay Presyo PDF ──
        "whole chicken, local",        # ← exact PDF text
        "whole chicken local",
        "whole chicken",
        # ── Common variants across weeks ──
        "chicken, whole",
        "whole dressed chicken",
        "chicken (whole)",
        "chicken (whole, local)",
        "dressed chicken",
        "broiler chicken",
        "chicken (dressed)",
        "manok",
    ],
    "tilapia_local": [
        # ── Exact strings from Bantay Presyo PDF ──
        "tilapia",                     # ← exact PDF text (just "Tilapia")
        "tilapia, local",
        "tilapia (local)",
        # ── Common variants across weeks ──
        "tilapia local",
        "local tilapia",
        "fresh tilapia",
        "tilapia (fresh)",
        "tilapya",
        "tilapia (medium)",
        "tilapia medium",
    ],
    "pork_liempo": [
        # ── Exact strings from Bantay Presyo PDF ──
        "pork belly (liempo), local",  # ← exact PDF text
        "pork belly (liempo)",
        "pork belly liempo",
        # ── Common variants across weeks ──
        "liempo",
        "pork belly",
        "liempo (pork belly)",
        "pork, liempo",
        "liempo, local",
        "pork liempo",
    ],
}

# Build flat lookup: lowercase alias text → slug
_LOOKUP: dict[str, str] = {}
for slug, aliases in COMMODITY_ALIASES.items():
    for alias in aliases:
        _LOOKUP[alias.lower().strip()] = slug


def match_commodity_name(raw: str) -> str | None:
    """
    Try to match a raw string from the PDF to one of our 3 slugs.
    1. Exact match: 'tilapia' → 'tilapia'
    2. Substring match: 'tilapia' contains 'tilapia' → 'tilapia'
    Returns slug string or None if no match found.
    """
    text = raw.lower().strip()

    # Exact match (fastest path)
    if text in _LOOKUP:
        return _LOOKUP[text]

    # Substring match (handles extra words around the commodity name)
    for alias, slug in _LOOKUP.items():
        if alias in text:
            return slug

    return None


def normalize_rows(raw_rows: list[dict]) -> list[dict]:
    """
    Final validation pass after extraction.
    - Ensures slug is one of our 3 valid slugs
    - Validates price is in a realistic PHP range (50-1500)
    - Deduplicates: only the FIRST row per slug is kept
    Returns a list of 0-3 clean dicts ready for upsert.
    """
    VALID_SLUGS = {"whole_chicken", "tilapia_local", "pork_liempo"}
    seen: dict[str, dict] = {}

    for row in raw_rows:
        slug  = row.get("slug")
        price = row.get("price")

        if slug not in VALID_SLUGS:
            continue
        if not price or not (50 <= price <= 1500):
            continue
        if slug not in seen:
            seen[slug] = row

    return list(seen.values())