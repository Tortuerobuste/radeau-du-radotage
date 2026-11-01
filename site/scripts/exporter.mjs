/**
 * Rapatrie les poèmes écrits depuis Supabase dans l'archive du dépôt.
 *
 * Le but : que le dépôt seul reste une copie complète de son œuvre, sans
 * dépendre d'un service qui pourrait fermer comme unblog vient de le faire.
 *
 *   npm run exporter
 */
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !CLE) {
  console.error(
    "Il manque NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "Lancez : npm run exporter  depuis le dossier site/, avec le .env.local en place.",
  );
  process.exit(1);
}

const RACINE = path.resolve(import.meta.dirname, "..", "..");
const POSTS = path.join(RACINE, "archive", "posts");
const SEED = path.join(import.meta.dirname, "..", "content", "poemes.json");

const supabase = createClient(URL, CLE);

const { data, error } = await supabase
  .from("poemes")
  .select("slug, titre, texte, date")
  .eq("publie", true)
  .order("date", { ascending: true });

if (error) {
  console.error("Lecture impossible :", error.message);
  process.exit(1);
}

if (!data.length) {
  console.log("Aucun poème à rapatrier : rien n'a encore été écrit.");
  process.exit(0);
}

// 1. Un fichier Markdown par poème, au même format que l'archive d'unblog.
for (const p of data) {
  const annee = p.date.slice(0, 4);
  await mkdir(path.join(POSTS, annee), { recursive: true });

  const entete = [
    "---",
    `title: ${JSON.stringify(p.titre)}`,
    `date: ${JSON.stringify(p.date)}`,
    `slug: ${JSON.stringify(p.slug)}`,
    "---",
    "",
  ].join("\n");

  // Comme dans l'archive : deux espaces en fin de ligne = vers suivant.
  const corps = p.texte
    .split("\n")
    .map((l) => (l.trim() ? `${l}  ` : ""))
    .join("\n")
    .replace(/ {2}$/, "");

  await writeFile(
    path.join(POSTS, annee, `${p.slug}.md`),
    `${entete}\n# ${p.titre}\n\n${corps}\n`,
    "utf-8",
  );
}

// 2. Les verser dans le fichier que lit le site, pour qu'ils deviennent
//    eux aussi de l'archive figée.
const seed = JSON.parse(await readFile(SEED, "utf-8"));
const connus = new Set(seed.map((p) => p.slug));
let ajoutes = 0;

for (const p of data) {
  if (connus.has(p.slug)) continue;
  seed.push({
    slug: p.slug,
    titre: p.titre,
    date: p.date,
    texte: p.texte,
    mots: p.texte.split(/\s+/).filter(Boolean).length,
    commentaires: [],
  });
  ajoutes += 1;
}

seed.sort((a, b) => b.date.localeCompare(a.date));
await writeFile(SEED, JSON.stringify(seed, null, 0), "utf-8");

console.log(
  `${data.length} poèmes relus depuis la base, ${ajoutes} ajoutés à l'archive.`,
);
console.log("Pensez à committer archive/ et site/content/poemes.json.");
