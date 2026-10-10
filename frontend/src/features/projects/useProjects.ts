import { useContentItem, useContentList } from '@/lib/query';
import { projects } from '@/content/projects';
import { useLang } from '@/hooks/useLang';
import { withLang } from '@/lib/withLang';
import type { Project } from '@/lib/types';

export const useProjects = () => {
  const lang = useLang();
  return useContentList<Project>(
    ['projects', lang],
    withLang('/projects?limit=50', lang),
    projects,
  );
};

export const useProject = (slug: string) => {
  const lang = useLang();
  return useContentItem<Project>(
    ['projects', slug, lang],
    withLang(`/projects/${encodeURIComponent(slug)}`, lang),
    projects.find((p) => p.slug === slug) ?? null,
  );
};
