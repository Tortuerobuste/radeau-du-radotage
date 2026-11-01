import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { annees, poemesDeLAnnee } from "@/lib/poemes";

type Params = { params: Promise<{ annee: string }> };

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export async function generateStaticParams() {
  return (await annees()).map((a) => ({ annee: a.annee }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { annee } = await params;
  return { title: `Poèmes de ${annee}` };
}

export default async function PageAnnee({ params }: Params) {
  const { annee } = await params;
  const poemes = await poemesDeLAnnee(annee);
  if (!poemes.length) notFound();

  const toutes = await annees();
  const i = toutes.findIndex((a) => a.annee === annee);
  const plusRecente = toutes[i - 1];
  const plusAncienne = toutes[i + 1];

  // Du plus ancien au plus récent : on relit l'année dans le sens où il l'a vécue.
  const parMois = new Map<string, typeof poemes>();
  for (const p of [...poemes].reverse()) {
    const m = p.date.slice(5, 7);
    if (!parMois.has(m)) parMois.set(m, []);
    parMois.get(m)!.push(p);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <p className="m-0 font-sans text-sm">
        <Link
          href="/archives"
          className="text-encre-douce no-underline hover:text-accent"
        >
          ← Toutes les années
        </Link>
      </p>

      <h1 className="m-0 mt-4 text-3xl font-normal">{annee}</h1>
      <p className="mt-2 text-encre-douce">
        {poemes.length} poèmes cette année-là.
      </p>

      {[...parMois.entries()].map(([mois, liste]) => (
        <section key={mois} className="mt-11">
          <h2 className="m-0 border-b border-trait pb-2 font-sans text-xs uppercase tracking-[0.18em] text-encre-douce">
            {MOIS[Number(mois) - 1]}
          </h2>
          <ul className="mt-3 list-none p-0">
            {liste.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/poeme/${p.slug}`}
                  className="flex items-baseline gap-4 rounded-lg px-3 py-2 no-underline transition-colors hover:bg-accent-doux"
                >
                  <span className="w-7 shrink-0 text-right font-sans text-xs tabular-nums text-encre-douce">
                    {Number(p.date.slice(8, 10))}
                  </span>
                  <span className="text-encre">{p.titre}</span>
                  {p.commentaires.length > 0 && (
                    <span className="ml-auto shrink-0 font-sans text-xs text-encre-douce">
                      {p.commentaires.length} rép.
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <nav className="mt-16 flex justify-between border-t border-trait pt-8 font-sans text-sm">
        {plusAncienne ? (
          <Link
            href={`/archives/${plusAncienne.annee}`}
            className="text-encre-douce no-underline hover:text-accent"
          >
            ← {plusAncienne.annee}
          </Link>
        ) : (
          <span />
        )}
        {plusRecente && (
          <Link
            href={`/archives/${plusRecente.annee}`}
            className="text-encre-douce no-underline hover:text-accent"
          >
            {plusRecente.annee} →
          </Link>
        )}
      </nav>
    </div>
  );
}
