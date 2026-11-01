"use client";

import dynamic from "next/dynamic";
import type { PoemeAModifier } from "./Editeur";

/**
 * L'éditeur ne s'affiche que dans le navigateur.
 *
 * Il lit son brouillon dans localStorage dès son premier rendu ; le faire
 * aussi côté serveur donnerait un écran vide puis un sursaut au moment où
 * le texte réapparaît.
 */
const Editeur = dynamic(() => import("./Editeur").then((m) => m.Editeur), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <p className="font-sans text-sm text-encre-douce">Ouverture du cahier…</p>
    </div>
  ),
});

export function EditeurSansServeur({ poeme }: { poeme?: PoemeAModifier }) {
  return <Editeur poeme={poeme} />;
}
