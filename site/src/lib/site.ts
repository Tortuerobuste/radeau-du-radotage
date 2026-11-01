/** L'adresse publique du site, pour les liens absolus (flux, sitemap). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NOM = "le radeau du radotage";
export const SITE_DESCRIPTION =
  "Des poèmes, écrits presque chaque jour depuis 2011. Un journal en vers.";
