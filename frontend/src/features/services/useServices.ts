import { useContentList } from '@/lib/query';
import { services } from '@/content/services';
import { useLang } from '@/hooks/useLang';
import { withLang } from '@/lib/withLang';
import type { Service } from '@/lib/types';

export const useServices = () => {
  const lang = useLang();
  return useContentList<Service>(['services', lang], withLang('/services', lang), services);
};
