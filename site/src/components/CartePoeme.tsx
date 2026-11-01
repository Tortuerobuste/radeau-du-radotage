import Link from "next/link";
import { enFrancais } from "@/lib/dates";
import type { Poeme } from "@/lib/types";

/** Un poème dans une liste : titre, date, et ses premiers vers. */
export function CartePoeme({
  poeme,
  lignes = 4,
}: {
  poeme: Poeme;
  lignes?: number;
}) {
  const debut = poeme.texte
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, lignes)
    .join("\n");

  return (
    <article className="border-b border-trait py-7 last:border-0">
      <h2 className="m-0 text-xl font-normal leading-snug">
        <Link
          href={`/poeme/${poeme.slug}`}
          className="text-encre no-underline decoration-trait underline-offset-4 hover:text-accent hover:underline"
        >
          {poeme.titre}
        </Link>
      </h2>

      <p className="mb-4 mt-1 font-sans text-xs uppercase tracking-wider text-encre-douce">
        <time dateTime={poeme.date}>{enFrancais(poeme.date)}</time>
        {poeme.commentaires.length > 0 && (
          <> · {poeme.commentaires.length} réponse{poeme.commentaires.length > 1 ? "s" : ""}</>
        )}
      </p>

      {debut && (
        <p className="vers m-0 text-encre-douce">{debut}</p>
      )}
    </article>
  );
}
