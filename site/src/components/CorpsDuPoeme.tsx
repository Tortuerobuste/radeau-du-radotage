/**
 * Le texte d'un poème.
 *
 * Les retours à la ligne sont le poème : on les rend tels quels (`pre-wrap`),
 * et on sépare seulement les strophes, là où il avait laissé une ligne vide.
 */
export function CorpsDuPoeme({ texte }: { texte: string }) {
  const strophes = texte.split(/\n{2,}/).filter((s) => s.trim());

  if (!strophes.length) {
    return (
      <p className="font-sans text-sm italic text-encre-douce">
        Ce billet n’avait pas de texte, déjà sur l’ancien blog.
      </p>
    );
  }

  return (
    <div className="text-[1.0625rem] leading-[1.85]">
      {strophes.map((strophe, i) => (
        <p key={i} className="vers mb-6 last:mb-0">
          {strophe}
        </p>
      ))}
    </div>
  );
}
