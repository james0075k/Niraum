/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_MAP_TILE_URL?: string;
  readonly VITE_MAP_ATTRIBUTION?: string;
  readonly VITE_ANALYTICS_ID?: string;
  /** Build-time only (prerender). */
  readonly SSG_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
