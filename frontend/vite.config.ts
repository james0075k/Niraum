/// <reference types="vitest/config" />
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { imagetools } from 'vite-imagetools';
import { movedTarget } from './src/app/redirects';
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
/** Site languages (mirrors src/app/i18n.ts LANGS); pages live under `/<lang>/…`. */
const LANGS = ['en', 'ne'] as const;
/** API path for a language — same rule as `withLang` in src/lib/api.ts. */
const apiPath = (path: string, lang: string) => (lang === 'en' ? path : `${path}?lang=${lang}`);

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
      // Retired sections (app/redirects.ts) only get redirect stubs, no API snapshots.
      if (movedTarget(`/${route}`)) continue;
      for (const { slug, updatedAt } of data[collection] ?? []) {
        for (const lang of LANGS) {
          pages.set(`/${lang}/${route}/${slug}`, {
            api: apiPath(`/${collection}/${encodeURIComponent(slug)}`, lang),
            updatedAt,
          });
        }
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
      // `?site` (report imagery in assets/site, already WebP) → AVIF + WebP at 480/768/1200.
      imagetools({
        defaultDirectives: (url) => {
          if (url.searchParams.has('picture')) {
            return new URLSearchParams({
              format: 'avif;webp;jpg',
              w: '640;1024;1600',
              as: 'picture',
            });
          }
          if (url.searchParams.has('site')) {
            return new URLSearchParams({ format: 'avif;webp', w: '480;768;1200', as: 'picture' });
          }
          // `?photo`: Niraum's own field photography (high-res masters in assets/site/photos).
          if (url.searchParams.has('photo')) {
            return new URLSearchParams({
              format: 'avif;webp',
              w: '480;768;1200;1600',
              withoutEnlargement: 'true',
              as: 'picture',
            });
          }
          return new URLSearchParams();
        },
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
      // Fonts are preloaded selectively in onPageRendered, not by beasties.
      beastiesOptions: { preload: 'media', preloadFonts: false },
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
      onPageRendered: (route, rendered) => {
        // vite-react-ssg preloads every image in the module graph (siteImages.ts / images.ts
        // import all photos at all widths → ~28 MB per page). Images load from <img>/<picture>
        // instead: the hero is eager + fetchpriority=high, everything else lazy.
        // It also preloads every font file (all Manrope subsets, Mukta in woff + woff2). Keep
        // only what the first paint needs: Manrope Latin, plus Mukta 400 + 700 on Nepali pages
        // (without the 700 preload, headings swap fonts late on slow networks — CLS).
        const preloads: string[] = [];
        const keepFont = (href: string) =>
          /manrope-latin-wght/.test(href) ||
          (/^\/ne(\/|$)/.test(route) &&
            /mukta-devanagari-(400|700)-normal-[^/]+\.woff2$/.test(href));
        const html = rendered
          .replace(/<link rel="preload" as="image"[^>]*>/g, '')
          .replace(/<link rel="preload" as="font"[^>]*>/g, (tag) =>
            keepFont(/href="([^"]+)"/.exec(tag)?.[1] ?? '') ? tag : '',
          )
          // The prerendered HTML is complete without JS, so the app (hydration, motion) starts
          // right after the first frame is painted instead of competing with it on slow
          // networks: no modulepreload hints, entry module injected after paint.
          .replace(/<link rel="modulepreload"[^>]*>/g, (tag) => {
            const href = /href="([^"]+)"/.exec(tag)?.[1];
            if (href) preloads.push(href);
            return '';
          })
          .replace(
            /<script type="module"[^>]*\ssrc="([^"]+)"[^>]*><\/script>/,
            (_tag, src: string) =>
              // Same chunks as the removed modulepreload hints, requested in parallel after paint.
              `<script>(function(){var p=${JSON.stringify(preloads)};function go(){p.forEach(function(h){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=h;document.head.appendChild(l)});var s=document.createElement('script');s.type='module';s.crossOrigin='';s.src=${JSON.stringify(src)};document.head.appendChild(s)}function later(){requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(go,0)})})}document.readyState==='loading'?document.addEventListener('DOMContentLoaded',later):later()})()</script>`,
          );
        const page = apiPages.get(route);
        if (!page || !apiItems[page.api]) return html;
        return html.replace(
          '</head>',
          `${ssgScriptTag({ [page.api]: apiItems[page.api] })}</head>`,
        );
      },
      onFinished: (dir) => {
        const today = new Date().toISOString().slice(0, 10);
        // Only real pages: `/` and unprefixed legacy URLs are redirect stubs; 404s are excluded.
        const langPage = (p: string) =>
          LANGS.some((l) => p === `/${l}` || p.startsWith(`/${l}/`)) &&
          !p.endsWith('/404') &&
          !movedTarget(p.replace(/^\/(en|ne)/, ''));
        const swap = (p: string, lang: string) => p.replace(/^\/(en|ne)(?=\/|$)/, `/${lang}`);
        const urls = prerendered.filter(langPage).map((p) => {
          const lastmod = apiPages.get(p)?.updatedAt.slice(0, 10) ?? today;
          const alternates = [...LANGS, 'x-default']
            .map((l) => {
              const href = `${siteUrl}${swap(p, l === 'x-default' ? 'en' : l)}`;
              return `<xhtml:link rel="alternate" hreflang="${l}" href="${href}"/>`;
            })
            .join('');
          return `  <url><loc>${siteUrl}${p}</loc><lastmod>${lastmod}</lastmod>${alternates}</url>`;
        });
        writeFileSync(
          join(dir, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
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
      // userEvent typing in jsdom is slow when files run in parallel; 5 s was borderline.
      testTimeout: 15_000,
      include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
      css: false,
    },
  };
});
