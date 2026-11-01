import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditeurSansServeur } from "@/components/EditeurSansServeur";
import { sonPoeme } from "@/lib/sesPoemes";

export const metadata: Metadata = {
  title: "Corriger",
  robots: { index: false },
};

type Params = { params: Promise<{ slug: string }> };

export default async function PageCorriger({ params }: Params) {
  const { slug } = await params;
  const poeme = await sonPoeme(slug);

  // Les poèmes repris d'unblog ne sont pas dans la base : ils font partie
  // de l'archive, et ne se corrigent pas depuis le site.
  if (!poeme) notFound();

  return (
    <EditeurSansServeur
      poeme={{ slug: poeme.slug, titre: poeme.titre, texte: poeme.texte }}
    />
  );
}
