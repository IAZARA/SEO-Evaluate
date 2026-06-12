export type AuditStatus = "pass" | "warning" | "fail";

export type AuditRating = "Excelente" | "Bueno" | "Mejorable" | "Crítico";

export type AuditImpact = "Alto" | "Medio" | "Bajo";

export type AuditCheck = {
  id: string;
  title: string;
  description: string;
  details: string;
  status: AuditStatus;
  score: number;
};

export type AuditPriority = {
  title: string;
  description: string;
  impact: AuditImpact;
};

export type AuditRecommendation = {
  title: string;
  action: string;
};

export type AuditMetrics = {
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescriptionLength: number;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  imageCount: number;
  imagesMissingAlt: number;
  internalLinks: number;
  externalLinks: number;
  hasCanonical: boolean;
  hasViewport: boolean;
  hasRobotsMeta: boolean;
  hasOpenGraph: boolean;
  usesHttps: boolean;
};

export type AuditResult = {
  url: string;
  normalizedUrl: string;
  host: string;
  auditedAt: string;
  score: number;
  rating: AuditRating;
  checks: AuditCheck[];
  priorities: AuditPriority[];
  recommendations: AuditRecommendation[];
  metrics: AuditMetrics;
};

export type AuditErrorResponse = {
  error: string;
};
