import { useContentList } from '@/lib/query';
import { team } from '@/content/about';
import { useLang } from '@/hooks/useLang';
import { withLang } from '@/lib/withLang';
import type { TeamMember } from '@/lib/types';

export const useTeam = () => {
  const lang = useLang();
  return useContentList<TeamMember>(['team', lang], withLang('/team', lang), team);
};
