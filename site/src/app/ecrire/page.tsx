import type { Metadata } from "next";
import Link from "next/link";
import { EditeurSansServeur } from "@/components/EditeurSansServeur";
import { enFrancais } from "@/lib/dates";
import { sesDerniersPoemes } from "@/lib/sesPoemes";
import { seDeconnecter } from "../connexion/actions";

export const metadata: Metadata = {
  title: "Écrire",
  robots: { index: false },
};

// Son espace dépend de qui est connecté : jamais de version mise en cache,
// et pas de comportement qui change selon que la base est configurée ou non.
export const dynamic = "force-dynamic";

export default async function PageEcrire() {
  const siens = await sesDerniersPoemes();

  return (
    <>
      <div className="mx-auto flex max-w-2xl justify-end px-5 pt-6">
        <form action={seDeconnecter}>
          <button
            type="submit"
            className="rounded-full px-3 py-1.5 font-sans text-sm text-encre-douce transition-colors hover:bg-accent-doux hover:text-accent"
          >
            Sortir
          </button>
        </form>
      </div>

      <EditeurSansServeur />

      {siens.length > 0 && (
        <section className="mx-auto max-w-2xl px-5 pb-16">
          <h2 className="m-0 border-t border-trait pt-8 font-sans text-xs uppercase tracking-[0.18em] text-encre-douce">
            Vos derniers poèmes
          </h2>
          <ul className="mt-4 list-none p-0">
            {siens.map((p) => (
              <li
                key={p.slug}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-trait py-3"
              >
                <Link
                  href={`/poeme/${p.slug}`}
                  className="text-encre no-underline hover:text-accent"
                >
                  {p.titre}
                </Link>
                <span className="font-sans text-xs text-encre-douce">
                  {enFrancais(p.date)}
                </span>
                <Link
                  href={`/ecrire/${p.slug}`}
                  className="ml-auto font-sans text-sm text-accent no-underline hover:underline"
                >
                  Corriger
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
