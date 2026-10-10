import { katujpani, KATUJPANI_SLUG } from '@/content/katujpani';
import { useLang } from '@/hooks/useLang';
import { useContentItem } from '@/lib/query';
import type { Deposit } from '@/lib/types';
import { withLang } from '@/lib/withLang';

export const useDeposit = (slug: string = KATUJPANI_SLUG) => {
  const lang = useLang();
  const { data } = useContentItem<Deposit>(
    ['deposits', slug, lang],
    withLang(`/deposits/${encodeURIComponent(slug)}`, lang),
    slug === KATUJPANI_SLUG ? katujpani : null,
  );
  return data ?? katujpani;
};
