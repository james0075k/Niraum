/**
 * Build-time API snapshot for prerendered detail pages (projects/news/careers slugs that
 * exist only in the API). vite.config.ts fetches each item, stores it on `globalThis` for
 * the prerender, and embeds it in that page as `<script type="application/json">` so the
 * client hydrates with the same data. JSON scripts never execute, so CSP needs no exception.
 */
export const SSG_DATA_ID = '__ssg-data';
export const SSG_GLOBAL = '__NIRAUM_SSG__';

type Snapshot = Record<string, unknown>;

let clientSnapshot: Snapshot | undefined;

function snapshot(): Snapshot | undefined {
  const g = globalThis as Record<string, unknown>;
  if (import.meta.env.SSR || typeof document === 'undefined') {
    return g[SSG_GLOBAL] as Snapshot | undefined;
  }
  if (clientSnapshot === undefined) {
    const raw = document.getElementById(SSG_DATA_ID)?.textContent;
    try {
      clientSnapshot = raw ? (JSON.parse(raw) as Snapshot) : {};
    } catch {
      clientSnapshot = {};
    }
  }
  return clientSnapshot;
}

/** The snapshotted API item for `url` (e.g. `/projects/slug`), if this page has one. */
export const ssgItem = <T>(url: string): T | undefined => snapshot()?.[url] as T | undefined;

/** `<script>` tag for one page's snapshot entries; `<` is escaped so data can't close it. */
export const ssgScriptTag = (data: Snapshot) =>
  `<script type="application/json" id="${SSG_DATA_ID}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
