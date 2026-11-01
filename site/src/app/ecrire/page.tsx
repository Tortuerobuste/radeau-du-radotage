import type { Metadata } from "next";
import { EditeurSansServeur } from "@/components/EditeurSansServeur";

export const metadata: Metadata = {
  title: "Écrire",
  robots: { index: false },
};

// Son espace dépend de qui est connecté : jamais de version mise en cache.
export const dynamic = "force-dynamic";

// Une page, une tâche : ici on écrit. Pour relire, corriger ou supprimer,
// c'est « Mes poèmes » dans la barre du haut.
export default function PageEcrire() {
  return <EditeurSansServeur />;
}
