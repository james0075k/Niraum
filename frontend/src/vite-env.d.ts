/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_MAP_TILE_URL?: string;
  readonly VITE_MAP_ATTRIBUTION?: string;
  readonly VITE_ANALYTICS_ID?: string;
  /** Cloudflare Turnstile site key (public). Empty = no captcha widget (development). */
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  /** Phase 4.5: language for visitors with no saved or browser preference (`en` | `ne`). */
  readonly VITE_DEFAULT_LANG?: string;
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

/** Report imagery in src/assets/site: `import pic from './x.webp?site'` → AVIF + WebP picture. */
declare module '*?site' {
  import type { Picture } from '@/lib/types';
  const picture: Picture;
  export default picture;
}

/** Single resized asset URL, e.g. `./logo.png?w=96&format=webp`. */
declare module '*&format=webp' {
  const src: string;
  export default src;
}
