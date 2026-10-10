/**
 * Pre-4.5 pages retired in favour of the blueprint sitemap (§5). The blueprint has no content
 * for them, so each one points to the closest new page. Paths are language-less
 * (`/projects/x` → `/our-project`); the same table drives the prerendered redirect pages,
 * the sitemap filter (vite.config.ts) and nginx's 301s (keep nginx.conf in step).
 */
export const MOVED: readonly { from: string; to: string }[] = [
  { from: '/operations', to: '/products' },
  { from: '/projects', to: '/our-project' },
  { from: '/news', to: '/about' },
  { from: '/careers', to: '/contact' },
];

/** New path for a retired one (`/projects/iron-hills` → `/our-project`), else null. */
export function movedTarget(path: string): string | null {
  const hit = MOVED.find((m) => path === m.from || path.startsWith(`${m.from}/`));
  return hit ? hit.to : null;
}
