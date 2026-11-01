import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_CLE, SUPABASE_URL, supabaseConfigure } from "./config";

/**
 * Client Supabase côté navigateur.
 *
 * Sert uniquement à savoir s'il est connecté, pour afficher les bons
 * boutons. Ce que protège vraiment le site, ce sont les règles de la base
 * et le contrôle fait dans proxy.ts — pas ce que montre la barre du haut.
 */
export const clientNavigateur = supabaseConfigure
  ? createBrowserClient(SUPABASE_URL, SUPABASE_CLE)
  : null;
