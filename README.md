# le radeau du radotage — archive complète

Sauvegarde intégrale du blog `radotage010446g.unblog.fr`, réalisée le
01/11/2026, avant la fermeture d'unblog.fr le 31 décembre.

**6290 poèmes**, écrits presque chaque jour du
13 février 2011 au 28 octobre 2026.
Environ 921 259 mots, et 4 050 réponses de ses lecteurs.

## Par où commencer

**`le-radeau-du-radotage.html`** — tout le blog dans un seul fichier.
Double-cliquez : il s'ouvre dans n'importe quel navigateur, sans internet,
avec la recherche plein texte et les commentaires. C'est le fichier à copier
et à donner à la famille.

## Le détail

| dossier | contenu |
|---|---|
| `archive/posts/` | 6290 fichiers Markdown, un par poème, avec leurs métadonnées — prêts pour n'importe quel générateur de site |
| `archive/html/` | les mêmes, en pages HTML autonomes |
| `archive/raw-feed/` | les flux RSS d'origine (629 fichiers) — la source brute, intacte |
| `archive/raw-pages/` | la page complète de chaque article, telle que servie par unblog |
| `archive/posts.json` | tous les poèmes en un seul fichier structuré |
| `archive/comments.json` | les commentaires, par poème |
| `archive/pages.json` | les pages fixes du blog |
| `archive/images/` | les images référencées dans les articles |

Rien n'a été réécrit : les retours à la ligne des vers, les titres et les
dates sont ceux de l'original. Les 13 articles
sans texte étaient déjà vides sur le blog (annonces d'absence, un billet raté).

## Les poèmes par année

| année | poèmes |
|---|---|
| 2011 | 492 |
| 2012 | 255 |
| 2013 | 244 |
| 2014 | 354 |
| 2015 | 319 |
| 2016 | 318 |
| 2017 | 279 |
| 2018 | 336 |
| 2019 | 318 |
| 2020 | 478 |
| 2021 | 442 |
| 2022 | 491 |
| 2023 | 407 |
| 2024 | 609 |
| 2025 | 543 |
| 2026 | 405 |

## Refaire la récolte

```
python fetch_feed.py     # aspire les flux RSS (tous les articles)
python fetch_pages.py    # aspire les pages et les commentaires (reprend où il s'est arrêté)
python fetch_extras.py   # pages fixes et images
python convert.py        # génère le Markdown et le HTML
python build_archive.py  # génère le fichier unique et ce README
```
