import os
import tempfile
import requests
from bs4 import BeautifulSoup

DA_PAGE_URL = "https://www.da.gov.ph/price-monitoring/"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; AlescanBot/1.0)"}
TIMEOUT = 30


def fetch_latest_pdf() -> str:
    """
    Scrape the DA Bantay Presyo page, find the latest PDF link,
    download it to a temp file, and return the file path.
    Raises on any network or parsing failure.
    """
    # Step 1: Load the monitoring page
    resp = requests.get(DA_PAGE_URL, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()

    # Step 2: Find the first PDF link on the page
    soup = BeautifulSoup(resp.text, "html.parser")
    pdf_url = _find_pdf_link(soup)
    if not pdf_url:
        raise ValueError(f"No PDF link found on {DA_PAGE_URL}")

    # Step 3: Download PDF to a temp file
    return _download_to_temp(pdf_url)


def _find_pdf_link(soup: BeautifulSoup) -> str | None:
    """
    Find the first .pdf href on the page.
    Prioritizes links containing 'bantay' or 'presyo' in the URL.
    """
    candidates = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href.lower().endswith(".pdf"):
            continue
        # Make absolute if relative path
        if not href.startswith("http"):
            href = f"https://www.da.gov.ph{href}"
        # Prioritize links with 'bantay' or 'presyo' in the URL
        priority = 0 if any(k in href.lower() for k in ["bantay", "presyo", "price"]) else 1
        candidates.append((priority, href))

    if not candidates:
        return None
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1]


def _download_to_temp(url: str) -> str:
    """Stream-download a PDF to a named temp file, return the path."""
    resp = requests.get(url, headers=HEADERS, timeout=60, stream=True)
    resp.raise_for_status()

    tmp = tempfile.NamedTemporaryFile(
        suffix=".pdf",
        delete=False,
        prefix="alescan_bantaypresyo_",
    )
    for chunk in resp.iter_content(chunk_size=8192):
        if chunk:
            tmp.write(chunk)
    tmp.close()
    return tmp.name


def cleanup_pdf(path: str):
    """Delete the temp PDF. Called in sync.py finally block."""
    try:
        os.unlink(path)
    except OSError:
        pass  # Already gone, ignore