import { useContentItem } from '@/lib/query';
import { defaultSettings } from '@/content/site';
import { useLang } from '@/hooks/useLang';
import { withLang } from '@/lib/withLang';
import type { SiteSettings } from '@/lib/types';

/** Public site settings (logo, contact, address/map pin, socials, SEO defaults). */
export function useSettings(): SiteSettings {
  const lang = useLang();
  const { data } = useContentItem<SiteSettings>(
    ['settings', lang],
    withLang('/settings/public', lang),
    defaultSettings,
  );
  return data ?? defaultSettings;
}

/** Social links the admin switched on, in admin-defined order. */
export function useActiveSocials() {
  return useSettings()
    .social.filter((s) => s.isActive && s.url)
    .sort((a, b) => a.order - b.order);
}
