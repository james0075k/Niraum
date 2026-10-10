import { useContentItem, useContentList } from '@/lib/query';
import { useLang } from '@/hooks/useLang';
import { withLang } from '@/lib/withLang';
import type { Job } from '@/lib/types';

/** No vacancies are known yet, so the fallback is empty (never invent openings). */
export const useJobs = () => {
  const lang = useLang();
  return useContentList<Job>(['jobs', lang], withLang('/jobs', lang), []);
};

export const useJob = (slug: string) => {
  const lang = useLang();
  return useContentItem<Job>(
    ['jobs', slug, lang],
    withLang(`/jobs/${encodeURIComponent(slug)}`, lang),
    null,
  );
};
