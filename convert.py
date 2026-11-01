"""Convertit les flux RSS archives en Markdown + HTML fidele + posts.json.

Les poemes dependent des retours a la ligne : chaque <br> devient un saut de
ligne dur Markdown (deux espaces en fin de ligne), chaque <p> un paragraphe.
"""
import re, json, glob, html, pathlib, datetime, email.utils, unicodedata, collections

ROOT = pathlib.Path(__file__).parent
ARCH = ROOT / "archive"
MD = ARCH / "posts"
HT = ARCH / "html"

INLINE_DROP = ("span", "font", "div", "section", "article", "header", "footer", "small")


def wlong(path):
    """Chemin \\?\ pour contourner la limite MAX_PATH de Windows."""
    import os
    return pathlib.Path("\\\\?\\" + str(path.resolve())) if os.name == "nt" else path


def unesc(s):
    return html.unescape(s or "").replace(" ", " ")


def slugify(s, fallback):
    s = unicodedata.normalize("NFKD", unesc(s)).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return (s or fallback)[:55]


def to_markdown(h):
    """HTML d'article -> Markdown, retours a la ligne preserves."""
    h = re.sub(r"(?is)<(script|style)\b.*?</\1>", "", h)
    h = re.sub(r"(?s)<!--.*?-->", "", h)

    # Retours a la ligne durs. On absorbe le saut de ligne que la source
    # met souvent juste apres <br />, sinon le vers compte double.
    h = re.sub(r"(?i)[ \t]*<br\s*/?>[ \t]*\r?\n?", "\n", h)

    # liens et images avant de retirer les balises
    h = re.sub(r'(?is)<img[^>]*?alt="([^"]*)"[^>]*?src="([^"]+)"[^>]*?>', r"![\1](\2)", h)
    h = re.sub(r'(?is)<img[^>]*?src="([^"]+)"[^>]*?>', r"![](\1)", h)
    h = re.sub(r'(?is)<a\b[^>]*?href="([^"]+)"[^>]*?>(.*?)</a>', r"[\2](\1)", h)

    # emphase
    h = re.sub(r"(?is)<(strong|b)\b[^>]*>(.*?)</\1>", r"**\2**", h)
    h = re.sub(r"(?is)<(em|i)\b[^>]*>(.*?)</\1>", r"*\2*", h)
    h = re.sub(r"(?is)<del\b[^>]*>(.*?)</del>", r"~~\1~~", h)
    h = re.sub(r"(?is)<sup\b[^>]*>(.*?)</sup>", r"^\1", h)

    # titres
    for lvl in range(1, 7):
        h = re.sub(rf"(?is)<h{lvl}\b[^>]*>(.*?)</h{lvl}>",
                   lambda m, l=min(lvl + 1, 6): "\n\n" + "#" * l + " " + m.group(1).strip() + "\n\n", h)

    # listes et citations
    h = re.sub(r"(?is)<li\b[^>]*>(.*?)</li>", lambda m: "\n- " + m.group(1).strip(), h)
    h = re.sub(r"(?i)</?(ul|ol|dl)\b[^>]*>", "\n\n", h)
    h = re.sub(r"(?is)<dt\b[^>]*>(.*?)</dt>", lambda m: "\n\n**" + m.group(1).strip() + "**\n", h)
    h = re.sub(r"(?is)<dd\b[^>]*>(.*?)</dd>", lambda m: "\n" + m.group(1).strip() + "\n", h)
    h = re.sub(r"(?is)<blockquote\b[^>]*>(.*?)</blockquote>",
               lambda m: "\n\n" + "\n".join("> " + x for x in m.group(1).strip().splitlines()) + "\n\n", h)

    # Paragraphes. Sur unblog il ecrivait un vers par <p>, et separait ses
    # strophes par un <p> vide. Un <p> court est donc un vers (simple saut),
    # un <p> vide une rupture de strophe, un <p> long de la prose.
    def _para(m):
        inner = m.group(1)
        nu = unesc(re.sub(r"<[^>]+>", "", inner)).strip()
        if not nu:
            return "\n\n"
        return inner.rstrip() + ("\n\n" if len(nu) > 120 else "\n")

    # On avale aussi les blancs qui suivent </p> : dans la source d'unblog
    # chaque paragraphe est sur sa ligne, ce qui ajouterait un faux saut.
    h = re.sub(r"(?is)<p\b[^>]*>(.*?)</p\s*>[ \t\r\n]*", _para, h)
    h = re.sub(r"(?i)</?p\b[^>]*>", "\n", h)   # balises <p> depareillees

    # conteneurs purement decoratifs
    h = re.sub(rf"(?i)</?({'|'.join(INLINE_DROP)})\b[^>]*>", "", h)

    h = unesc(h)

    # lignes : trim des espaces, saut dur pour les vers
    out, blank = [], 0
    for line in h.splitlines():
        line = line.rstrip()
        if not line.strip():
            blank += 1
            continue
        if out and blank == 0:
            out[-1] = out[-1] + "  "   # vers suivant -> saut de ligne dur
        elif out:
            out.append("")
        blank = 0
        out.append(line.strip() if line.strip().startswith(("#", "-", ">", "|", "<")) else line.lstrip())
    return re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip()


PAGE = """<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>{title} — le radeau du radotage</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{{max-width:40rem;margin:3rem auto;padding:0 1.2rem;font:1.05rem/1.7 Georgia,serif;color:#1c1a17;background:#fbf8f3}}
h1{{font-size:1.6rem;line-height:1.25}}.meta{{color:#7a7268;font-size:.85rem;font-style:italic}}img{{max-width:100%;height:auto}}</style>
</head><body>
<h1>{title}</h1>
<p class="meta">{date}{cats}</p>
{body}
<hr><p class="meta">Archive de <a href="{link}">{link}</a></p>
</body></html>
"""

posts, seen, used_names = [], set(), set()
for f in sorted(glob.glob(str(ARCH / "raw-feed" / "*.xml"))):
    src = open(f, encoding="utf-8").read()
    for it in re.findall(r"<item>(.*?)</item>", src, re.S):
        def g(tag):
            m = re.search(rf"<{tag}>(.*?)</{tag}>", it, re.S)
            v = m.group(1).strip() if m else ""
            c = re.fullmatch(r"(?s)<!\[CDATA\[(.*)\]\]>", v)
            return (c.group(1) if c else v).strip()

        link = g("link")
        if not link or link in seen:
            continue
        seen.add(link)

        cont = re.search(r"<content:encoded><!\[CDATA\[(.*?)\]\]></content:encoded>", it, re.S)
        raw_html = cont.group(1).strip() if cont else ""
        title = unesc(g("title")) or "(sans titre)"
        dt = email.utils.parsedate_to_datetime(g("pubDate")) if g("pubDate") else None
        date = (dt or datetime.datetime(1970, 1, 1)).date().isoformat()
        cats = [unesc(c) for c in re.findall(r"<category><!\[CDATA\[(.*?)\]\]></category>", it, re.S)] \
            or [unesc(c) for c in re.findall(r"<category>(.*?)</category>", it, re.S)]

        wp_slug = link.rstrip("/").rsplit("/", 1)[-1]
        name = f"{date}-{slugify(wp_slug or title, 'article')}"
        if name in used_names:          # deux articles tronques au meme nom
            n = 2
            while f"{name}-{n}" in used_names:
                n += 1
            name = f"{name}-{n}"
        used_names.add(name)
        year = date[:4]

        md_body = to_markdown(raw_html)
        fm = {"title": title, "date": date,
              "datetime": dt.isoformat() if dt else None,
              "auteur": unesc(g("dc:creator")),
              "categories": cats, "source": link, "slug": name}

        wlong(MD / year).mkdir(parents=True, exist_ok=True)
        wlong(HT / year).mkdir(parents=True, exist_ok=True)
        front = "---\n" + "\n".join(
            f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in fm.items() if v not in (None, [], "")
        ) + "\n---\n\n"
        wlong(MD / year / f"{name}.md").write_text(front + f"# {title}\n\n{md_body}\n", encoding="utf-8")
        wlong(HT / year / f"{name}.html").write_text(PAGE.format(
            title=html.escape(title), date=date,
            cats=(" · " + ", ".join(html.escape(c) for c in cats)) if cats else "",
            body=raw_html, link=html.escape(link)), encoding="utf-8")

        fm["html"] = raw_html
        fm["markdown"] = md_body
        posts.append(fm)

posts.sort(key=lambda p: (p["date"], p["slug"]))
(ARCH / "posts.json").write_text(json.dumps(posts, ensure_ascii=False, indent=1), encoding="utf-8")

by_year = collections.Counter(p["date"][:4] for p in posts)
vides = [p["slug"] for p in posts if not p["markdown"].strip()]
print(f"{len(posts)} articles ecrits")
print("par annee:", dict(sorted(by_year.items())))
print("articles au corps vide:", len(vides))
for v in vides[:15]:
    print("  ", v)
