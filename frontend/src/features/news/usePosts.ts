import { useContentItem, useContentList } from '@/lib/query';
import { posts } from '@/content/posts';
import { useLang } from '@/hooks/useLang';
import { withLang } from '@/lib/withLang';
import type { Post } from '@/lib/types';

export const usePosts = () => {
  const lang = useLang();
  return useContentList<Post>(['posts', lang], withLang('/posts?limit=50', lang), posts);
};

export const usePost = (slug: string) => {
  const lang = useLang();
  return useContentItem<Post>(
    ['posts', slug, lang],
    withLang(`/posts/${encodeURIComponent(slug)}`, lang),
    posts.find((p) => p.slug === slug) ?? null,
  );
};
