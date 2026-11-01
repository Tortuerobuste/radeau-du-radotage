import Link from "next/link";
import type { Metadata } from "next";
import { annees, statistiques } from "@/lib/poemes";

export const metadata: Metadata = { title: "Archives" };

const nf = new Intl.NumberFormat("fr-FR");

export default async function PageArchives() {
  const liste = await annees();
  const s = await statistiques();
  const maximum = Math.max(...liste.map((a) => a.nombre));

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <h1 className="m-0 text-3xl font-normal">Archives</h1>
      <p className="mt-3 max-w-prose text-encre-douce">
        {nf.format(s.poemes)} poèmes, de {s.premier.slice(0, 4)} à{" "}
        {s.dernier.slice(0, 4)}. Chaque barre est une année d’écriture.
      </p>

      <ul className="mt-10 list-none space-y-1 p-0">
        {liste.map((a) => (
          <li key={a.annee}>
            <Link
              href={`/archives/${a.annee}`}
              className="group flex items-center gap-4 rounded-lg px-3 py-2.5 no-underline transition-colors hover:bg-accent-doux"
            >
              <span className="w-14 shrink-0 font-sans text-sm text-encre">
                {a.annee}
              </span>
              <span
                className="h-2 rounded-full bg-accent/35 transition-colors group-hover:bg-accent"
                style={{ width: `${(a.nombre / maximum) * 100}%` }}
                aria-hidden
              />
              <span className="shrink-0 font-sans text-xs text-encre-douce">
                {a.nombre} poèmes
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
