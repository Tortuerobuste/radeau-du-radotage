import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_CLE, SUPABASE_URL, supabaseConfigure } from "./config";

/** Client Supabase côté serveur, lié aux cookies de la requête. */
export async function clientServeur() {
  if (!supabaseConfigure) return null;
  const jar = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_CLE, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(cookiesAEcrire) {
        try {
          for (const { name, value, options } of cookiesAEcrire) {
            jar.set(name, value, options);
          }
        } catch {
          // Appelé depuis un composant serveur : c'est le middleware qui
          // rafraîchit la session, on peut ignorer sans risque.
        }
      },
    },
  });
}

/** L'utilisateur connecté, ou null. Vérifié auprès de Supabase, pas lu
 *  dans un cookie : un cookie se fabrique. */
export async function utilisateurConnecte() {
  const supabase = await clientServeur();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
