"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { seConnecter, type EtatConnexion } from "@/app/connexion/actions";

function Bouton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-8 w-full rounded-full bg-accent px-8 py-4 font-sans text-base text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Connexion…" : "Entrer"}
    </button>
  );
}

export function FormulaireConnexion({ suite }: { suite: string }) {
  const [etat, action] = useActionState<EtatConnexion, FormData>(seConnecter, {});
  // React vide le formulaire après l'action. On garde l'adresse : se voir
  // tout retaper après une faute de frappe sur le mot de passe, non.
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="mt-10">
      <input type="hidden" name="suite" value={suite} />

      <label htmlFor="email" className="block font-sans text-sm text-encre-douce">
        Votre adresse e-mail
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-2 w-full rounded-xl border border-trait bg-paper-haut px-5 py-4 text-lg text-encre"
      />

      <label
        htmlFor="motdepasse"
        className="mt-6 block font-sans text-sm text-encre-douce"
      >
        Votre mot de passe
      </label>
      <input
        id="motdepasse"
        name="motdepasse"
        type="password"
        autoComplete="current-password"
        required
        className="mt-2 w-full rounded-xl border border-trait bg-paper-haut px-5 py-4 text-lg text-encre"
      />

      {etat.erreur && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-accent bg-accent-doux px-4 py-3 font-sans text-sm text-accent"
        >
          {etat.erreur}
        </p>
      )}

      <Bouton />
    </form>
  );
}
