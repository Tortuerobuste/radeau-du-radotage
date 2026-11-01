"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clientNavigateur } from "@/lib/supabase/navigateur";
import { seDeconnecter } from "@/app/connexion/actions";

/**
 * Les boutons de la barre du haut qui dépendent de la connexion.
 *
 * Côté navigateur, et pas côté serveur : consulter la session sur le
 * serveur rendrait chaque page dynamique pour tous les visiteurs, alors
 * que ça ne concerne qu'une personne. Ici on lit simplement le cookie de
 * session déjà présent, sans aucun appel réseau.
 *
 * Ce composant ne protège rien : il montre des boutons. La porte est
 * gardée par proxy.ts et par les règles de la base.
 */
export function NavConnexion() {
  const [connecte, setConnecte] = useState<boolean | null>(null);

  useEffect(() => {
    if (!clientNavigateur) return;

    clientNavigateur.auth
      .getSession()
      .then(({ data }) => setConnecte(Boolean(data.session)));

    // Se connecter ou sortir met la barre à jour sans recharger la page.
    const { data } = clientNavigateur.auth.onAuthStateChange((_e, session) =>
      setConnecte(Boolean(session)),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  // Tant qu'on ne sait pas, on n'affiche rien plutôt que de faire
  // clignoter « Connexion » sous ses yeux à chaque page.
  if (connecte === null) return null;

  if (!connecte) {
    return (
      <Link href="/connexion" className={lienClasse}>
        Connexion
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/ecrire"
        className="rounded-full bg-accent px-4 py-1.5 text-paper no-underline transition-opacity hover:opacity-90"
      >
        Écrire
      </Link>
      <Link href="/mes-poemes" className={lienClasse}>
        Mes poèmes
      </Link>
      <form action={seDeconnecter}>
        <button type="submit" className={lienClasse}>
          Sortir
        </button>
      </form>
    </>
  );
}

const lienClasse =
  "rounded-full px-3 py-1.5 font-sans text-sm text-encre-douce no-underline transition-colors hover:bg-accent-doux hover:text-accent";
