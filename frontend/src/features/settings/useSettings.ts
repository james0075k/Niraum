import { useContentItem } from '@/lib/query';
import { isPlaceholder } from '@/content/placeholders';
import { defaultSettings } from '@/content/site';
import { useLang, useT } from '@/hooks/useLang';
import { withLang } from '@/lib/withLang';
import type { SiteSettings } from '@/lib/types';

/**
 * Seeded settings may still hold "[PLACEHOLDER: phone]"-style values. They are dropped here so
 * no component links to them (tel:, mailto:, wa.me) or puts them in JSON-LD; the UI shows its
 * own translated "to be confirmed" chip for an empty list instead.
 */
function withoutPlaceholders(s: SiteSettings): SiteSettings {
  return {
    ...s,
    contact: {
      phone: s.contact.phone.filter((v) => !isPlaceholder(v)),
      email: s.contact.email.filter((v) => !isPlaceholder(v)),
      whatsapp: isPlaceholder(s.contact.whatsapp) ? null : s.contact.whatsapp,
    },
  };
}

/** Public site settings (logo, contact, address/map pin, socials, SEO defaults). */
export function useSettings(): SiteSettings {
  const lang = useLang();
  const { data } = useContentItem<SiteSettings>(
    ['settings', lang],
    withLang('/settings/public', lang),
    defaultSettings,
  );
  return withoutPlaceholders(data ?? defaultSettings);
}

/**
 * Address lines for display: place names in the page language (common:places — Nepali drafts),
 * any name not in that list as entered by the admin.
 */
export function useDisplayAddress() {
  const { address } = useSettings();
  const { t } = useT();
  const place = (name: string) => (name ? t(`places.${name}`, { defaultValue: name }) : name);
  return {
    line1: place(address.line1),
    city: place(address.city),
    province: place(address.province),
    country: place(address.country),
  };
}

/** Social links the admin switched on, in admin-defined order. */
export function useActiveSocials() {
  return useSettings()
    .social.filter((s) => s.isActive && s.url)
    .sort((a, b) => a.order - b.order);
}
