import "server-only";
import { clientServeur } from "./supabase/serveur";

export type SienBref = { slug: string; titre: string; date: string };
export type Sien = SienBref & { texte: string };

/**
 * Ce qu'il a écrit depuis la reprise, vu depuis son espace à lui.
 *
 * Volontairement hors du cache public : ici on veut toujours l'état réel
 * de la base, pas une version d'il y a une heure.
 */
export async function sesDerniersPoemes(limite = 10): Promise<SienBref[]> {
  const supabase = await clientServeur();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("poemes")
    .select("slug, titre, date")
    .order("date", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("Lecture de ses poèmes impossible :", error.message);
    return [];
  }
  return data as SienBref[];
}

export async function sonPoeme(slug: string): Promise<Sien | null> {
  const supabase = await clientServeur();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("poemes")
    .select("slug, titre, date, texte")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Lecture du poème impossible :", error.message);
    return null;
  }
  return (data as Sien) ?? null;
}
