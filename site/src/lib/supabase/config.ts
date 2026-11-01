/**
 * Les deux clés publiques de Supabase.
 *
 * Tant qu'elles ne sont pas renseignées, le site fonctionne quand même :
 * il sert l'archive en lecture seule. Personne ne tombe sur une page
 * d'erreur parce qu'un fichier .env manque.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_CLE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigure = Boolean(SUPABASE_URL && SUPABASE_CLE);
