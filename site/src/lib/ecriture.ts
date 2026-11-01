"use server";

import { updateTag } from "next/cache";
import { clientServeur } from "./supabase/serveur";
import { ETIQUETTE_POEMES } from "./supabase/publique";

export type Resultat =
  | { ok: true; slug: string }
  | { ok: false; erreur: string };

function enSlug(titre: string, date: string): string {
  const base = titre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 55);
  return `${date}-${base || "poeme"}`;
}

export async function publier(titre: string, texte: string): Promise<Resultat> {
  const t = titre.trim();
  const x = texte.replace(/\r\n/g, "\n").trimEnd();

  if (!t) return { ok: false, erreur: "Il manque le titre." };
  if (!x.trim()) return { ok: false, erreur: "Le poème est vide." };

  const supabase = await clientServeur();
  if (!supabase) {
    return { ok: false, erreur: "Le site n’est pas relié à sa base." };
  }

  // On revérifie ici : le middleware garde la porte, mais une action
  // serveur s'appelle aussi directement.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: "Il faut être connecté pour publier." };

  const date = new Date().toISOString().slice(0, 10);
  const racine = enSlug(t, date);

  // Même titre le même jour : on numérote plutôt que d'écraser.
  let slug = racine;
  for (let n = 2; n < 50; n += 1) {
    const { error } = await supabase
      .from("poemes")
      .insert({ slug, titre: t, texte: x, date, auteur: user.id });

    if (!error) {
      // Une seule étiquette : toutes les pages qui listent des poèmes
      // repartent de la base au prochain affichage.
      updateTag(ETIQUETTE_POEMES);
      return { ok: true, slug };
    }
    if (error.code !== "23505") {
      // 23505 = doublon de clé ; tout le reste est un vrai problème.
      console.error("Publication impossible :", error.message);
      return { ok: false, erreur: "Le poème n’a pas pu être enregistré." };
    }
    slug = `${racine}-${n}`;
  }

  return { ok: false, erreur: "Trop de poèmes du même nom aujourd’hui." };
}

/** Corriger un poème déjà publié. L'adresse ne change pas : les liens
 *  déjà partagés continuent de fonctionner. */
export async function corriger(
  slug: string,
  titre: string,
  texte: string,
): Promise<Resultat> {
  const t = titre.trim();
  const x = texte.replace(/\r\n/g, "\n").trimEnd();

  if (!t) return { ok: false, erreur: "Il manque le titre." };
  if (!x.trim()) return { ok: false, erreur: "Le poème est vide." };

  const supabase = await clientServeur();
  if (!supabase) return { ok: false, erreur: "Le site n’est pas relié à sa base." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: "Il faut être connecté." };

  // La règle d'accès de la base vérifie aussi que le poème est bien le sien.
  const { error } = await supabase
    .from("poemes")
    .update({ titre: t, texte: x })
    .eq("slug", slug);

  if (error) {
    console.error("Correction impossible :", error.message);
    return { ok: false, erreur: "La correction n’a pas pu être enregistrée." };
  }

  updateTag(ETIQUETTE_POEMES);
  return { ok: true, slug };
}

export async function supprimer(slug: string): Promise<Resultat> {
  const supabase = await clientServeur();
  if (!supabase) return { ok: false, erreur: "Le site n’est pas relié à sa base." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: "Il faut être connecté." };

  const { error } = await supabase.from("poemes").delete().eq("slug", slug);
  if (error) {
    console.error("Suppression impossible :", error.message);
    return { ok: false, erreur: "Le poème n’a pas pu être supprimé." };
  }

  updateTag(ETIQUETTE_POEMES);
  return { ok: true, slug };
}
