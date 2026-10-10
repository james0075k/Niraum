import { useContentList } from '@/lib/query';
import { services } from '@/content/services';
import type { Service } from '@/lib/types';

export const useServices = () => useContentList<Service>(['services'], '/services', services);
