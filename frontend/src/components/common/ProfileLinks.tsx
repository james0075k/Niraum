import {
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Music2,
  Phone,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
import { useActiveSocials } from '@/features/settings/useSettings';
import type { SocialPlatform } from '@/lib/types';
import { cn } from '@/lib/utils';

const icons: Record<SocialPlatform, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  x: Twitter,
  tiktok: Music2,
  whatsapp: MessageCircle,
  viber: Phone,
};

const names: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  x: 'X',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  viber: 'Viber',
};

/** Only socials the admin switched on (SiteSettings.social[].isActive). Renders nothing if none. */
export function ProfileLinks({ className }: { className?: string }) {
  const socials = useActiveSocials();
  if (!socials.length) return null;
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {socials.map((s) => {
        const Icon = icons[s.platform];
        return (
          <li key={s.platform}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Niraum Metals on ${names[s.platform]} (opens in a new tab)`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 text-foreground/80 transition-colors hover:border-primary hover:text-copper-ink"
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
