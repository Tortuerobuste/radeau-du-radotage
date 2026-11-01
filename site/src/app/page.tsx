import Link from "next/link";
import { CartePoeme } from "@/components/CartePoeme";
import { poemesRecents, statistiques } from "@/lib/poemes";

const nf = new Intl.NumberFormat("fr-FR");

export default async function Accueil() {
  const recents = await poemesRecents(12);
  const s = await statistiques();

  return (
    <div className="mx-auto max-w-3xl px-5">
      <section className="border-b border-trait py-14 text-center sm:py-20">
        <h1 className="m-0 text-4xl font-normal leading-tight sm:text-5xl">
          le radeau du radotage
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg italic text-encre-douce">
          Des poèmes, écrits presque chaque jour depuis {s.premier.slice(0, 4)}.
        </p>
        <p className="mt-6 font-sans text-sm text-encre-douce">
          {nf.format(s.poemes)} poèmes · {nf.format(s.mots)} mots ·{" "}
          {nf.format(s.commentaires)} réponses de ses lecteurs
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 font-sans text-sm">
          <Link
            href="/archives"
            className="rounded-full border border-trait px-5 py-2.5 text-encre no-underline transition-colors hover:border-accent hover:text-accent"
          >
            Parcourir les archives
          </Link>
          <Link
            href="/recherche"
            className="rounded-full border border-trait px-5 py-2.5 text-encre no-underline transition-colors hover:border-accent hover:text-accent"
          >
            Chercher un poème
          </Link>
        </div>
      </section>

      <section className="py-4">
        <h2 className="mb-2 mt-8 font-sans text-xs uppercase tracking-[0.18em] text-encre-douce">
          Les plus récents
        </h2>
        {recents.map((p) => (
          <CartePoeme key={p.slug} poeme={p} />
        ))}

        <p className="pt-10 text-center font-sans text-sm">
          <Link
            href="/archives"
            className="text-accent underline decoration-trait underline-offset-4"
          >
            Voir les {nf.format(s.poemes)} poèmes, année par année
          </Link>
        </p>
      </section>
    </div>
  );
}
