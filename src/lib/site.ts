export const siteConfig = {
  name: "SEO Evaluate",
  shortName: "SEO Evaluate",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://seo-evaluate.vercel.app",
  title: "SEO Evaluate | Auditoría SEO gratuita por URL",
  description:
    "Analizá una página web desde su URL y obtené un score SEO, prioridades y recomendaciones accionables en segundos.",
  locale: "es_AR",
  keywords: [
    "SEO",
    "auditoría SEO",
    "analizador SEO",
    "SEO técnico",
    "score SEO",
    "meta description",
    "title SEO",
    "auditor web",
    "Next.js",
    "herramientas SEO",
  ],
  creator: "IAZARA",
  repository: "https://github.com/IAZARA/SEO-Evaluate",
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
