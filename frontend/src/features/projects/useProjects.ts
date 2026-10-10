import { useContentItem, useContentList } from '@/lib/query';
import { projects } from '@/content/projects';
import type { Project } from '@/lib/types';

export const useProjects = () =>
  useContentList<Project>(['projects'], '/projects?limit=50', projects);

export const useProject = (slug: string) =>
  useContentItem<Project>(
    ['projects', slug],
    `/projects/${encodeURIComponent(slug)}`,
    projects.find((p) => p.slug === slug) ?? null,
  );
