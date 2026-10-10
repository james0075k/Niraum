import { useContentList } from '@/lib/query';
import { team } from '@/content/about';
import type { TeamMember } from '@/lib/types';

export const useTeam = () => useContentList<TeamMember>(['team'], '/team', team);
