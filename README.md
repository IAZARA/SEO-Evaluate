# SEO Evaluate

![Banner de SEO Evaluate](./docs/banner.svg)

**SEO Evaluate** es una plataforma minimalista para auditar una URL pública y obtener un diagnóstico SEO claro, rápido y accionable. El objetivo del MVP es resolver el flujo principal: pegar una URL, analizar el HTML público y entender qué mejorar primero.

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
