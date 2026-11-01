"""Construit un fichier HTML unique et autonome contenant tout le blog.

Tout est en ligne dans le fichier : il s'ouvre hors ligne, sans serveur,
et le restera dans vingt ans.
"""
import json, html, pathlib, collections, datetime

ROOT = pathlib.Path(__file__).parent
ARCH = ROOT / "archive"

posts = json.load(open(ARCH / "posts.json", encoding="utf-8"))
pages = json.load(open(ARCH / "pages.json", encoding="utf-8")) if (ARCH / "pages.json").exists() else {}
comments = json.load(open(ARCH / "comments.json", encoding="utf-8")) if (ARCH / "comments.json").exists() else {}

MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
        "août", "septembre", "octobre", "novembre", "décembre"]


def fr_date(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    return f"{d} {MOIS[m-1]} {y}"


data = []
for p in posts:
    c = comments.get(p["slug"], [])
    data.append({
        "t": p["title"],
        "d": p["date"],
        "j": fr_date(p["date"]),
        "x": p["markdown"],
        "u": p["source"],
        "c": [{"a": k["auteur"], "d": k["date"], "x": k["texte"]} for k in c],
    })
data.sort(key=lambda r: r["d"], reverse=True)

# page fixe contenant un poeme : on la garde comme article a part
for pg in pages.values():
    if pg["slug"] == "qui-se-ressemble" and pg["html"].strip():
        import re
        t = re.sub(r"(?i)<br\s*/?>", "\n", pg["html"])
        t = re.sub(r"(?i)</p\s*>", "\n\n", t)
        t = html.unescape(re.sub(r"<[^>]+>", "", t)).replace(" ", " ")
        t = "\n\n".join(l.strip() for l in t.split("\n\n") if l.strip())
        data.append({"t": pg["titre"].split("«")[0].strip(), "d": "", "j": "page du blog",
                     "x": t, "u": pg["url"], "c": []})

annees = collections.Counter(r["d"][:4] for r in data if r["d"])
nb_com = sum(len(r["c"]) for r in data)
mots = sum(len(r["x"].split()) for r in data)

CSS = """
:root{--pap:#fbf8f3;--enc:#211e1a;--pale:#7d7366;--fil:#e3dbcd;--acc:#8a4b2a}
@media(prefers-color-scheme:dark){:root{--pap:#16140f;--enc:#e8e2d6;--pale:#9b9286;--fil:#2e2a22;--acc:#d08a5e}}
*{box-sizing:border-box}
body{margin:0;background:var(--pap);color:var(--enc);font:1.05rem/1.75 Georgia,'Iowan Old Style',serif}
header{text-align:center;padding:3.5rem 1.2rem 1.5rem;border-bottom:1px solid var(--fil)}
h1{font-size:clamp(1.8rem,5vw,2.9rem);margin:0 0 .4rem;font-weight:400;letter-spacing:.01em}
.sous{color:var(--pale);font-style:italic;margin:0}
.chiffres{color:var(--pale);font-size:.85rem;margin:.9rem 0 0}
.barre{position:sticky;top:0;z-index:5;background:var(--pap);border-bottom:1px solid var(--fil);
 padding:.7rem 1.2rem;display:flex;gap:.6rem;flex-wrap:wrap;justify-content:center;align-items:center}
input[type=search]{flex:1 1 15rem;max-width:26rem;padding:.55rem .8rem;border:1px solid var(--fil);
 border-radius:2rem;background:transparent;color:var(--enc);font:inherit;font-size:.95rem}
select{padding:.5rem .6rem;border:1px solid var(--fil);border-radius:2rem;background:transparent;
 color:var(--enc);font:inherit;font-size:.9rem}
#etat{color:var(--pale);font-size:.85rem;width:100%;text-align:center}
main{max-width:42rem;margin:0 auto;padding:1.5rem 1.2rem 5rem}
article{padding:1.8rem 0;border-bottom:1px solid var(--fil)}
article h2{font-size:1.3rem;font-weight:400;margin:0 0 .25rem;line-height:1.3}
.meta{color:var(--pale);font-size:.8rem;font-style:italic;margin:0 0 1rem}
.corps p{margin:0 0 .55rem;white-space:pre-wrap}
.corps h2,.corps h3{font-size:1.1rem;font-weight:400;margin:1.2rem 0 .4rem}
.corps blockquote{margin:.6rem 0;padding-left:1rem;border-left:2px solid var(--fil);color:var(--pale)}
.corps img{max-width:100%;height:auto}
.repl{margin:1.4rem 0 0;padding:.9rem 1rem;border-left:2px solid var(--acc);background:rgba(138,75,42,.05)}
.repl h3{margin:0 0 .7rem;font-size:.8rem;font-weight:400;color:var(--pale);
 text-transform:uppercase;letter-spacing:.09em}
.repl .un{margin:0 0 .9rem;font-size:.95rem}
.repl .un:last-child{margin:0}
.repl b{font-weight:600}.repl .q{color:var(--pale);font-size:.78rem;font-style:italic}
.repl .txt{margin:.2rem 0 0;white-space:pre-wrap}
mark{background:rgba(208,138,94,.35);color:inherit;border-radius:2px}
.plus{display:block;width:100%;margin:2.5rem 0 0;padding:.8rem;border:1px solid var(--fil);
 border-radius:2rem;background:transparent;color:var(--enc);font:inherit;cursor:pointer}
.plus:hover{border-color:var(--acc);color:var(--acc)}
.plus[hidden]{display:none}
#vide{text-align:center;color:var(--pale);font-style:italic;padding:3rem 0}
.lien{color:var(--pale);font-size:.75rem}.lien a{color:inherit}
footer{text-align:center;padding:2.5rem 1.2rem 4rem;color:var(--pale);font-size:.8rem;
 border-top:1px solid var(--fil);font-style:italic}
@media print{.barre,.plus,footer{display:none}article{page-break-inside:avoid}}
"""

JS = """
const T=DATA, PAS=40;
let vus=0, res=T;
const q=document.getElementById('q'), an=document.getElementById('an'),
      flux=document.getElementById('flux'), etat=document.getElementById('etat'),
      plus=document.getElementById('plus');

const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

function surligne(txt,mots){
  let h=esc(txt);
  if(!mots.length) return h;
  const n=norm(h); let marques=[];
  for(const m of mots){ let i=0; while((i=n.indexOf(m,i))!==-1){ marques.push([i,i+m.length]); i+=m.length; } }
  if(!marques.length) return h;
  marques.sort((a,b)=>a[0]-b[0]);
  let out='',pos=0;
  for(const [a,b] of marques){ if(a<pos) continue;
    out+=h.slice(pos,a)+'<mark>'+h.slice(a,b)+'</mark>'; pos=b; }
  return out+h.slice(pos);
}

function corps(txt,mots){
  return txt.split(/\\n{2,}/).filter(b=>b.trim())
    .map(b=>'<p>'+surligne(b,mots)+'</p>').join('');
}

function rendu(reset){
  if(reset){ flux.innerHTML=''; vus=0; }
  const mots=norm(q.value).split(/\\s+/).filter(m=>m.length>1);
  const lot=res.slice(vus,vus+PAS);
  flux.insertAdjacentHTML('beforeend', lot.map(r=>{
    const rep=r.c.length? '<div class="repl"><h3>'+r.c.length+
      (r.c.length>1?' réponses de ses lecteurs':' réponse d\\'un lecteur')+'</h3>'+
      r.c.map(k=>'<div class="un"><b>'+esc(k.a||'anonyme')+'</b> <span class="q">'+
        esc(k.d)+'</span><div class="txt">'+surligne(k.x,mots)+'</div></div>').join('')+'</div>' : '';
    return '<article><h2>'+surligne(r.t,mots)+'</h2><p class="meta">'+esc(r.j)+'</p>'+
      '<div class="corps">'+corps(r.x,mots)+'</div>'+rep+
      '<p class="lien"><a href="'+r.u+'">'+r.u+'</a></p></article>';
  }).join(''));
  vus+=lot.length;
  if(!res.length) flux.innerHTML='<p id="vide">Aucun poème ne contient ces mots.</p>';
  plus.hidden = vus>=res.length;
  plus.textContent='Lire les '+Math.min(PAS,res.length-vus)+' poèmes suivants ('+
    (res.length-vus)+' restants)';
  etat.textContent = res.length===T.length
    ? T.length.toLocaleString('fr-FR')+' poèmes — affichage du plus récent au plus ancien'
    : res.length.toLocaleString('fr-FR')+' poème'+(res.length>1?'s':'')+' trouvé'+(res.length>1?'s':'');
}

function filtre(){
  const mots=norm(q.value).split(/\\s+/).filter(m=>m.length>1), a=an.value;
  res=T.filter(r=>{
    if(a && r.d.slice(0,4)!==a) return false;
    if(!mots.length) return true;
    const h=norm(r.t+' '+r.x+' '+r.c.map(k=>k.a+' '+k.x).join(' '));
    return mots.every(m=>h.includes(m));
  });
  rendu(true);
}

let tempo;
q.addEventListener('input',()=>{clearTimeout(tempo);tempo=setTimeout(filtre,180)});
an.addEventListener('change',filtre);
plus.addEventListener('click',()=>rendu(false));
rendu(true);
"""

opts = "".join(f'<option value="{y}">{y} — {n} poèmes</option>'
               for y, n in sorted(annees.items(), reverse=True))

doc = f"""<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>le radeau du radotage — l'œuvre complète</title>
<style>{CSS}</style>
</head><body>
<header>
  <h1>le radeau du radotage</h1>
  <p class="sous">{len(data):,} poèmes, écrits presque chaque jour de {min(annees)} à {max(annees)}</p>
  <p class="chiffres">{mots:,} mots · {nb_com:,} réponses de ses lecteurs · archive complète du blog</p>
</header>
<div class="barre">
  <input type="search" id="q" placeholder="Chercher un mot, un vers, un nom…" autocomplete="off">
  <select id="an"><option value="">Toutes les années</option>{opts}</select>
  <span id="etat"></span>
</div>
<main>
  <div id="flux"></div>
  <button class="plus" id="plus" hidden></button>
</main>
<footer>
  <p>Archive réalisée le {datetime.date.today().strftime('%d/%m/%Y')}, avant la fermeture d'unblog.fr.<br>
  Ce fichier est autonome : il contient tout, et s'ouvre sans internet.</p>
</footer>
<script>const DATA={json.dumps(data, ensure_ascii=False, separators=(',', ':'))};</script>
<script>{JS}</script>
</body></html>
"""
doc = doc.replace(f"{len(data):,}", f"{len(data):,}".replace(",", " ")) \
         .replace(f"{mots:,}", f"{mots:,}".replace(",", " ")) \
         .replace(f"{nb_com:,}", f"{nb_com:,}".replace(",", " "))

out = ROOT / "le-radeau-du-radotage.html"
out.write_text(doc, encoding="utf-8")

tableau = "\n".join(f"| {y} | {n} |" for y, n in sorted(annees.items()))
(ROOT / "README.md").write_text(f"""# le radeau du radotage — archive complète

Sauvegarde intégrale du blog `radotage010446g.unblog.fr`, réalisée le
{datetime.date.today().strftime('%d/%m/%Y')}, avant la fermeture d'unblog.fr le 31 décembre.

**{len(posts)} poèmes**, écrits presque chaque jour du
{fr_date(min(p['date'] for p in posts))} au {fr_date(max(p['date'] for p in posts))}.
Environ {mots:,} mots, et {nb_com:,} réponses de ses lecteurs.

## Par où commencer

**`le-radeau-du-radotage.html`** — tout le blog dans un seul fichier.
Double-cliquez : il s'ouvre dans n'importe quel navigateur, sans internet,
avec la recherche plein texte et les commentaires. C'est le fichier à copier
et à donner à la famille.

## Le détail

| dossier | contenu |
|---|---|
| `archive/posts/` | {len(posts)} fichiers Markdown, un par poème, avec leurs métadonnées — prêts pour n'importe quel générateur de site |
| `archive/html/` | les mêmes, en pages HTML autonomes |
| `archive/raw-feed/` | les flux RSS d'origine ({len(list((ARCH / 'raw-feed').glob('*.xml')))} fichiers) — la source brute, intacte |
| `archive/raw-pages/` | la page complète de chaque article, telle que servie par unblog |
| `archive/posts.json` | tous les poèmes en un seul fichier structuré |
| `archive/comments.json` | les commentaires, par poème |
| `archive/pages.json` | les pages fixes du blog |
| `archive/images/` | les images référencées dans les articles |

Rien n'a été réécrit : les retours à la ligne des vers, les titres et les
dates sont ceux de l'original. Les {len([p for p in posts if not p['markdown'].strip()])} articles
sans texte étaient déjà vides sur le blog (annonces d'absence, un billet raté).

## Les poèmes par année

| année | poèmes |
|---|---|
{tableau}

## Refaire la récolte

```
python fetch_feed.py     # aspire les flux RSS (tous les articles)
python fetch_pages.py    # aspire les pages et les commentaires (reprend où il s'est arrêté)
python fetch_extras.py   # pages fixes et images
python convert.py        # génère le Markdown et le HTML
python build_archive.py  # génère le fichier unique et ce README
```
""".replace(f"{mots:,}", f"{mots:,}".replace(",", " ")).replace(f"{nb_com:,}", f"{nb_com:,}".replace(",", " ")),
    encoding="utf-8")

print(f"{out.name} : {out.stat().st_size/1e6:.1f} Mo — {len(data)} poemes, {nb_com} commentaires")
print("README.md ecrit")
