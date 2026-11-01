import type { MetadataRoute } from "next";
import { annees, poemesRecents, statistiques, tousLesPoemes } from "@/lib/poemes";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;

/**
 * Plan du site.
 *
 * Ses poèmes étaient indexés : on les retrouvait en cherchant un vers sur
 * Google. Sans ça, quinze ans d'écriture deviendraient introuvables.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await statistiques();
  const liste = await annees();
  const recents = new Set((await poemesRecents(30)).map((p) => p.slug));

  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: s.dernier, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/archives`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/recherche`, changeFrequency: "monthly", priority: 0.4 },
  ];

  for (const a of liste) {
    pages.push({
      url: `${SITE_URL}/archives/${a.annee}`,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  for (const p of await tousLesPoemes()) {
    pages.push({
      url: `${SITE_URL}/poeme/${p.slug}`,
      lastModified: p.date,
      changeFrequency: "yearly",
      priority: recents.has(p.slug) ? 0.7 : 0.5,
    });
  }

  return pages;
}
