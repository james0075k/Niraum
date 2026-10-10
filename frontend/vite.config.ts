/// <reference types="vitest/config" />
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { imagetools } from 'vite-imagetools';
import { SSG_GLOBAL, ssgScriptTag } from './src/lib/ssgData';

/**
 * `vite preview` serves dist/index.html for /about instead of dist/about/index.html,
 * which hydrates the wrong page. Mirror nginx's `try_files $uri $uri/index.html`.
 */
const previewNestedHtml = (): Plugin => ({
  name: 'preview-nested-html',
  configurePreviewServer(server) {
    const outDir = join(server.config.root, server.config.build.outDir);
    server.middlewares.use((req, _res, next) => {
      const [path = '/', query] = (req.url ?? '/').split('?');
      if (path !== '/' && !/\.[a-z0-9]+$/i.test(path)) {
        const file = join(outDir, path, 'index.html');
        const notFound = join(outDir, '404', 'index.html');
        const target = existsSync(file) ? file : existsSync(notFound) ? notFound : null;
        if (target) {
          const rel = target.slice(outDir.length).replace(/\\/g, '/');
          req.url = rel + (query ? `?${query}` : '');
        }
      }
      next();
    });
  },
});

interface SitemapEntry {
  slug: string;
  updatedAt: string;
}

/** Route prefix → API collection for the content the API can add after deploy. */
const API_ROUTES = { projects: 'projects', news: 'posts', careers: 'jobs' } as const;

/**
 * Build-time content from the API: published slugs (GET /seo/sitemap-data) plus each detail
 * item, keyed by its API path. An unreachable API (local builds, first deploy) is not fatal —
 * the build falls back to the local content slugs.
 */
async function fetchApiContent(apiUrl: string | undefined) {
  const pages = new Map<string, { api: string; updatedAt: string }>();
  const items: Record<string, unknown> = {};
  if (!apiUrl) return { pages, items };
  const base = apiUrl.replace(/\/$/, '');
  const get = async (path: string) => {
    const res = await fetch(base + path, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
    return ((await res.json()) as { data: unknown }).data;
  };

  try {
    const data = (await get('/seo/sitemap-data')) as Record<string, SitemapEntry[]>;
    for (const [route, collection] of Object.entries(API_ROUTES)) {
      for (const { slug, updatedAt } of data[collection] ?? []) {
        pages.set(`/${route}/${slug}`, {
          api: `/${collection}/${encodeURIComponent(slug)}`,
          updatedAt,
        });
      }
    }
    const list = [...pages.values()];
    for (let i = 0; i < list.length; i += 8) {
      await Promise.all(list.slice(i, i + 8).map(async ({ api }) => (items[api] = await get(api))));
    }
    process.stdout.write(`[ssg] ${pages.size} published pages from ${base}
`);
  } catch (err) {
    pages.clear();
    console.warn(`[ssg] API unavailable (${String(err)}) — prerendering local content only`);
  }
  return { pages, items };
}

export default defineConfig(({ isSsrBuild, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '');
  // Filled by includedRoutes, read by onPageRendered / onFinished.
  const prerendered: string[] = [];
  let apiPages = new Map<string, { api: string; updatedAt: string }>();
  let apiItems: Record<string, unknown> = {};

  return {
    plugins: [
      react(),
      previewNestedHtml(),
      // `import pic from './x.jpg?picture'` → AVIF + WebP + JPEG at 3 widths (see Img.tsx).
      imagetools({
        defaultDirectives: (url) =>
          url.searchParams.has('picture')
            ? new URLSearchParams({ format: 'avif;webp;jpg', w: '640;1024;1600', as: 'picture' })
            : new URLSearchParams(),
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // Same-origin API in dev so httpOnly SameSite=Strict cookies just work.
      proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
    },
    build: {
      target: 'es2020',
      sourcemap: true,
      cssCodeSplit: true,
      // Vendor splitting applies to the client bundle only; SSR externalises deps.
      rollupOptions: isSsrBuild
        ? {}
        : {
            output: {
              manualChunks: {
                react: ['react', 'react-dom', 'react-router-dom'],
                motion: ['framer-motion'],
                gsap: ['gsap', 'lenis'],
                map: ['leaflet', 'react-leaflet'],
              },
            },
          },
    },
    // vite-react-ssg: prerender public routes at build time (admin stays client-only).
    ssgOptions: {
      script: 'async',
      formatting: 'none',
      beastiesOptions: { preload: 'media' },
      dirStyle: 'nested',
      // Dynamic routes (projects/:slug, news/:slug, legal/:page) are expanded via each
      // route's getStaticPaths() (local content) plus the API's published slugs; unexpanded
      // patterns and /admin are dropped here.
      includedRoutes: async (paths) => {
        const api = await fetchApiContent(env.SSG_API_URL);
        ({ pages: apiPages, items: apiItems } = api);
        // The prerender runs in this process: lib/ssgData.ts reads the items from here.
        (globalThis as Record<string, unknown>)[SSG_GLOBAL] = apiItems;
        const out = [
          ...new Set(
            [...paths.map((p) => (p.startsWith('/') ? p : `/${p}`)), ...apiPages.keys()].filter(
              (p) => !p.includes(':') && !p.includes('*') && !p.startsWith('/admin'),
            ),
          ),
        ];
        prerendered.splice(0, prerendered.length, ...out);
        return out;
      },
      // Embed the page's API item so the client hydrates with what was prerendered.
      onPageRendered: (route, html) => {
        const page = apiPages.get(route);
        if (!page || !apiItems[page.api]) return html;
        return html.replace(
          '</head>',
          `${ssgScriptTag({ [page.api]: apiItems[page.api] })}</head>`,
        );
      },
      onFinished: (dir) => {
        const today = new Date().toISOString().slice(0, 10);
        const urls = prerendered
          .filter((p) => p !== '/404')
          .map((p) => {
            const lastmod = apiPages.get(p)?.updatedAt.slice(0, 10) ?? today;
            return `  <url><loc>${siteUrl}${p === '/' ? '/' : p}</loc><lastmod>${lastmod}</lastmod></url>`;
          });
        writeFileSync(
          join(dir, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
        );
        writeFileSync(
          join(dir, 'robots.txt'),
          `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
        );
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
      css: false,
    },
  };
});
