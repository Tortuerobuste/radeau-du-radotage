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


# Les noms de balises HTML, et eux seuls : une liste fermee, pour ne pas
# manger un « <Monsieur X> » ecrit de sa main.
BALISES = (
    "a|abbr|address|area|article|aside|audio|b|bdi|bdo|big|blockquote|body|br"
    "|button|canvas|caption|center|cite|code|col|colgroup|dd|del|details|div"
    "|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|h1|h2|h3|h4"
    "|h5|h6|head|header|hgroup|hr|html|i|iframe|img|input|ins|label|legend|li"
    "|main|map|mark|nav|noscript|object|ol|optgroup|option|output|p|param"
    "|picture|pre|q|rp|rt|ruby|s|section|select|small|source|span|strike"
    "|strong|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|tr"
    "|track|tt|u|ul|video|wbr"
)


def nettoie(md: str, html: str = "") -> str:
    """Le Markdown de l'archive -> texte brut a retours a la ligne significatifs.

    Le site affiche ce texte tel quel : tout ce qui reste de syntaxe s'y
    verrait en clair. On enleve donc le balisage, jamais ses mots.
    """
    t = re.sub(r"^#\s+.*\n+", "", md)            # le titre est deja un champ
    # Il postait parfois par courriel : Outlook a glisse ses regles CSS
    # dans le corps du billet. On exige le point-virgule d'une declaration,
    # sinon on emporte son « Ah !{Refrain:} », qui est de lui.
    t = re.sub(r"(?m)^.*\{[^{}]*:[^{}]*;[^{}]*\}.*$", "", t)
    # Pied de page d'unblog, pas de lui, et pas toujours en debut de ligne.
    # La date d'origine, elle, reste dans l'archive.
    t = re.sub(r"[ \t]*Cet article a été posté le [^\n]*", "", t)
    t = re.sub(rf"(?i)</?(?:{BALISES})\b[^>]*>", "", t)
    t = re.sub(r"(?m)^#{1,6}\s*$\n?", "", t)     # titres ouverts puis laisses vides
    t = re.sub(r"(?m)^#{1,6}[ \t]+", "", t)      # les autres : le texte, sans les dieses
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", t)   # images : rien a montrer en texte
    for _ in range(2):                           # liens, y compris imbriques
        t = re.sub(r"\[([^\[\]]*)\]\([^)]*\)", r"\1", t)
    t = re.sub(r"  \n", "\n", t)                 # sauts durs -> vrais sauts
    # Le gras et l'italique d'unblog etaient du bricolage, et il s'en
    # servait pour aligner a droite : « <em>     </em> » autour d'espaces
    # seuls est courant, et doit disparaitre comme le reste.
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    t = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"\1", t)
    # Les etoiles qui restent sont depareillees : soit de lui (ses appels de
    # note), soit de ma conversion. La source tranche : si elle n'en
    # contenait aucune, toutes sont de moi et s'effacent. Si elle en
    # contenait, on n'y touche pas — lui manger un appel de note serait
    # pire que laisser une etoile en trop.
    if "*" not in html:
        t = t.replace("*", "")
    t = re.sub(r"(?<!_)__(.+?)__(?!_)", r"\1", t)  # le gras en souligne d'unblog
    t = re.sub(r"(?m)[ \t]+$", "", t)            # espaces tombes en fin de vers
    return re.sub(r"\n{3,}", "\n\n", t).strip()


# Verification minimale : si l'une de ces regles casse, la graine est fausse.
assert nettoie("## Un titre cite\n\nUn vers") == "Un titre cite\n\nUn vers"
assert nettoie("Un vers\nCet article a été posté le Lundi 1 mai 2017") == "Un vers"
assert nettoie("Vu sur [Gallica](http://x/y) hier") == "Vu sur Gallica hier"
assert nettoie("<nav>\n\nUn vers\n</nav>") == "Un vers"
assert nettoie(".a .b  {padding:0px;}\n\nUn vers") == "Un vers"
assert nettoie("Ah !{Refrain:}\nHalte là !") == "Ah !{Refrain:}\nHalte là !"
assert nettoie("###\n\nUn vers") == "Un vers"
assert nettoie("mot**mot", html="<em>a</em><em>b</em>") == "motmot"
assert nettoie("millions,*   *0,2%") == "millions,   0,2%"   # son alignement
assert nettoie("note** suite", html="une * a lui") == "note** suite"
assert nettoie("Premier\nDeuxieme\n\nTroisieme") == "Premier\nDeuxieme\n\nTroisieme"


out = []
for p in posts:
    texte = nettoie(p["markdown"], p["html"])
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
