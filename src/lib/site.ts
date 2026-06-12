export const siteConfig = {
  name: "SEO Evaluate",
  shortName: "SEO Evaluate",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://seo-evaluate.vercel.app",
  logo: "/seo-evaluate-logo.png",
  title: "SEO Evaluate | Visibilidad SEO e IA por URL",
  description:
    "Analizá si buscadores e IA pueden entender tu página con un score SEO, explicaciones simples y recomendaciones accionables.",
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
    "visibilidad en IA",
    "SEO para IA",
    "AI search",
    "answer engine optimization",
  ],
  creator: "IAZARA",
  repository: "https://github.com/IAZARA/SEO-Evaluate",
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
