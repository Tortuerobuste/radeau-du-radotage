"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clientServeur } from "@/lib/supabase/serveur";

export type EtatConnexion = { erreur?: string };

export async function seConnecter(
  _precedent: EtatConnexion,
  donnees: FormData,
): Promise<EtatConnexion> {
  const supabase = await clientServeur();
  if (!supabase) {
    return { erreur: "Le site n’est pas encore relié à sa base." };
  }

  const email = String(donnees.get("email") ?? "").trim();
  const motDePasse = String(donnees.get("motdepasse") ?? "");
  if (!email || !motDePasse) {
    return { erreur: "Il faut remplir les deux cases." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  if (error) {
    // On ne dit pas lequel des deux est faux : ça renseignerait un curieux
    // sur l'existence du compte.
    return { erreur: "L’adresse ou le mot de passe ne convient pas." };
  }

  revalidatePath("/", "layout");
  const suite = String(donnees.get("suite") ?? "/ecrire");
  redirect(suite.startsWith("/") ? suite : "/ecrire");
}

export async function seDeconnecter() {
  const supabase = await clientServeur();
  await supabase?.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
