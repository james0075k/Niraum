# 0002 — Prerender public routes with vite-react-ssg

- Status: Accepted · 2026-10-08

## Context

SEO and LCP < 2.5 s on mobile need real HTML for public pages. The stack is fixed to React 18,
Vite and React Router v6 (no Next.js). Options: `vite-plugin-prerender` (headless-browser
snapshot) or `vite-react-ssg` (React SSR at build time).

## Decision

Use **vite-react-ssg 0.9** (React Router v6 data-router route objects, `getStaticPaths` for
dynamic routes, route `loader` data embedded as static JSON, beasties critical-CSS inlining).
`/admin/*` is excluded and stays client-rendered.

## Consequences

- No headless browser in CI; builds are faster and deterministic.
- Components must be SSR-safe: no `window`/`document` at module scope or during render
  (motion libraries initialise in effects).
- Head tags must use `Head` from `vite-react-ssg`, which bundles react-helmet-async **1.3**. The
  frontend pins `react-helmet-async@^1.3.0` so there is exactly one copy (a second copy would
  have its own context and drop prerendered tags).
- Content changes need a rebuild to update the HTML; live visitors still see fresh data via
  TanStack Query revalidation. The API triggers rebuilds through `REBUILD_HOOK_URL`.
