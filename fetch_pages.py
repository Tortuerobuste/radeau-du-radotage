"""Aspire la page HTML de chaque article (source fidele, gzippee) et en extrait
les commentaires. Reprend ou il s'est arrete si on le relance."""
import os, re, json, gzip, time, html, pathlib, urllib.request

ROOT = pathlib.Path(__file__).parent
ARCH = ROOT / "archive"
RAW = ARCH / "raw-pages"
RAW.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (archivage personnel)"}


def wlong(p):
    return pathlib.Path("\\\\?\\" + str(p.resolve())) if os.name == "nt" else p


# Le serveur limite le debit : on avance lentement et on attend quand il refuse.
DELAI = 1.5          # entre deux pages, en secondes
PAUSES = [300, 900, 1800, 3600]   # attentes successives face a un 403


def get(url, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=45) as r:
                return r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 403:                      # blocage : on patiente
                for p in PAUSES:
                    print(f"  bloque (403). Pause de {p//60} min…", flush=True)
                    time.sleep(p)
                    try:
                        with urllib.request.urlopen(
                                urllib.request.Request(url, headers=UA), timeout=45) as r:
                            print("  debloque, on repart", flush=True)
                            return r.read().decode("utf-8", "replace")
                    except Exception:
                        continue
                print("  TOUJOURS BLOQUE apres 1h15 d'attente — arret", flush=True)
                raise SystemExit(1)
            if e.code == 404 or i == tries - 1:
                print(f"  ECHEC {url} -> {e}", flush=True)
                return None
            time.sleep(2 * (i + 1))
        except Exception as e:
            if i == tries - 1:
                print(f"  ECHEC {url} -> {e}", flush=True)
                return None
            time.sleep(2 * (i + 1))


def strip(s):
    s = re.sub(r"(?is)<(script|style)\b.*?</\1>", "", s)
    s = re.sub(r"(?i)<br\s*/?>", "\n", s)
    s = re.sub(r"(?i)</p\s*>", "\n\n", s)
    s = html.unescape(re.sub(r"<[^>]+>", "", s)).replace(" ", " ")
    return re.sub(r"\n{3,}", "\n\n", re.sub(r"[ \t]+", " ", s)).strip()


def parse_comments(page):
    """Chaque commentaire : auteur, date, texte."""
    out = []
    for m in re.finditer(r'(?is)<li[^>]*id="comment-(\d+)"[^>]*>(.*?)(?=<li[^>]*id="comment-\d+"|</ol>|</ul>)', page):
        cid, blk = m.group(1), m.group(2)
        a = re.search(r'(?is)<cite[^>]*>(.*?)</cite>', blk) or \
            re.search(r'(?is)class="comment-author[^"]*"[^>]*>(.*?)</', blk)
        dt = re.search(r'(?is)<small[^>]*>(.*?)</small>', blk) or \
             re.search(r'(?is)class="comment-meta[^"]*"[^>]*>(.*?)</', blk)
        body = re.sub(r'(?is)<cite[^>]*>.*?</cite>|<small[^>]*>.*?</small>', '', blk)
        body = re.sub(r'(?is)<(p|div)[^>]*class="[^"]*(reply|comment-meta)[^"]*".*?</\1>', '', body)
        txt = strip(body)
        txt = re.sub(r"(?im)^\s*(R[eé]pondre|Reply)\s*$", "", txt)
        txt = re.sub(r"^\s*dit\s*:\s*", "", txt).strip()
        if txt:
            out.append({"id": int(cid), "auteur": strip(a.group(1)) if a else "",
                        "date": strip(dt.group(1)) if dt else "", "texte": txt})
    return out


posts = json.load(open(ARCH / "posts.json", encoding="utf-8"))
comments, done, fails = {}, 0, []
cpath = ARCH / "comments.json"
if cpath.exists():
    comments = json.load(open(cpath, encoding="utf-8"))

for i, p in enumerate(posts, 1):
    f = wlong(RAW / f"{p['slug']}.html.gz")
    if f.exists() and p["slug"] in comments:
        continue
    page = get(p["source"])
    if page is None:
        fails.append(p["source"])
        continue
    with gzip.open(f, "wt", encoding="utf-8") as fh:
        fh.write(page)
    comments[p["slug"]] = parse_comments(page)
    done += 1
    if done % 50 == 0:
        json.dump(comments, open(cpath, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        tot = sum(len(v) for v in comments.values())
        print(f"{i}/{len(posts)} pages — {tot} commentaires — {len(fails)} echecs", flush=True)
    time.sleep(DELAI)

json.dump(comments, open(cpath, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"\nTERMINE : {len(comments)} pages, {sum(len(v) for v in comments.values())} commentaires")
if fails:
    (ARCH / "echecs.txt").write_text("\n".join(fails), encoding="utf-8")
    print(f"{len(fails)} echecs -> archive/echecs.txt")
