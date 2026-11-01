import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormulaireConnexion } from "@/components/FormulaireConnexion";
import { supabaseConfigure } from "@/lib/supabase/config";
import { utilisateurConnecte } from "@/lib/supabase/serveur";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ suite?: string }> };

export default async function PageConnexion({ searchParams }: Props) {
  const { suite = "/ecrire" } = await searchParams;

  if (await utilisateurConnecte()) redirect("/ecrire");

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <h1 className="m-0 text-3xl font-normal">Connexion</h1>
      <p className="mt-3 text-encre-douce">
        Cette page n’est que pour lui. Les visiteurs n’ont rien à y faire :
        le site se lit entièrement sans compte.
      </p>

      {supabaseConfigure ? (
        <FormulaireConnexion suite={suite} />
      ) : (
        <p className="mt-8 rounded-xl border border-trait bg-paper-haut px-5 py-4 font-sans text-sm text-encre-douce">
          Le site n’est pas encore relié à sa base de données. Voir la marche
          à suivre dans <code>INSTALLATION.md</code>.
        </p>
      )}
    </div>
  );
}
