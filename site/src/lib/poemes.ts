import "server-only";
import { unstable_cache } from "next/cache";
import archiveBrute from "../../content/poemes.json";
import { clientPublic, ETIQUETTE_POEMES } from "./supabase/publique";
import type { Annee, Poeme } from "./types";

/**
 * Seul point d'accès aux poèmes.
 *
 * Deux sources, et c'est délibéré :
 *  — l'archive d'unblog (2011-2026) est un fichier figé du dépôt. Elle ne
 *    changera plus, elle ne coûte aucune requête, et elle survit à la
 *    disparition de n'importe quel service.
 *  — ce qu'il écrit à partir de maintenant vit dans Supabase.
 * Le script `npm run exporter` reverse les nouveaux dans l'archive, pour
 * que le dépôt reste à lui seul une copie complète.
 */

const plusRecentDAbord = (a: Poeme, b: Poeme) => b.date.localeCompare(a.date);

const archive: Poeme[] = [...(archiveBrute as Poeme[])].sort(plusRecentDAbord);

type Ligne = { slug: string; titre: string; texte: string; date: string };

/**
 * Les poèmes qu'il a écrits depuis la reprise.
 *
 * Mis en cache et réutilisé par tous les visiteurs : la base n'est
 * interrogée qu'à la première visite, puis à chaque fois qu'il publie.
 */
const nouveaux = unstable_cache(
  async (): Promise<Poeme[]> => {
    if (!clientPublic) return []; // Base pas encore branchée : l'archive suffit.

    const { data, error } = await clientPublic
      .from("poemes")
      .select("slug, titre, texte, date")
      .eq("publie", true)
      .order("date", { ascending: false });

    if (error) {
      // Si la base est indisponible, le site doit rester lisible.
      console.error("Lecture des nouveaux poèmes impossible :", error.message);
      return [];
    }

    return (data as Ligne[]).map((l) => ({
      slug: l.slug,
      titre: l.titre,
      date: l.date,
      texte: l.texte,
      mots: l.texte.split(/\s+/).filter(Boolean).length,
      commentaires: [],
    }));
  },
  ["nouveaux-poemes"],
  { tags: [ETIQUETTE_POEMES], revalidate: 3600 },
);

async function tous(): Promise<Poeme[]> {
  const neufs = await nouveaux();
  if (!neufs.length) return archive;
  // Les nouveaux sont postérieurs à l'archive : on les met devant plutôt
  // que de retrier 6 290 poèmes à chaque affichage.
  return [...neufs.sort(plusRecentDAbord), ...archive];
}

/** Tout, archive et poèmes récents confondus. Pour le plan du site. */
export async function tousLesPoemes(): Promise<Poeme[]> {
  return tous();
}

export async function poemesRecents(nombre = 12): Promise<Poeme[]> {
  return (await tous()).slice(0, nombre);
}

export async function poemeParSlug(slug: string): Promise<Poeme | undefined> {
  return (await tous()).find((p) => p.slug === slug);
}

/** Le précédent et le suivant, dans l'ordre où il les a écrits. */
export async function voisins(
  slug: string,
): Promise<{ precedent?: Poeme; suivant?: Poeme }> {
  const liste = await tous();
  const i = liste.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  // La liste va du plus récent au plus ancien.
  return { suivant: liste[i - 1], precedent: liste[i + 1] };
}

export async function poemesDeLAnnee(annee: string): Promise<Poeme[]> {
  return (await tous()).filter((p) => p.date.startsWith(annee));
}

export async function annees(): Promise<Annee[]> {
  const compte = new Map<string, number>();
  for (const p of await tous()) {
    const a = p.date.slice(0, 4);
    compte.set(a, (compte.get(a) ?? 0) + 1);
  }
  return [...compte.entries()]
    .map(([annee, nombre]) => ({ annee, nombre }))
    .sort((a, b) => b.annee.localeCompare(a.annee));
}

export async function statistiques() {
  const liste = await tous();
  const dates = liste.map((p) => p.date).sort();
  return {
    poemes: liste.length,
    mots: liste.reduce((n, p) => n + p.mots, 0),
    commentaires: liste.reduce((n, p) => n + p.commentaires.length, 0),
    premier: dates[0],
    dernier: dates[dates.length - 1],
  };
}

/** Accents et casse ignorés : on cherche « ecole » et on trouve « École ». */
function pliable(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export type Resultat = { poeme: Poeme; extrait: string };

export async function chercher(
  requete: string,
  limite = 60,
): Promise<Resultat[]> {
  const mots = pliable(requete).split(/\s+/).filter((m) => m.length > 1);
  if (!mots.length) return [];

  const trouves: Resultat[] = [];
  for (const poeme of await tous()) {
    const foin = pliable(`${poeme.titre} ${poeme.texte}`);
    if (!mots.every((m) => foin.includes(m))) continue;

    // Un extrait centré sur la première occurrence, pour situer le mot.
    const i = foin.indexOf(mots[0]);
    const debut = Math.max(0, i - 70);
    const brut = poeme.texte.replace(/\s+/g, " ");
    const extrait =
      (debut > 0 ? "… " : "") +
      brut.slice(debut, debut + 190).trim() +
      (debut + 190 < brut.length ? " …" : "");

    trouves.push({ poeme, extrait });
    if (trouves.length >= limite) break;
  }
  return trouves;
}
