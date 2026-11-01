import Link from "next/link";
import type { Metadata } from "next";
import { enFrancais } from "@/lib/dates";
import { chercher, statistiques } from "@/lib/poemes";

export const metadata: Metadata = { title: "Recherche" };

const nf = new Intl.NumberFormat("fr-FR");

type Props = { searchParams: Promise<{ q?: string }> };

export default async function PageRecherche({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const requete = q.trim();
  const resultats = requete ? await chercher(requete) : [];
  const s = await statistiques();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <h1 className="m-0 text-3xl font-normal">Recherche</h1>
      <p className="mt-3 text-encre-douce">
        Un mot, un vers, un nom — dans les {nf.format(s.poemes)} poèmes.
      </p>

      {/* Un formulaire GET : la recherche marche même sans JavaScript,
          et chaque résultat a son adresse partageable. */}
      <form method="get" className="mt-7 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={requete}
          autoFocus
          placeholder="Par exemple : vieillesse, école, Vercors…"
          aria-label="Chercher dans les poèmes"
          className="min-w-0 flex-1 rounded-full border border-trait bg-paper-haut px-5 py-3 text-encre placeholder:text-encre-douce/70"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-accent px-6 py-3 font-sans text-sm text-paper transition-opacity hover:opacity-90"
        >
          Chercher
        </button>
      </form>

      {requete && (
        <p className="mt-8 font-sans text-sm text-encre-douce">
          {resultats.length === 0
            ? "Aucun poème ne contient ces mots."
            : `${resultats.length}${resultats.length >= 60 ? "+" : ""} poème${
                resultats.length > 1 ? "s" : ""
              } trouvé${resultats.length > 1 ? "s" : ""}.`}
        </p>
      )}

      <div className="mt-2">
        {resultats.map(({ poeme, extrait }) => (
          <article key={poeme.slug} className="border-b border-trait py-6">
            <h2 className="m-0 text-lg font-normal">
              <Link
                href={`/poeme/${poeme.slug}`}
                className="text-encre no-underline hover:text-accent hover:underline"
              >
                {poeme.titre}
              </Link>
            </h2>
            <p className="mb-2 mt-1 font-sans text-xs uppercase tracking-wider text-encre-douce">
              {enFrancais(poeme.date)}
            </p>
            <p className="m-0 text-encre-douce">{extrait}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
