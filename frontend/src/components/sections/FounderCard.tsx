import { Img } from '@/components/common/Img';
import { Reveal } from '@/components/motion/Reveal';
import { useT } from '@/hooks/useLang';
import type { TeamMember } from '@/lib/types';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/**
 * Founder card (About, Investors). Grey initials placeholder until a high-resolution portrait
 * is supplied ([CONFIRM]). Other ventures are an optional profile panel (blueprint §2).
 */
export function FounderCard({
  member,
  showVentures = true,
}: {
  member: TeamMember;
  showVentures?: boolean;
}) {
  const { t } = useT('about');
  return (
    <Reveal as="article" className="glass grid gap-8 p-6 sm:p-8 md:grid-cols-[200px_1fr]">
      <div className="aspect-[4/5] w-full max-w-[200px] overflow-hidden rounded-2xl bg-silver/40">
        {member.photo ? (
          <Img image={member.photo} sizes="200px" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-4xl font-extrabold text-charcoal/60 dark:text-offwhite/60"
            aria-hidden="true"
          >
            {initials(member.name)}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl">{member.name}</h3>
        <p className="label mt-2 text-copper-ink">{member.role}</p>
        <p className="mt-4 max-w-2xl text-muted-foreground">{member.bio}</p>
        {showVentures && !!member.otherVentures?.length && (
          <details className="mt-6 rounded-2xl border border-foreground/10 p-4">
            <summary className="min-h-11 cursor-pointer content-center font-semibold">
              {t('founder.profile')}
            </summary>
            <ul className="mt-3 divide-y divide-foreground/10 text-sm">
              {member.otherVentures.map((v) => (
                <li key={v.company} className="flex flex-wrap justify-between gap-2 py-2">
                  <span className="font-medium text-foreground">{v.company}</span>
                  <span className="text-muted-foreground">
                    {v.role} · {v.sector}
                    {v.since ? ` · ${v.since}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </Reveal>
  );
}
