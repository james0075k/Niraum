import { useContentItem, useContentList } from '@/lib/query';
import { posts } from '@/content/posts';
import type { Post } from '@/lib/types';

export const usePosts = () => useContentList<Post>(['posts'], '/posts?limit=50', posts);

export const usePost = (slug: string) =>
  useContentItem<Post>(
    ['posts', slug],
    `/posts/${encodeURIComponent(slug)}`,
    posts.find((p) => p.slug === slug) ?? null,
  );
