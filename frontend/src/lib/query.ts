import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { withLocalImages } from '@/content/images';
import { api, type ApiItem, type ApiList } from './api';
import { ssgItem } from './ssgData';

/**
 * Content queries: the API is the source of truth, local content (src/content) is the
 * fallback. Fallback data is passed as `initialData` so prerendered HTML is complete
 * (SEO), then refetched on the client — `initialDataUpdatedAt: 0` marks it stale.
 * If the API is unreachable (Phase 4 not deployed / offline) the fallback stays.
 * Seeded `/images/*.jpg` refs in API data become the optimised local pictures.
 */
async function getOr<T>(url: string, fallback: T, pick: (body: unknown) => T): Promise<T> {
  try {
    const res = await api.get(url);
    return withLocalImages(pick(res.data));
  } catch (err) {
    // Network error, 404 (route not built yet / item missing) or 5xx → use local content.
    if (isAxiosError(err) && (!err.response || err.response.status >= 404)) return fallback;
    throw err;
  }
}

export function useContentList<T>(key: readonly unknown[], url: string, fallback: T[]) {
  return useQuery({
    queryKey: key,
    queryFn: () => getOr(url, fallback, (b) => (b as ApiList<T>).data),
    initialData: fallback,
    initialDataUpdatedAt: 0,
  });
}

/** Prerendered API-only pages start from the build snapshot (lib/ssgData.ts). */
export function useContentItem<T>(key: readonly unknown[], url: string, fallback: T | null) {
  const snapshot = ssgItem<T>(url);
  return useQuery({
    queryKey: key,
    queryFn: () => getOr<T | null>(url, fallback, (b) => (b as ApiItem<T>).data),
    initialData: snapshot ? withLocalImages(snapshot) : (fallback ?? undefined),
    initialDataUpdatedAt: 0,
  });
}
