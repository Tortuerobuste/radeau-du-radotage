"""Prepare les donnees du site a partir de l'archive.

Sortie : site/content/poemes.json — un tableau d'objets legers (pas de HTML),
le texte de chaque poeme garde ses retours a la ligne exacts.
"""
import json, pathlib, re, collections

ROOT = pathlib.Path(__file__).parent
ARCH = ROOT / "archive"
OUT = ROOT / "site" / "content"
OUT.mkdir(parents=True, exist_ok=True)

posts = json.load(open(ARCH / "posts.json", encoding="utf-8"))
coms = json.load(open(ARCH / "comments.json", encoding="utf-8")) if (ARCH / "comments.json").exists() else {}


def nettoie(md: str) -> str:
    """Le Markdown de l'archive -> texte brut a retours a la ligne significatifs."""
    t = re.sub(r"^#\s+.*\n+", "", md)            # le titre est deja un champ
    t = re.sub(r"  \n", "\n", t)                 # sauts durs -> vrais sauts
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)       # le gras d'unblog etait du bricolage
    t = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"\1", t)
    return re.sub(r"\n{3,}", "\n\n", t).strip()


out = []
for p in posts:
    texte = nettoie(p["markdown"])
    c = coms.get(p["slug"], [])
    out.append({
        "slug": p["slug"],
        "titre": p["title"],
        "date": p["date"],
        "texte": texte,
        "mots": len(texte.split()),
        "sourceUnblog": p["source"],
        "commentaires": [
            {"auteur": k["auteur"] or "anonyme", "date": k["date"], "texte": k["texte"]}
            for k in c
        ],
    })

out.sort(key=lambda r: r["date"], reverse=True)
(OUT / "poemes.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")

annees = collections.Counter(r["date"][:4] for r in out)
nb_c = sum(len(r["commentaires"]) for r in out)
taille = (OUT / "poemes.json").stat().st_size / 1e6
print(f"poemes.json : {len(out)} poemes, {nb_c} commentaires, {taille:.1f} Mo")
print("annees :", dict(sorted(annees.items())))
