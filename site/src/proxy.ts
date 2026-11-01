import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SUPABASE_CLE,
  SUPABASE_URL,
  supabaseConfigure,
} from "@/lib/supabase/config";

/**
 * Rafraîchit la session à chaque requête, et garde la porte de /ecrire.
 *
 * Le contrôle est ici, avant le rendu : une page protégée seulement par un
 * `if` dans son composant laisse passer trop de choses.
 */
export async function proxy(request: NextRequest) {
  const protege =
    request.nextUrl.pathname.startsWith("/ecrire") ||
    request.nextUrl.pathname.startsWith("/mes-poemes");

  if (!supabaseConfigure) {
    // Pas de base configurée : on n'ouvre surtout pas l'espace d'écriture.
    if (protege) {
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let reponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_CLE, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesAEcrire) {
        for (const { name, value } of cookiesAEcrire) {
          request.cookies.set(name, value);
        }
        reponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesAEcrire) {
          reponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() et non getSession() : seul getUser() valide le jeton
  // auprès de Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (protege && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("suite", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return reponse;
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques et les images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
