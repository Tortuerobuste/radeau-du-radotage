"""Pages fixes du blog + toutes les images referencees dans les articles."""
import os, re, json, time, html, pathlib, hashlib, urllib.request, urllib.parse

ROOT = pathlib.Path(__file__).parent
ARCH = ROOT / "archive"
IMG = ARCH / "images"
IMG.mkdir(parents=True, exist_ok=True)
BASE = "http://radotage010446g.unblog.fr"
UA = {"User-Agent": "Mozilla/5.0 (archivage personnel)"}


def get(url, tries=3, binary=False):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                d = r.read()
                return d if binary else d.decode("utf-8", "replace")
        except Exception as e:
            if i == tries - 1:
                print(f"  ECHEC {url} -> {e}")
                return None
            time.sleep(2 * (i + 1))


# --- 1. pages fixes (on suit aussi les liens de pages decouverts) -------------
home = get(BASE + "/") or ""
slugs = set()
for href in re.findall(r'href="(http://radotage010446g\.unblog\.fr/[^"]+)"', home):
    path = urllib.parse.urlparse(href).path.strip("/")
    if path and "/" not in path and not re.match(r"^(page|category|tag|author|feed|20\d\d)$", path):
        slugs.add(path)

pages = {}
for s in sorted(slugs):
    h = get(f"{BASE}/{s}/")
    if not h:
        continue
    t = re.search(r"(?is)<title>(.*?)</title>", h)
    body = re.search(r'(?is)<div class="entry[^"]*">(.*?)<p class="postmetadata', h) or \
           re.search(r'(?is)<div class="entry[^"]*">(.*?)</div>', h)
    pages[s] = {"slug": s, "url": f"{BASE}/{s}/",
                "titre": html.unescape(re.sub(r"\s*«.*$", "", t.group(1)).strip()) if t else s,
                "html": body.group(1).strip() if body else ""}
    print(f"page fixe : {s} ({len(pages[s]['html'])} caracteres)")
    time.sleep(0.3)

(ARCH / "pages.json").write_text(json.dumps(pages, ensure_ascii=False, indent=1), encoding="utf-8")

# --- 2. images ---------------------------------------------------------------
posts = json.load(open(ARCH / "posts.json", encoding="utf-8"))
srcs = {}
for p in posts:
    for u in re.findall(r'(?i)<img[^>]+src="([^"]+)"', p["html"]):
        srcs.setdefault(html.unescape(u), []).append(p["slug"])
for pg in pages.values():
    for u in re.findall(r'(?i)<img[^>]+src="([^"]+)"', pg["html"]):
        srcs.setdefault(html.unescape(u), []).append("page:" + pg["slug"])

carte = {}
for u, used in sorted(srcs.items()):
    full = urllib.parse.urljoin(BASE + "/", u)
    ext = os.path.splitext(urllib.parse.urlparse(full).path)[1][:5] or ".jpg"
    name = hashlib.sha1(full.encode()).hexdigest()[:10] + ext
    dest = IMG / name
    if not dest.exists():
        d = get(full, binary=True)
        if d is None:
            continue
        dest.write_bytes(d)
        time.sleep(0.3)
    carte[u] = {"fichier": f"images/{name}", "source": full,
                "octets": dest.stat().st_size, "articles": used}
    print(f"image : {name}  {dest.stat().st_size:>8} o  <- {full}")

(ARCH / "images.json").write_text(json.dumps(carte, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"\n{len(pages)} pages fixes, {len(carte)} images telechargees")
