# SEO Evaluate

<img src="./docs/banner.png" alt="Banner de SEO Evaluate" width="100%" />

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-111827?style=for-the-badge&logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-19-0F172A?style=for-the-badge&logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-0052FF?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

**SEO Evaluate** es una plataforma minimalista para auditar una URL pública y obtener un diagnóstico SEO claro, rápido y accionable. El objetivo del MVP es resolver el flujo principal: **pegar una URL, analizar el HTML público y entender qué mejorar primero**.

## Descripción del proyecto

La aplicación funciona como una primera capa de auditoría SEO para dueños de negocio, marketers, agencias y equipos web. Recibe una URL, descarga el HTML público desde una API interna y transforma señales técnicas básicas en un score entendible, prioridades ordenadas por impacto y recomendaciones concretas.

No busca reemplazar herramientas avanzadas como Screaming Frog, Ahrefs o Semrush; busca ofrecer una experiencia inicial simple para detectar problemas evidentes y explicar próximos pasos sin fricción.

## Etiquetas

`seo` · `seo-audit` · `nextjs` · `typescript` · `tailwindcss` · `react` · `cheerio` · `url-auditor` · `web-audit` · `technical-seo`

## Funcionalidades

- Auditoría real desde `POST /api/audit`.
- Score SEO general de `0` a `100`.
- Estados: `Excelente`, `Bueno`, `Mejorable` y `Crítico`.
- Validación de URL, estado de carga y errores legibles.
- Modo claro/oscuro con persistencia local.
- Reporte con prioridades, recomendaciones y checks por categoría.
- Exportación del resultado en Markdown.

## Checks iniciales

El MVP evalúa señales SEO básicas:

- HTTPS.
- Title y longitud recomendada.
- Meta description y longitud recomendada.
- H1 único y estructura H2/H3.
- Imágenes sin atributo `alt`.
- Canonical.
- Meta robots e indexabilidad.
- Meta viewport para mobile.
- Open Graph básico.
- Enlaces internos y externos.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Cheerio para parseo HTML
- Lucide React para iconografía

## Ejecutar en local

```bash
npm install
npm run dev
```

Abrir:

```bash
http://localhost:3000
```

## Configuración SEO

Antes de desplegar, configurar la URL pública para canonical, sitemap, robots y Open Graph:

```bash
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

Si no se define, la app usa `https://seo-evaluate.vercel.app` como valor por defecto.

## Scripts

```bash
npm run dev      # servidor de desarrollo
npm run lint     # lint del proyecto
npm run build    # build de producción
npm run start    # ejecutar build de producción
```

## API

Endpoint:

```http
POST /api/audit
```

Body:

```json
{
  "url": "https://www.wikipedia.org"
}
```

Respuesta resumida:

```json
{
  "score": 76,
  "rating": "Bueno",
  "checks": [],
  "priorities": [],
  "recommendations": []
}
```

## Limitaciones del MVP

- Analiza solo HTML público accesible desde el servidor.
- No ejecuta Lighthouse ni mide Core Web Vitals reales.
- No integra Google Search Console, PageSpeed Insights, Ahrefs ni Semrush.
- No guarda historial ni requiere login.
- Bloquea URLs locales o privadas por seguridad.

## Roadmap sugerido

- Historial de auditorías.
- Reportes PDF.
- Análisis técnico avanzado.
- Integración con PageSpeed Insights.
- Proyectos por dominio.
- Login y persistencia en base de datos.

## Estado

Primera versión funcional del MVP.
