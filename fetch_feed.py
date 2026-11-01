"""Aspire tous les articles du blog via les flux RSS paginés."""
import os, time, urllib.request, pathlib

BASE = "http://radotage010446g.unblog.fr"
OUT = pathlib.Path(__file__).parent / "archive" / "raw-feed"
OUT.mkdir(parents=True, exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0 (archivage personnel)"}


def get(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=45) as r:
                return r.read()
        except Exception as e:
            if i == tries - 1:
                raise
            print(f"  retry {i+1} ({e})")
            time.sleep(2 * (i + 1))


page, total = 1, 0
while True:
    data = get(f"{BASE}/feed/?paged={page}")
    n = data.count(b"<item>")
    if n == 0:
        break
    (OUT / f"page-{page:03d}.xml").write_bytes(data)
    total += n
    print(f"page {page}: {n} articles")
    page += 1
    time.sleep(0.4)

print(f"\n{total} articles sur {page-1} pages -> {OUT}")
