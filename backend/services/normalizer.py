"""
backend/services/normalizer.py

Commodity name normalization for Alescan.
Add new aliases here whenever the Bantay Presyo PDF uses a new name
for one of our three monitored commodities.
"""

COMMODITY_ALIASES: dict[str, list[str]] = {
    "whole_chicken": [
        # ── Exact strings from Bantay Presyo PDF ──────────────────────
        "whole chicken, local",        # exact PDF text
        "whole chicken local",
        "whole chicken",
        # ── Common variants across report weeks ───────────────────────
        "chicken, whole",
        "whole dressed chicken",
        "chicken (whole)",
        "chicken (whole, local)",
        "dressed chicken",
        "broiler chicken",
        "chicken (dressed)",
        "chicken, dressed",
        "manok",
    ],

    "tilapia_local": [
        # ── Exact strings from Bantay Presyo PDF ──────────────────────
        "tilapia",                      # most common — just "Tilapia"
        "tilapia, local",
        "tilapia (local)",
        # ── Common variants ───────────────────────────────────────────
        "tilapia local",
        "local tilapia",
        "fresh tilapia",
        "tilapia (fresh)",
        "tilapya",                      # Filipino spelling variant
        "tilapia (medium)",
        "tilapia medium",
        "tilapia, medium",
        # ── OCR error variants (scanned PDF misreads) ─────────────────
        "talapia",
        "tiiapia",
        "tilapla",
    ],

    "pork_liempo": [
        # ── Exact strings from Bantay Presyo PDF ──────────────────────
        # NOTE: "pork belly (liempo), local" listed BEFORE shorter
        # "pork belly (liempo)" so longer alias wins in substring search.
        "pork belly (liempo), local",   # exact PDF text — most specific
        "pork belly liempo, local",
        "pork belly (liempo)",
        "pork belly liempo",
        # ── Common variants ───────────────────────────────────────────
        "liempo, local",
        "liempo local",
        "liempo",
        "pork belly, local",
        "pork liempo, local",
        "pork liempo",
        "pork, liempo",
        "liempo (pork belly)",
    ],
}

# ── Build flat lookup: lowercase alias → slug ─────────────────────────
# Sorted longest-first so longer/more-specific aliases win over shorter
# ones during substring matching (e.g. "pork belly (liempo)" beats "pork belly").
_LOOKUP: dict[str, str] = {}
for slug, aliases in COMMODITY_ALIASES.items():
    for alias in aliases:
        _LOOKUP[alias.lower().strip()] = slug

_SORTED_ALIASES = sorted(_LOOKUP.keys(), key=len, reverse=True)

# ── Substrings that identify the "imported" variant of any commodity ──
# We monitor LOCAL prices only. Rows containing these are skipped.
_IMPORTED_MARKERS = (", imported", "(imported)", " imported")


def match_commodity_name(raw: str) -> str | None:
    """
    Try to match a raw string from the PDF to one of our 3 slugs.

    Steps (in order):
      1. Reject strings that contain imported-variant markers.
         e.g. "Pork Belly (Liempo), Imported" → None
      2. Exact match after lowercase + strip (O(1) dict lookup).
      3. Substring match — longer aliases checked first to prevent
         short aliases ("liempo") from stealing a match that belongs
         to a more specific alias ("pork belly (liempo), local").
      4. Returns None if no match.
    """
    if not raw or not raw.strip():
        return None

    text = raw.lower().strip()

    # 1. Reject imported variants — we track local prices only
    if any(marker in text for marker in _IMPORTED_MARKERS):
        return None

    # 2. Exact match
    if text in _LOOKUP:
        return _LOOKUP[text]

    # 3. Substring match (longer aliases checked first)
    for alias in _SORTED_ALIASES:
        if alias in text:
            return _LOOKUP[alias]

    return None


def normalize_rows(raw_rows: list[dict]) -> list[dict]:
    """
    Final validation pass after extraction.

    Applies three checks to every row:
      - slug must be one of the 3 valid slugs
      - price must be in realistic PHP range (50–1500 PHP/kg)
      - deduplication: only the FIRST occurrence per slug is kept
        (so "Pork Belly Local" at ₱400 beats "Pork Belly Imported"
        at ₱313 if both somehow pass the imported check)

    Returns a list of 0–3 clean dicts ready for Supabase upsert.
    """
    VALID_SLUGS = {"whole_chicken", "tilapia_local", "pork_liempo"}
    seen: dict[str, dict] = {}

    for row in raw_rows:
        slug  = row.get("slug")
        price = row.get("price")

        if slug not in VALID_SLUGS:
            continue
        if not price or not (50 <= float(price) <= 1500):
            continue
        if slug not in seen:
            seen[slug] = row

    return list(seen.values())