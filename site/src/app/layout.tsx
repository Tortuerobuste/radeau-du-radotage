import type { Metadata } from "next";
import { Spectral, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { BasculeTheme } from "@/components/BasculeTheme";
import { SITE_DESCRIPTION, SITE_NOM, SITE_URL } from "@/lib/site";

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NOM, template: `%s — ${SITE_NOM}` },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": [{ url: "/feed", title: SITE_NOM }] },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NOM,
    title: SITE_NOM,
    description: SITE_DESCRIPTION,
  },
};

const liens = [
  { href: "/", libelle: "Accueil" },
  { href: "/archives", libelle: "Archives" },
  { href: "/recherche", libelle: "Recherche" },
];

// L'en-tête ne consulte pas la session : cela rendrait tout le site
// dynamique, et ferait payer à chaque visiteur un aller-retour réseau
// pour une information qui ne concerne qu'une personne. Lui passe par
// le lien discret du pied de page, ou par son marque-page.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Applique le thème choisi avant le premier rendu, pour éviter
            l'éclair blanc sur un écran sombre. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className={`${spectral.variable} ${inter.variable}`}>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-paper"
        >
          Aller au contenu
        </a>

        <header className="sans-impression border-b border-trait">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
            <Link
              href="/"
              className="font-serif text-lg text-encre no-underline hover:text-accent"
            >
              le radeau du radotage
            </Link>
            <nav className="ml-auto flex items-center gap-1 font-sans text-sm">
              {liens.slice(1).map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-full px-3 py-1.5 text-encre-douce no-underline transition-colors hover:bg-accent-doux hover:text-accent"
                >
                  {l.libelle}
                </Link>
              ))}
              <BasculeTheme />
            </nav>
          </div>
        </header>

        <main id="contenu">{children}</main>

        <footer className="sans-impression mt-24 border-t border-trait">
          <div className="mx-auto max-w-3xl px-5 py-10 font-sans text-sm text-encre-douce">
            <p className="m-0">
              Archive du blog tenu sur unblog.fr de 2011 à 2026, et sa suite.{" "}
              <a
                href="/feed"
                className="text-encre-douce underline decoration-trait underline-offset-4 hover:text-accent"
              >
                Flux RSS
              </a>{" "}
              ·{" "}
              <Link
                href="/connexion"
                className="text-encre-douce underline decoration-trait underline-offset-4 hover:text-accent"
              >
                Connexion
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
