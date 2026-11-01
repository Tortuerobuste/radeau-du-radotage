import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CLE, SUPABASE_URL, supabaseConfigure } from "./config";

/**
 * Client de lecture, sans cookies.
 *
 * Les poèmes publiés sont publics : les lire n'a pas besoin de savoir qui
 * regarde. Du coup le résultat se met en cache, et les pages restent
 * statiques au lieu d'être recalculées à chaque visiteur.
 */
export const clientPublic = supabaseConfigure
  ? createClient(SUPABASE_URL, SUPABASE_CLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

/** L'étiquette du cache, vidée dès qu'il publie. */
export const ETIQUETTE_POEMES = "poemes";
