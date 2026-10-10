import { useContentItem, useContentList } from '@/lib/query';
import type { Job } from '@/lib/types';

/** No vacancies are known yet, so the fallback is empty (never invent openings). */
export const useJobs = () => useContentList<Job>(['jobs'], '/jobs', []);

export const useJob = (slug: string) =>
  useContentItem<Job>(['jobs', slug], `/jobs/${encodeURIComponent(slug)}`, null);
