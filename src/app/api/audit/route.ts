import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type {
  AuditCheck,
  AuditImpact,
  AuditMetrics,
  AuditPriority,
  AuditRating,
  AuditRecommendation,
  AuditStatus,
} from "@/lib/audit-types";

export const runtime = "nodejs";

const REQUEST_TIMEOUT_MS = 12_000;

type WeightedCheck = AuditCheck & {
  action: string;
  impact: AuditImpact;
  weight: number;
};

type AuditRequest = {
  url?: unknown;
};

export async function POST(request: Request) {
  let payload: AuditRequest;

  try {
    payload = (await request.json()) as AuditRequest;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
  }

  if (typeof payload.url !== "string" || payload.url.trim().length === 0) {
    return NextResponse.json({ error: "Ingresá una URL para analizar." }, { status: 400 });
  }

  let targetUrl: URL;

  try {
    targetUrl = normalizeUrl(payload.url);
  } catch {
    return NextResponse.json({ error: "La URL ingresada no es válida." }, { status: 400 });
  }

  if (isBlockedHost(targetUrl.hostname)) {
    return NextResponse.json(
      { error: "Por seguridad, no se pueden analizar URLs locales o privadas." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "SEO Platform Auditor/0.1 (+https://seo-platform.local)",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `El sitio respondió con estado HTTP ${response.status}.` },
        { status: 502 },
      );
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType && !contentType.toLowerCase().includes("text/html")) {
      return NextResponse.json(
        { error: "La URL respondió correctamente, pero no devolvió una página HTML." },
        { status: 415 },
      );
    }

    const html = await response.text();

    if (!looksLikeHtml(html)) {
      return NextResponse.json(
        { error: "No se pudo detectar contenido HTML analizable en esa URL." },
        { status: 415 },
      );
    }

    return NextResponse.json(auditHtml(targetUrl, html));
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === "AbortError"
        ? "El análisis tardó demasiado. Probá nuevamente más tarde."
        : "No se pudo acceder a esa URL desde el servidor.";

    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Unsupported protocol");
  }

  parsed.hash = "";
  return parsed;
}

function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase();

  if (host === "localhost" || host.endsWith(".localhost")) {
    return true;
  }

  if (host === "::1" || host === "[::1]" || host.startsWith("fc") || host.startsWith("fd")) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);

  if (!ipv4) {
    return false;
  }

  const [a, b] = ipv4.slice(1).map(Number);
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

function looksLikeHtml(html: string) {
  const sample = html.slice(0, 500).toLowerCase();
  return sample.includes("<html") || sample.includes("<!doctype html") || sample.includes("<head");
}

function auditHtml(targetUrl: URL, html: string) {
  const $ = cheerio.load(html);
  const pageTitle = $("title").first().text().replace(/\s+/g, " ").trim();
  const metaDescription = getMetaContent($, "description");
  const h1Count = $("h1").length;
  const h2Count = $("h2").length;
  const h3Count = $("h3").length;
  const imageCount = $("img").length;
  const imagesMissingAlt = $("img").filter((_, element) => !($(element).attr("alt") ?? "").trim()).length;
  const canonicalUrl = getCanonical($);
  const viewport = getMetaContent($, "viewport");
  const robotsMeta = getMetaContent($, "robots") || getMetaContent($, "googlebot");
  const hasNoIndex = /\bnoindex\b/i.test(robotsMeta);
  const hasOpenGraph = $("meta").filter((_, element) => {
    const property = ($(element).attr("property") ?? "").toLowerCase();
    return property.startsWith("og:");
  }).length > 0;
  const links = countLinks($, targetUrl);

  const metrics: AuditMetrics = {
    title: pageTitle,
    titleLength: pageTitle.length,
    metaDescription,
    metaDescriptionLength: metaDescription.length,
    h1Count,
    h2Count,
    h3Count,
    imageCount,
    imagesMissingAlt,
    internalLinks: links.internalLinks,
    externalLinks: links.externalLinks,
    hasCanonical: Boolean(canonicalUrl),
    hasViewport: Boolean(viewport),
    hasRobotsMeta: Boolean(robotsMeta),
    hasOpenGraph,
    usesHttps: targetUrl.protocol === "https:",
  };

  const weightedChecks = buildChecks(metrics, hasNoIndex);
  const score = calculateScore(weightedChecks);

  return {
    url: targetUrl.toString(),
    normalizedUrl: targetUrl.toString(),
    host: targetUrl.hostname,
    auditedAt: new Date().toISOString(),
    score,
    rating: getRating(score),
    checks: weightedChecks.map(toPublicCheck),
    priorities: getPriorities(weightedChecks),
    recommendations: getRecommendations(weightedChecks),
    metrics,
  };
}

function toPublicCheck(check: WeightedCheck): AuditCheck {
  return {
    id: check.id,
    title: check.title,
    description: check.description,
    details: check.details,
    explanation: check.explanation,
    whyItMatters: check.whyItMatters,
    howToFix: check.howToFix,
    example: check.example,
    status: check.status,
    score: check.score,
  };
}

function getMetaContent($: cheerio.CheerioAPI, name: string) {
  let content = "";

  $("meta").each((_, element) => {
    const metaName = ($(element).attr("name") ?? "").toLowerCase();

    if (metaName === name.toLowerCase()) {
      content = ($(element).attr("content") ?? "").replace(/\s+/g, " ").trim();
      return false;
    }
  });

  return content;
}

function getCanonical($: cheerio.CheerioAPI) {
  let href = "";

  $("link").each((_, element) => {
    const rel = ($(element).attr("rel") ?? "").toLowerCase();

    if (rel.split(/\s+/).includes("canonical")) {
      href = ($(element).attr("href") ?? "").trim();
      return false;
    }
  });

  return href;
}

function countLinks($: cheerio.CheerioAPI, targetUrl: URL) {
  let internalLinks = 0;
  let externalLinks = 0;

  $("a[href]").each((_, element) => {
    const href = ($(element).attr("href") ?? "").trim();

    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }

    try {
      const linkUrl = new URL(href, targetUrl);

      if (!["http:", "https:"].includes(linkUrl.protocol)) {
        return;
      }

      if (linkUrl.hostname === targetUrl.hostname) {
        internalLinks += 1;
      } else {
        externalLinks += 1;
      }
    } catch {
      return;
    }
  });

  return { internalLinks, externalLinks };
}

function buildChecks(metrics: AuditMetrics, hasNoIndex: boolean): WeightedCheck[] {
  return [
    makeCheck({
      id: "https",
      title: "HTTPS",
      description: "La página debe cargarse con una conexión segura.",
      status: metrics.usesHttps ? "pass" : "fail",
      details: metrics.usesHttps ? "La URL usa HTTPS." : "La URL usa HTTP y pierde señales de confianza.",
      explanation:
        "HTTPS es la versión segura de una URL. Protege la conexión entre la persona que visita tu sitio y tu servidor.",
      whyItMatters:
        "Google y los usuarios confían más en sitios seguros. Si una página carga con HTTP, el navegador puede mostrar advertencias y bajar la confianza.",
      howToFix: "Activá un certificado SSL y redireccioná todo el tráfico HTTP hacia HTTPS.",
      example: "Usar https://tusitio.com en lugar de http://tusitio.com.",
      action: "Activá HTTPS y redireccioná todo el tráfico HTTP a HTTPS.",
      impact: "Alto",
      weight: 8,
    }),
    makeCheck({
      id: "title",
      title: "Título SEO",
      description: "El title ayuda a buscadores y usuarios a entender la página.",
      status: scoreLength(metrics.titleLength, 30, 60, metrics.titleLength > 0),
      details:
        metrics.titleLength === 0
          ? "No se encontró una etiqueta title."
          : `Tiene ${metrics.titleLength} caracteres. Recomendado: 30 a 60.`,
      explanation:
        "El título SEO es el nombre que Google suele mostrar como título del resultado. No siempre es igual al título visible dentro de la página.",
      whyItMatters:
        "Es una de las primeras cosas que una persona ve antes de entrar. Un buen título mejora la claridad, el clic y la relevancia para buscadores.",
      howToFix: "Escribí un título único, específico y cercano a 50-60 caracteres.",
      example: "Auditoría SEO gratis para páginas web | SEO Evaluate",
      action: "Escribí un título único, específico y cercano a 50-60 caracteres.",
      impact: "Alto",
      weight: 12,
    }),
    makeCheck({
      id: "meta-description",
      title: "Meta descripción",
      description: "Resume el contenido y puede mejorar el CTR en resultados de búsqueda.",
      status: scoreLength(metrics.metaDescriptionLength, 110, 160, metrics.metaDescriptionLength > 0),
      details:
        metrics.metaDescriptionLength === 0
          ? "No se encontró meta description."
          : `Tiene ${metrics.metaDescriptionLength} caracteres. Recomendado: 110 a 160.`,
      explanation:
        "La meta descripción es un resumen breve de la página. Puede aparecer debajo del título en Google y ayuda a explicar por qué entrar.",
      whyItMatters:
        "No garantiza mejor posición por sí sola, pero puede mejorar el porcentaje de clics si comunica bien el beneficio de la página.",
      howToFix: "Agregá una descripción clara con beneficio principal y palabra clave objetivo.",
      example: "Analizá una URL y recibí un score SEO con prioridades y recomendaciones accionables.",
      action: "Agregá una descripción clara con beneficio principal y palabra clave objetivo.",
      impact: "Alto",
      weight: 12,
    }),
    makeCheck({
      id: "h1",
      title: "Encabezado H1",
      description: "Debe existir un H1 principal que represente el tema de la página.",
      status: metrics.h1Count === 1 ? "pass" : metrics.h1Count > 1 ? "warning" : "fail",
      details:
        metrics.h1Count === 1
          ? "Se encontró un único H1."
          : metrics.h1Count > 1
            ? `Se encontraron ${metrics.h1Count} H1. Conviene dejar uno principal.`
            : "No se encontró ningún H1.",
      explanation:
        "El H1 es el título principal visible de una página. Funciona como el tema central del contenido para usuarios y buscadores.",
      whyItMatters:
        "Si no hay H1, o hay demasiados, la página puede perder claridad sobre cuál es su tema principal.",
      howToFix: "Definí un único H1 descriptivo y usá H2/H3 para organizar secciones.",
      example: "H1: Analizá el SEO de cualquier página web",
      action: "Definí un único H1 descriptivo y usá H2/H3 para organizar secciones.",
      impact: "Alto",
      weight: 10,
    }),
    makeCheck({
      id: "headings",
      title: "Estructura de headings",
      description: "Los H2 y H3 ordenan el contenido y facilitan el rastreo.",
      status: metrics.h2Count > 0 ? "pass" : metrics.h3Count > 0 ? "warning" : "fail",
      details: `H2 detectados: ${metrics.h2Count}. H3 detectados: ${metrics.h3Count}.`,
      explanation:
        "Los headings son subtítulos que ordenan el contenido. H2 suele marcar secciones importantes y H3 divide subsecciones.",
      whyItMatters:
        "Una estructura clara hace que la página sea más fácil de leer y ayuda a Google a entender la jerarquía del contenido.",
      howToFix: "Agregá H2 para las secciones principales y H3 para subsecciones.",
      example: "H2: Funcionalidades principales. H3: Exportar reporte.",
      action: "Agregá H2 para las secciones principales y H3 para subsecciones.",
      impact: "Medio",
      weight: 8,
    }),
    makeCheck({
      id: "image-alt",
      title: "Imágenes con ALT",
      description: "El texto alternativo mejora accesibilidad y contexto semántico.",
      status: getImageAltStatus(metrics.imageCount, metrics.imagesMissingAlt),
      details:
        metrics.imageCount === 0
          ? "No se detectaron imágenes para auditar."
          : `${metrics.imagesMissingAlt} de ${metrics.imageCount} imágenes no tienen ALT.`,
      explanation:
        "El texto ALT describe una imagen para personas que usan lectores de pantalla y para casos donde la imagen no carga.",
      whyItMatters:
        "Mejora accesibilidad y le da contexto a buscadores sobre imágenes importantes del contenido.",
      howToFix: "Agregá ALT descriptivos a imágenes informativas y ALT vacío a decorativas.",
      example: 'alt="Panel con score SEO y recomendaciones"',
      action: "Agregá ALT descriptivos a imágenes informativas y ALT vacío a decorativas.",
      impact: "Medio",
      weight: 10,
    }),
    makeCheck({
      id: "canonical",
      title: "Canonical",
      description: "Ayuda a evitar duplicidad y concentra señales SEO.",
      status: metrics.hasCanonical ? "pass" : "warning",
      details: metrics.hasCanonical ? "Se detectó URL canonical." : "No se detectó link canonical.",
      explanation:
        "La canonical le indica a Google cuál es la versión principal de una página cuando puede existir contenido parecido o duplicado.",
      whyItMatters:
        "Evita que varias URLs compitan entre sí y ayuda a concentrar señales SEO en una sola versión.",
      howToFix: "Agregá una etiqueta canonical apuntando a la versión principal de la página.",
      example: '<link rel="canonical" href="https://tusitio.com/pagina-principal" />',
      action: "Agregá una etiqueta canonical apuntando a la versión principal de la página.",
      impact: "Medio",
      weight: 8,
    }),
    makeCheck({
      id: "indexability",
      title: "Indexabilidad",
      description: "La página no debe bloquearse accidentalmente para buscadores.",
      status: hasNoIndex ? "fail" : "pass",
      details: hasNoIndex
        ? "La meta robots contiene noindex."
        : metrics.hasRobotsMeta
          ? "Se detectó meta robots sin noindex."
          : "No hay noindex; la página debería ser indexable por defecto.",
      explanation:
        "La indexabilidad indica si una página puede aparecer en Google. Una etiqueta noindex le pide a Google que no la muestre.",
      whyItMatters:
        "Si una página importante está marcada como noindex, puede quedar fuera de resultados aunque el contenido sea bueno.",
      howToFix: "Quitá noindex si esta página debe aparecer en Google.",
      example: 'Evitar <meta name="robots" content="noindex"> en páginas públicas importantes.',
      action: "Quitá noindex si esta página debe aparecer en Google.",
      impact: "Alto",
      weight: 10,
    }),
    makeCheck({
      id: "viewport",
      title: "Mobile friendly",
      description: "La etiqueta viewport permite una correcta adaptación móvil.",
      status: metrics.hasViewport ? "pass" : "fail",
      details: metrics.hasViewport ? "Se detectó meta viewport." : "No se detectó meta viewport.",
      explanation: "La etiqueta viewport le dice al navegador cómo adaptar el sitio a pantallas móviles.",
      whyItMatters:
        "Sin viewport, una página puede verse demasiado chica o rota en celulares, afectando experiencia y SEO mobile.",
      howToFix: "Agregá meta viewport para mejorar experiencia mobile.",
      example: '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      action: "Agregá meta viewport para mejorar experiencia mobile.",
      impact: "Alto",
      weight: 8,
    }),
    makeCheck({
      id: "open-graph",
      title: "Open Graph",
      description: "Define cómo se comparte la página en redes y mensajería.",
      status: metrics.hasOpenGraph ? "pass" : "warning",
      details: metrics.hasOpenGraph ? "Se detectaron etiquetas Open Graph." : "No se detectaron etiquetas Open Graph.",
      explanation:
        "Open Graph define cómo se ve tu página cuando alguien la comparte en redes sociales, WhatsApp, Slack o similares.",
      whyItMatters: "Una buena vista previa puede aumentar clics y confianza cuando el enlace se comparte.",
      howToFix: "Agregá og:title, og:description e imagen social.",
      example: "og:title, og:description y og:image con una imagen atractiva de la página.",
      action: "Agregá og:title, og:description e imagen social.",
      impact: "Bajo",
      weight: 6,
    }),
    makeCheck({
      id: "links",
      title: "Enlaces",
      description: "Los enlaces internos ayudan a distribuir autoridad y contexto.",
      status: metrics.internalLinks > 0 ? "pass" : metrics.externalLinks > 0 ? "warning" : "fail",
      details: `${metrics.internalLinks} internos y ${metrics.externalLinks} externos detectados.`,
      explanation:
        "Los enlaces conectan esta página con otras. Los internos apuntan a tu propio sitio; los externos apuntan a otros dominios.",
      whyItMatters:
        "Los enlaces internos ayudan a las personas a seguir navegando y a Google a descubrir páginas relacionadas.",
      howToFix: "Agregá enlaces internos relevantes hacia páginas relacionadas.",
      example: "Desde una nota de blog, enlazar a una página de servicio o a otro artículo relacionado.",
      action: "Agregá enlaces internos relevantes hacia páginas relacionadas.",
      impact: "Medio",
      weight: 8,
    }),
  ];
}

function makeCheck(check: Omit<WeightedCheck, "score">): WeightedCheck {
  return {
    ...check,
    score: check.status === "pass" ? 100 : check.status === "warning" ? 50 : 0,
  };
}

function scoreLength(length: number, min: number, max: number, exists: boolean): AuditStatus {
  if (!exists) {
    return "fail";
  }

  if (length >= min && length <= max) {
    return "pass";
  }

  return "warning";
}

function getImageAltStatus(imageCount: number, missingAlt: number): AuditStatus {
  if (imageCount === 0 || missingAlt === 0) {
    return "pass";
  }

  return missingAlt / imageCount >= 0.35 ? "fail" : "warning";
}

function calculateScore(checks: WeightedCheck[]) {
  const totalWeight = checks.reduce((total, check) => total + check.weight, 0);
  const earned = checks.reduce((total, check) => total + (check.score / 100) * check.weight, 0);
  return Math.round((earned / totalWeight) * 100);
}

function getRating(score: number): AuditRating {
  if (score >= 85) {
    return "Excelente";
  }

  if (score >= 70) {
    return "Bueno";
  }

  if (score >= 50) {
    return "Mejorable";
  }

  return "Crítico";
}

function getPriorities(checks: WeightedCheck[]): AuditPriority[] {
  const issueChecks = checks
    .filter((check) => check.status !== "pass")
    .sort((a, b) => {
      const severityDiff = getSeverityRank(b.status) - getSeverityRank(a.status);
      return severityDiff || b.weight - a.weight;
    });

  if (issueChecks.length === 0) {
    return [
      {
        title: "Mantener monitoreo",
        description: "No hay problemas críticos en los checks iniciales.",
        impact: "Bajo",
      },
    ];
  }

  return issueChecks.slice(0, 3).map((check) => ({
    title: check.title,
    description: check.action,
    impact: check.impact,
  }));
}

function getRecommendations(checks: WeightedCheck[]): AuditRecommendation[] {
  const issueChecks = checks.filter((check) => check.status !== "pass");

  if (issueChecks.length === 0) {
    return [
      {
        title: "Revisar contenido periódicamente",
        action: "Volvé a auditar esta página después de cambios de contenido o diseño.",
      },
    ];
  }

  return issueChecks.slice(0, 5).map((check) => ({
    title: check.title,
    action: check.action,
  }));
}

function getSeverityRank(status: AuditStatus) {
  if (status === "fail") {
    return 2;
  }

  if (status === "warning") {
    return 1;
  }

  return 0;
}
