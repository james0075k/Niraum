import { useContentList } from '@/lib/query';
import { team } from '@/content/about';
import { founder } from '@/content/katujpani';
import { useLang } from '@/hooks/useLang';
import { withLang } from '@/lib/withLang';
import type { TeamMember } from '@/lib/types';

export const useTeam = () => {
  const lang = useLang();
  return useContentList<TeamMember>(['team', lang], withLang('/team', lang), team);
};

/** The founder card (About, Investors): admin-managed TeamMember, else the blueprint copy. */
export const useFounder = (): TeamMember => {
  const { data } = useTeam();
  return data.find((m) => m.isFounder) ?? founder;
};
