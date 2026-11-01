import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CorpsDuPoeme } from "@/components/CorpsDuPoeme";
import { enFrancais } from "@/lib/dates";
import { poemeParSlug, voisins } from "@/lib/poemes";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const poeme = await poemeParSlug(slug);
  if (!poeme) return {};
  return {
    title: poeme.titre,
    description: poeme.texte.replace(/\s+/g, " ").slice(0, 155),
  };
}

export default async function PagePoeme({ params }: Params) {
  const { slug } = await params;
  const poeme = await poemeParSlug(slug);
  if (!poeme) notFound();

  const { precedent, suivant } = await voisins(slug);

  return (
    <article className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="m-0 text-3xl font-normal leading-tight sm:text-[2.1rem]">
          {poeme.titre}
        </h1>
        <p className="mt-3 font-sans text-xs uppercase tracking-wider text-encre-douce">
          <time dateTime={poeme.date}>{enFrancais(poeme.date)}</time>
        </p>
      </header>

      <CorpsDuPoeme texte={poeme.texte} />

      {poeme.commentaires.length > 0 && (
        <section className="mt-16 border-t border-trait pt-8">
          <h2 className="m-0 font-sans text-xs uppercase tracking-[0.18em] text-encre-douce">
            {poeme.commentaires.length} réponse
            {poeme.commentaires.length > 1 ? "s" : ""}
          </h2>
          <ul className="mt-6 list-none space-y-7 p-0">
            {poeme.commentaires.map((c, i) => (
              <li key={i} className="border-l-2 border-trait pl-5">
                <p className="m-0 font-sans text-sm">
                  <span className="font-medium text-encre">{c.auteur}</span>
                  {c.date && (
                    <span className="text-encre-douce"> · {c.date}</span>
                  )}
                </p>
                <p className="vers m-0 mt-1.5 text-encre-douce">{c.texte}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="sans-impression mt-16 flex flex-col gap-3 border-t border-trait pt-8 font-sans text-sm sm:flex-row sm:justify-between">
        {precedent ? (
          <Link
            href={`/poeme/${precedent.slug}`}
            className="max-w-[48%] text-encre-douce no-underline hover:text-accent"
          >
            <span className="block text-xs uppercase tracking-wider">
              Précédent
            </span>
            {precedent.titre}
          </Link>
        ) : (
          <span />
        )}
        {suivant && (
          <Link
            href={`/poeme/${suivant.slug}`}
            className="max-w-[48%] text-encre-douce no-underline hover:text-accent sm:text-right"
          >
            <span className="block text-xs uppercase tracking-wider">
              Suivant
            </span>
            {suivant.titre}
          </Link>
        )}
      </nav>

      {poeme.sourceUnblog && (
        <p className="sans-impression mt-10 font-sans text-xs text-encre-douce">
          Publié à l’origine sur unblog.fr, le {enFrancais(poeme.date)}.
        </p>
      )}
    </article>
  );
}
