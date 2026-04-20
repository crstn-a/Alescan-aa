"""
End-to-end test for POST /scan — run with the FastAPI server active.
Usage:
  pip install httpx
  python test_scan.py path/to/tilapia.jpg
"""
import sys
import httpx
from pathlib import Path

BASE_URL = "http://localhost:8000"

def test_scan(image_path: str):
    path = Path(image_path)
    if not path.exists():
        print(f"Image not found: {image_path}")
        sys.exit(1)

    print(f"\nTesting POST /scan with: {path.name}")
    print("-" * 48)

    with open(path, "rb") as f:
        resp = httpx.post(
            f"{BASE_URL}/scan",
            files={"image": (path.name, f, "image/jpeg")},
            timeout=30,
        )

    print(f"Status:  {resp.status_code}")

    if resp.status_code == 200:
        data = resp.json()
        print(f"Product: {data['product']}")
        print(f"Conf:    {data['confidence']}%")
        print(f"SRP:     ₱{data['official_srp']}/kg")
        print(f"Week of: {data['week_of']}")
        print(f"Source:  {data['source']}")
        print("\nPASS ✓")

    elif resp.status_code == 422:
        detail = resp.json()["detail"]
        print(f"Low confidence: {detail['confidence']}%")
        print(f"Message: {detail['message']}")
        print("\nExpected low-confidence response — check image quality")

    elif resp.status_code == 404:
        print("No price data yet — run POST /admin/sync first")

    else:
        print(f"Unexpected response: {resp.text}")
        print("\nFAIL ✗")


def test_health():
    print("Testing GET /health ...")
    resp = httpx.get(f"{BASE_URL}/health")
    print(f"Status: {resp.status_code} — {resp.json()}")


if __name__ == "__main__":
    test_health()
    if len(sys.argv) > 1:
        test_scan(sys.argv[1])
    else:
        print("\nNo image supplied — health check only.")
        print("Usage: python test_scan.py path/to/commodity.jpg")