import type { Metadata } from "next";
import Link from "next/link";
import { enFrancais } from "@/lib/dates";
import { sesDerniersPoemes } from "@/lib/sesPoemes";

export const metadata: Metadata = {
  title: "Mes poèmes",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function PageMesPoemes() {
  const siens = await sesDerniersPoemes(100);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <h1 className="m-0 text-3xl font-normal">Mes poèmes</h1>
      <p className="mt-3 text-encre-douce">
        Ceux que vous avez écrits depuis la reprise. Les poèmes de l’ancien
        blog sont dans les{" "}
        <Link href="/archives" className="text-accent underline decoration-trait underline-offset-4">
          archives
        </Link>
        , et ne se modifient pas.
      </p>

      {siens.length === 0 ? (
        <div className="mt-12 rounded-xl border border-trait bg-paper-haut px-6 py-10 text-center">
          <p className="m-0 text-encre-douce">
            Vous n’avez encore rien écrit ici.
          </p>
          <Link
            href="/ecrire"
            className="mt-6 inline-block rounded-full bg-accent px-7 py-3.5 font-sans text-base text-paper no-underline transition-opacity hover:opacity-90"
          >
            Écrire un poème
          </Link>
        </div>
      ) : (
        <ul className="mt-10 list-none p-0">
          {siens.map((p) => (
            <li
              key={p.slug}
              className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-trait py-5"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/poeme/${p.slug}`}
                  className="text-lg text-encre no-underline hover:text-accent"
                >
                  {p.titre}
                </Link>
                <p className="m-0 mt-0.5 font-sans text-xs uppercase tracking-wider text-encre-douce">
                  {enFrancais(p.date)}
                </p>
              </div>
              {/* Un vrai bouton, pas un lien discret : il doit le voir. */}
              <Link
                href={`/ecrire/${p.slug}`}
                className="shrink-0 rounded-full border border-accent px-5 py-2 font-sans text-sm text-accent no-underline transition-colors hover:bg-accent-doux"
              >
                Corriger ou supprimer
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
