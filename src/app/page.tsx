"use client";

import NextImage from "next/image";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Download,
  FileText,
  Gauge,
  Globe2,
  Heading1,
  Image as ImageIcon,
  Info,
  Link2,
  Loader2,
  Moon,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Sun,
  X,
  XCircle,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { AuditCheck, AuditErrorResponse, AuditResult, AuditStatus } from "@/lib/audit-types";
import { absoluteUrl, siteConfig } from "@/lib/site";

type ThemeMode = "light" | "dark" | "system";

const checkIcons: Record<string, LucideIcon> = {
  https: ShieldCheck,
  title: FileText,
  "meta-description": FileText,
  h1: Heading1,
  headings: Heading1,
  "image-alt": ImageIcon,
  canonical: Link2,
  indexability: Bot,
  viewport: Smartphone,
  "open-graph": Globe2,
  links: Link2,
};

const sampleChecks = [
  "Título y meta descripción",
  "Headings e indexabilidad",
  "Imágenes, enlaces y mobile",
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: absoluteUrl("/"),
  image: absoluteUrl("/og-image.png"),
  sameAs: [siteConfig.repository],
  description: siteConfig.description,
  creator: {
    "@type": "Organization",
    name: siteConfig.creator,
    url: siteConfig.repository,
    logo: absoluteUrl(siteConfig.logo),
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Auditoría SEO por URL",
    "Score SEO de 0 a 100",
    "Revisión de title y meta description",
    "Detección de H1, headings e imágenes sin ALT",
    "Recomendaciones accionables",
  ],
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("system");
  const isDark = theme === "dark";

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("seo-platform-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = storedTheme === "dark" || (!storedTheme && prefersDark) ? "dark" : "light";

    applyTheme(nextTheme);
    queueMicrotask(() => setTheme(nextTheme));
  }, []);

  const canSubmit = useMemo(() => url.trim().length > 0 && !isLoading, [isLoading, url]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedInput = normalizeUrlInput(url);

    if (!normalizedInput) {
      setError("Ingresá una URL válida, por ejemplo https://example.com.");
      setResult(null);
      return;
    }

    setUrl(normalizedInput);
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: normalizedInput }),
      });
      const data = (await response.json()) as AuditResult | AuditErrorResponse;

      if (!response.ok) {
        setResult(null);
        setError("error" in data ? data.error : "No se pudo analizar la URL.");
        return;
      }

      setResult(data as AuditResult);
    } catch {
      setResult(null);
      setError("Ocurrió un error inesperado al conectar con el auditor.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setUrl("");
    setResult(null);
    setError("");
  }

  function handleExport() {
    if (!result) {
      return;
    }

    const report = buildMarkdownReport(result);
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `seo-report-${result.host}.md`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  }

  function handleThemeToggle() {
    const nextTheme = isDark ? "light" : "dark";
    applyTheme(nextTheme);
    window.localStorage.setItem("seo-platform-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border)] bg-[var(--card)]">
              <NextImage
                alt=""
                aria-hidden="true"
                className="h-8 w-8 object-contain"
                height={32}
                src={siteConfig.logo}
                width={32}
              />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">SEO Evaluate</p>
              <p className="hidden text-xs text-[var(--muted)] sm:block">Auditoría SEO accionable</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
            <a className="transition hover:text-[var(--foreground)]" href="#auditoria">
              Auditoría
            </a>
            <a className="transition hover:text-[var(--foreground)]" href="#checks">
              Checks
            </a>
            <a className="transition hover:text-[var(--foreground)]" href="#reporte">
              Reporte
            </a>
          </nav>

          <button
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            aria-pressed={isDark}
            className="relative grid h-10 w-[76px] grid-cols-2 items-center rounded-full border border-[var(--border)] bg-[var(--card)] p-1 text-[var(--muted)] transition hover:border-[var(--accent)]"
            type="button"
            onClick={handleThemeToggle}
          >
            <span
              className={`absolute inset-y-1 left-1 w-8 rounded-full bg-[var(--accent)] transition-transform duration-200 ${
                isDark ? "translate-x-8" : "translate-x-0"
              }`}
              aria-hidden="true"
            />
            <span
              className={`relative z-10 grid place-items-center transition-colors ${
                isDark ? "text-[var(--muted)]" : "text-white"
              }`}
              aria-hidden="true"
            >
              <Sun size={16} />
            </span>
            <span
              className={`relative z-10 grid place-items-center transition-colors ${
                isDark ? "text-white" : "text-[var(--muted)]"
              }`}
              aria-hidden="true"
            >
              <Moon size={16} />
            </span>
          </button>
        </div>
      </header>

      <section id="auditoria" className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-12">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-8">
          <div className="mb-8 max-w-2xl">
            <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
              SEO URL AUDIT
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Analizá una página y detectá oportunidades SEO en segundos.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
              Pegá una URL pública y recibí un score, prioridades y recomendaciones concretas para mejorar title,
              metadatos, estructura, indexabilidad y experiencia mobile.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium" htmlFor="url">
              URL de la página
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Globe2 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={19} />
                <input
                  id="url"
                  className="h-13 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-12 pr-4 text-base outline-none transition placeholder:text-[color-mix(in_srgb,var(--muted)_65%,transparent)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_18%,transparent)]"
                  placeholder="https://example.com"
                  spellCheck={false}
                  type="url"
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    if (error) {
                      setError("");
                    }
                  }}
                />
              </div>
              <button
                className="inline-flex h-13 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 font-medium text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canSubmit}
                type="submit"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                Analizar SEO
              </button>
            </div>
          </form>

          {error ? (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-[color-mix(in_srgb,var(--danger)_40%,var(--border))] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
              <AlertTriangle className="mt-0.5 shrink-0" size={18} />
              <p>{error}</p>
            </div>
          ) : null}

          {isLoading ? <LoadingState /> : null}
        </div>

        <aside className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          {result ? <ScorePanel result={result} onExport={handleExport} onReset={handleReset} /> : <EmptyPanel />}
        </aside>
      </section>

      <section id="checks" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {result ? <Results result={result} /> : <InitialChecks />}
      </section>
    </main>
  );
}

function EmptyPanel() {
  return (
    <div className="flex h-full min-h-[360px] flex-col justify-between">
      <div>
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Gauge size={22} />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Auditoría lista</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          El primer resultado va a mostrar un score general, checks por categoría y prioridades ordenadas por impacto.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {sampleChecks.map((check) => (
          <div key={check} className="flex items-center gap-3 border-t border-[var(--border)] pt-3 text-sm">
            <CheckCircle2 className="text-[var(--accent)]" size={17} />
            <span>{check}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card-subtle)] p-4">
      <div className="flex items-center gap-3">
        <Loader2 className="animate-spin text-[var(--accent)]" size={18} />
        <div>
          <p className="text-sm font-medium">Analizando página</p>
          <p className="text-xs text-[var(--muted)]">Descargando HTML y evaluando señales SEO básicas.</p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--ring-track)]">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-[var(--accent)]" />
      </div>
    </div>
  );
}

function ScorePanel({
  result,
  onExport,
  onReset,
}: {
  result: AuditResult;
  onExport: () => void;
  onReset: () => void;
}) {
  return (
    <div id="reporte" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Resultado</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{result.host}</h2>
        </div>
        <span className={ratingClass(result.rating)}>{result.rating}</span>
      </div>

      <div className="my-8 grid place-items-center">
        <div
          className="grid h-44 w-44 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--accent) ${result.score * 3.6}deg, var(--ring-track) 0deg)`,
          }}
        >
          <div className="grid h-34 w-34 place-items-center rounded-full bg-[var(--card)] text-center">
            <div>
              <p className="text-5xl font-bold tracking-tight">{result.score}</p>
              <p className="font-mono text-xs uppercase text-[var(--muted)]">/ 100</p>
            </div>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Metric label="H1" value={String(result.metrics.h1Count)} />
        <Metric label="H2" value={String(result.metrics.h2Count)} />
        <Metric label="Imágenes" value={String(result.metrics.imageCount)} />
        <Metric label="Sin ALT" value={String(result.metrics.imagesMissingAlt)} />
      </dl>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-medium transition hover:border-[var(--accent)]"
          type="button"
          onClick={onReset}
        >
          <RotateCcw size={16} />
          Analizar otra URL
        </button>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)]"
          type="button"
          onClick={onExport}
        >
          <Download size={16} />
          Exportar reporte
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card-subtle)] p-3">
      <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-xl font-semibold">{value}</dd>
    </div>
  );
}

function InitialChecks() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {sampleChecks.map((check) => (
        <div key={check} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <CheckCircle2 className="mb-4 text-[var(--accent)]" size={20} />
          <h3 className="font-semibold">{check}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Incluido en la primera auditoría real del MVP.</p>
        </div>
      ))}
    </div>
  );
}

function Results({ result }: { result: AuditResult }) {
  const [selectedCheck, setSelectedCheck] = useState<AuditCheck | null>(null);

  useEffect(() => {
    if (!selectedCheck) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedCheck(null);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCheck]);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <Panel title="Prioridades" subtitle="Las acciones más importantes para mejorar primero.">
            <div className="space-y-3">
              {result.priorities.map((priority) => (
                <div key={`${priority.title}-${priority.impact}`} className="rounded-lg border border-[var(--border)] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="font-medium">{priority.title}</h3>
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--accent)]">
                      {priority.impact}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-[var(--muted)]">{priority.description}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recomendaciones" subtitle="Checklist de acciones concretas para el próximo cambio.">
            <div className="space-y-3">
              {result.recommendations.map((recommendation) => (
                <div key={recommendation.title} className="flex gap-3 border-t border-[var(--border)] pt-3 first:border-t-0 first:pt-0">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--accent)]" size={17} />
                  <div>
                    <p className="text-sm font-medium">{recommendation.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{recommendation.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <Panel
          title="Checks SEO"
          subtitle="Tocá una tarjeta para entender qué significa, por qué importa y cómo corregirlo."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {result.checks.map((check) => (
              <CheckCard key={check.id} check={check} onExplain={setSelectedCheck} />
            ))}
          </div>
        </Panel>
      </div>

      {selectedCheck ? <CheckExplanationModal check={selectedCheck} onClose={() => setSelectedCheck(null)} /> : null}
    </>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function CheckCard({ check, onExplain }: { check: AuditCheck; onExplain: (check: AuditCheck) => void }) {
  const Icon = checkIcons[check.id] ?? FileText;

  return (
    <article className="h-full">
      <button
        aria-label={`Ver explicación de ${check.title}`}
        className="block h-full w-full rounded-xl border border-[var(--border)] bg-[var(--card-subtle)] p-4 text-left transition hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_5%,transparent)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--accent)_18%,transparent)]"
        type="button"
        onClick={() => onExplain(check)}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--card)] text-[var(--accent)]">
            <Icon size={18} />
          </div>
          <StatusBadge status={check.status} />
        </div>
        <h3 className="font-semibold">{check.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{check.description}</p>
        <p className="mt-3 border-t border-[var(--border)] pt-3 text-sm">{check.details}</p>
        <span className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
          <Info size={14} />
          Ver explicación simple
        </span>
      </button>
    </article>
  );
}

function CheckExplanationModal({ check, onClose }: { check: AuditCheck; onClose: () => void }) {
  const Icon = checkIcons[check.id] ?? FileText;
  const titleId = `check-${check.id}-modal-title`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4" role="presentation">
      <button
        aria-label="Cerrar explicación"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        type="button"
        onClick={onClose}
      />

      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl shadow-black/20 sm:max-w-2xl sm:rounded-2xl sm:p-6"
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Explicación SEO</p>
              <h3 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight">
                {check.title}
              </h3>
            </div>
          </div>
          <button
            aria-label="Cerrar modal"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--card-subtle)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3 border-y border-[var(--border)] py-3">
          <StatusBadge status={check.status} />
          <p className="text-sm text-[var(--muted)]">{check.details}</p>
        </div>

        <dl className="divide-y divide-[var(--border)] text-sm">
          <div className="grid gap-1 py-4 sm:grid-cols-[150px_1fr] sm:gap-6">
            <dt className="font-medium">Qué significa</dt>
            <dd className="leading-6 text-[var(--muted)]">{check.explanation}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[150px_1fr] sm:gap-6">
            <dt className="font-medium">Por qué importa</dt>
            <dd className="leading-6 text-[var(--muted)]">{check.whyItMatters}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[150px_1fr] sm:gap-6">
            <dt className="font-medium">Qué hacer</dt>
            <dd className="leading-6 text-[var(--muted)]">{check.howToFix}</dd>
          </div>
          <div className="grid gap-2 py-4 sm:grid-cols-[150px_1fr] sm:gap-6">
            <dt className="font-medium">Ejemplo</dt>
            <dd>
              <code className="block overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card-subtle)] px-3 py-2 text-xs leading-5 text-[var(--foreground)]">
                {check.example}
              </code>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: AuditStatus }) {
  const labels = {
    pass: "Correcto",
    warning: "Advertencia",
    fail: "Error",
  };
  const Icon = status === "pass" ? CheckCircle2 : status === "warning" ? AlertTriangle : XCircle;

  return (
    <span className={statusClass(status)}>
      <Icon size={13} />
      {labels[status]}
    </span>
  );
}

function normalizeUrlInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }

    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function applyTheme(theme: Exclude<ThemeMode, "system">) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function statusClass(status: AuditStatus) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em]";

  if (status === "pass") {
    return `${base} bg-[var(--success-soft)] text-[var(--success)]`;
  }

  if (status === "warning") {
    return `${base} bg-[var(--warning-soft)] text-[var(--warning)]`;
  }

  return `${base} bg-[var(--danger-soft)] text-[var(--danger)]`;
}

function ratingClass(rating: AuditResult["rating"]) {
  const base = "rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.08em]";

  if (rating === "Excelente" || rating === "Bueno") {
    return `${base} bg-[var(--success-soft)] text-[var(--success)]`;
  }

  if (rating === "Mejorable") {
    return `${base} bg-[var(--warning-soft)] text-[var(--warning)]`;
  }

  return `${base} bg-[var(--danger-soft)] text-[var(--danger)]`;
}

function buildMarkdownReport(result: AuditResult) {
  const priorities = result.priorities
    .map((priority) => `- [${priority.impact}] ${priority.title}: ${priority.description}`)
    .join("\n");
  const checks = result.checks
    .map(
      (check) =>
        `- ${check.title}: ${check.status.toUpperCase()} - ${check.details}. Qué significa: ${check.explanation} Qué hacer: ${check.howToFix}`,
    )
    .join("\n");

  return `# SEO Evaluate Report

URL: ${result.normalizedUrl}
Fecha: ${new Date(result.auditedAt).toLocaleString("es-AR")}
Score: ${result.score}/100 (${result.rating})

## Prioridades
${priorities}

## Checks
${checks}
`;
}
