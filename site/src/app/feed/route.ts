import { poemesRecents } from "@/lib/poemes";
import { SITE_DESCRIPTION, SITE_NOM, SITE_URL } from "@/lib/site";

/**
 * Flux RSS, à la même adresse que sur unblog (/feed).
 *
 * Ses lecteurs le suivaient par là depuis des années — plusieurs tenaient
 * eux-mêmes un blog. Leur rendre un flux, c'est leur rendre l'habitude.
 */

export const revalidate = 3600;

function echappe(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET() {
  const poemes = await poemesRecents(30);

  const articles = poemes
    .map((p) => {
      const lien = `${SITE_URL}/poeme/${p.slug}`;
      // Midi, pour que le fuseau ne fasse pas reculer la date d'un jour.
      const date = new Date(`${p.date}T12:00:00Z`).toUTCString();
      const corps = p.texte
        .split(/\n{2,}/)
        .filter((s) => s.trim())
        .map((s) => `<p>${echappe(s).replace(/\n/g, "<br />")}</p>`)
        .join("\n");

      return `    <item>
      <title>${echappe(p.titre)}</title>
      <link>${lien}</link>
      <guid isPermaLink="true">${lien}</guid>
      <pubDate>${date}</pubDate>
      <description><![CDATA[${corps}]]></description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${echappe(SITE_NOM)}</title>
    <link>${SITE_URL}</link>
    <description>${echappe(SITE_DESCRIPTION)}</description>
    <language>fr</language>
    <atom:link href="${SITE_URL}/feed" rel="self" type="application/rss+xml" />
${articles}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
