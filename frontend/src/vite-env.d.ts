/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_MAP_TILE_URL?: string;
  readonly VITE_MAP_ATTRIBUTION?: string;
  readonly VITE_ANALYTICS_ID?: string;
  /** Cloudflare Turnstile site key (public). Empty = no captcha widget (development). */
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  /** Build-time only (prerender). */
  readonly SSG_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** vite-imagetools: `import pic from './photo.jpg?picture'` (see vite.config.ts defaultDirectives). */
declare module '*?picture' {
  import type { Picture } from '@/lib/types';
  const picture: Picture;
  export default picture;
}
