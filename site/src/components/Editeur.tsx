"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { corriger, publier, supprimer } from "@/lib/ecriture";

/** Un brouillon par poème en cours : le nouveau n'écrase pas une correction. */
const cle = (slug?: string) => (slug ? `brouillon:${slug}` : "brouillon");

function lireBrouillon(slug?: string): { titre: string; texte: string } | null {
  try {
    const b = localStorage.getItem(cle(slug));
    if (b) {
      const d = JSON.parse(b);
      return { titre: d.titre ?? "", texte: d.texte ?? "" };
    }
  } catch {
    // Pas de brouillon récupérable.
  }
  return null;
}

export type PoemeAModifier = { slug: string; titre: string; texte: string };

/**
 * L'écran d'écriture, qui sert aussi à corriger.
 *
 * Deux règles ont tout décidé : il a 84 ans, et perdre un poème serait
 * impardonnable. Donc de gros caractères, deux champs, un bouton — et un
 * brouillon sauvegardé en permanence dans le navigateur.
 */
export function Editeur({ poeme }: { poeme?: PoemeAModifier }) {
  const router = useRouter();
  const correction = Boolean(poeme);

  // Ce composant ne tourne jamais sur le serveur (voir EditeurSansServeur) :
  // on peut relire le brouillon dès l'état initial.
  const [depart] = useState(
    () => lireBrouillon(poeme?.slug) ?? { titre: poeme?.titre ?? "", texte: poeme?.texte ?? "" },
  );
  const [titre, setTitre] = useState(depart.titre);
  const [texte, setTexte] = useState(depart.texte);
  const [etat, setEtat] = useState<"repos" | "enregistre" | "envoi">("repos");
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);

  // Enregistrement continu, une seconde après la dernière frappe.
  useEffect(() => {
    if (!titre && !texte) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(cle(poeme?.slug), JSON.stringify({ titre, texte }));
        setEtat("enregistre");
      } catch {
        // Stockage indisponible : on n'affiche pas une fausse assurance.
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [titre, texte, poeme?.slug]);

  function oublieLeBrouillon() {
    try {
      localStorage.removeItem(cle(poeme?.slug));
    } catch {
      // Sans importance : le poème est enregistré.
    }
  }

  async function envoyer() {
    setErreur(null);
    setEtat("envoi");
    const r = poeme
      ? await corriger(poeme.slug, titre, texte)
      : await publier(titre, texte);
    if (!r.ok) {
      setErreur(r.erreur);
      setEtat("repos");
      return;
    }
    oublieLeBrouillon();
    router.push(`/poeme/${r.slug}`);
  }

  async function effacer() {
    if (!poeme) return;
    setErreur(null);
    setEtat("envoi");
    const r = await supprimer(poeme.slug);
    if (!r.ok) {
      setErreur(r.erreur);
      setEtat("repos");
      return;
    }
    oublieLeBrouillon();
    router.push("/");
  }

  const vers = texte.split("\n").filter((l) => l.trim()).length;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <h1 className="m-0 text-3xl font-normal">
        {correction ? "Corriger le poème" : "Écrire un poème"}
      </h1>
      <p className="mt-2 font-sans text-sm text-encre-douce">
        {correction
          ? "L’adresse du poème ne changera pas : les liens déjà envoyés continueront de fonctionner."
          : "Écrivez comme vous l’entendez : les retours à la ligne seront gardés exactement tels quels."}
      </p>

      <label htmlFor="titre" className="mt-10 block font-sans text-sm text-encre-douce">
        Le titre
      </label>
      <input
        id="titre"
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
        placeholder="Donnez-lui un titre"
        className="mt-2 w-full rounded-xl border border-trait bg-paper-haut px-5 py-4 text-2xl text-encre placeholder:text-encre-douce/60"
      />

      <label htmlFor="texte" className="mt-8 block font-sans text-sm text-encre-douce">
        Le poème
      </label>
      <textarea
        id="texte"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={18}
        placeholder={"Premier vers\nDeuxième vers\n\nUne ligne vide sépare les strophes"}
        spellCheck
        // La même typographie qu'à la lecture : ce qu'il voit ici est
        // exactement ce que la famille verra.
        className="vers mt-2 w-full resize-y rounded-xl border border-trait bg-paper-haut px-5 py-4 text-[1.0625rem] leading-[1.85] text-encre placeholder:text-encre-douce/60"
      />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-sm text-encre-douce">
        <span>{vers > 0 ? `${vers} vers` : " "}</span>
        {etat === "enregistre" && (
          <span className="text-accent">Brouillon enregistré</span>
        )}
      </div>

      {erreur && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-accent bg-accent-doux px-4 py-3 font-sans text-sm text-accent"
        >
          {erreur}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={envoyer}
          disabled={etat === "envoi" || !titre.trim() || !texte.trim()}
          className="rounded-full bg-accent px-8 py-4 font-sans text-base text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {etat === "envoi"
            ? "Enregistrement…"
            : correction
              ? "Enregistrer la correction"
              : "Publier"}
        </button>
        {correction ? (
          <Link
            href={`/poeme/${poeme!.slug}`}
            className="font-sans text-sm text-encre-douce underline decoration-trait underline-offset-4 hover:text-accent"
          >
            Annuler
          </Link>
        ) : (
          <span className="font-sans text-sm text-encre-douce">
            Il paraîtra aussitôt sur le site, à la date d’aujourd’hui.
          </span>
        )}
      </div>

      {correction && (
        <div className="mt-16 border-t border-trait pt-6">
          {confirmeSuppression ? (
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-sans text-sm text-encre">
                Supprimer ce poème pour de bon ?
              </span>
              <button
                type="button"
                onClick={effacer}
                className="rounded-full border border-accent px-5 py-2 font-sans text-sm text-accent hover:bg-accent-doux"
              >
                Oui, supprimer
              </button>
              <button
                type="button"
                onClick={() => setConfirmeSuppression(false)}
                className="font-sans text-sm text-encre-douce underline decoration-trait underline-offset-4"
              >
                Non, garder
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmeSuppression(true)}
              className="font-sans text-sm text-encre-douce underline decoration-trait underline-offset-4 hover:text-accent"
            >
              Supprimer ce poème
            </button>
          )}
        </div>
      )}
    </div>
  );
}
