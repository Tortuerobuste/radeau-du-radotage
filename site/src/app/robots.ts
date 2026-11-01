import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Rien d'utile pour un moteur, et autant ne pas l'exposer.
      disallow: ["/ecrire", "/connexion"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
