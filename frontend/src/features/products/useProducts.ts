import { hematite, HEMATITE_SLUG } from '@/content/katujpani';
import { useLang } from '@/hooks/useLang';
import { useContentItem } from '@/lib/query';
import type { Product } from '@/lib/types';
import { withLang } from '@/lib/withLang';

export const useProduct = (slug: string = HEMATITE_SLUG) => {
  const lang = useLang();
  const { data } = useContentItem<Product>(
    ['products', slug, lang],
    withLang(`/products/${encodeURIComponent(slug)}`, lang),
    slug === HEMATITE_SLUG ? hematite : null,
  );
  return data ?? hematite;
};
