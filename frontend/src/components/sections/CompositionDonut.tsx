import { motion } from 'framer-motion';
import { useId } from 'react';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { useT } from '@/hooks/useLang';
import { compositionSlices, type CompositionKey } from '@/lib/composition';
import { formatPct } from '@/lib/format';
import { ease } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { AssaySection } from '@/lib/types';

/** Brand palette per slice; "other" is a hatched neutral so it never reads as a mineral. */
const COLOR: Record<CompositionKey, string> = {
  sio2: '#C9CDD3', // silver
  fe2o3: '#B8754A', // copper
  al2o3: '#DDA27C', // copper-light
  other: '', // hatch pattern, id set per instance
};
const SWATCH: Record<CompositionKey, string> = {
  sio2: 'bg-silver',
  fe2o3: 'bg-copper',
  al2o3: 'bg-copper-light',
  other: 'bg-foreground/25',
};

const R = 70;
const C = 2 * Math.PI * R;
const GAP = 1.5; // px of ring left empty between slices

/**
 * Deposit composition donut (assay Table 14 weighted average). Plain SVG — no chart library —
 * so it prerenders and costs ~2 KB on Home. The legend carries every number as text; the
 * ring is decorative for screen readers (figure description has the full sentence).
 */
export function CompositionDonut({
  overall,
  className,
  stacked = false,
}: {
  overall: AssaySection | null;
  className?: string;
  /** Donut above the legend — for narrow columns (Products, Technical Data). */
  stacked?: boolean;
}) {
  const { t } = useT('common');
  const reduce = usePrefersReducedMotion();
  // useId gives ":r1:"; colons break url(#…) references, so strip them.
  const id = `comp${useId().replace(/:/g, '')}`;
  if (!overall) return null;

  const slices = compositionSlices(overall);
  const value = (key: CompositionKey) => formatPct(slices.find((s) => s.key === key)?.value ?? 0);
  // Each arc starts where the previous ones end (fraction of the ring, then px of stroke).
  const arcs = slices.map((s, i) => {
    const before = slices.slice(0, i).reduce((n, x) => n + x.value, 0);
    const len = (s.value / 100) * C;
    return { ...s, start: (before / 100) * C, dash: Math.max(len - GAP, 0.5) };
  });

  return (
    <figure
      className={cn('glass p-5 sm:p-6', className)}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
    >
      <figcaption id={`${id}-title`} className="label mb-4 text-foreground">
        {t('composition.title')}
      </figcaption>
      <p id={`${id}-desc`} className="sr-only">
        {t('composition.desc', {
          sio2: value('sio2'),
          fe2o3: value('fe2o3'),
          al2o3: value('al2o3'),
          other: value('other'),
          fe: formatPct(overall.Fe),
        })}
      </p>
      <div
        className={cn('grid items-center gap-6', !stacked && 'sm:grid-cols-[minmax(0,11rem)_1fr]')}
      >
        <div className={cn('relative mx-auto aspect-square w-44', !stacked && 'sm:w-full')}>
          <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden="true">
            <defs>
              <pattern
                id={`${id}-hatch`}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="6" height="6" fill="currentColor" fillOpacity="0.08" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeOpacity="0.35" />
              </pattern>
            </defs>
            <circle
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.06"
              strokeWidth="26"
            />
            {arcs.map(({ key, start, dash }, i) => (
              <motion.circle
                key={key}
                cx="90"
                cy="90"
                r={R}
                fill="none"
                stroke={key === 'other' ? `url(#${id}-hatch)` : COLOR[key]}
                strokeWidth="26"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-start}
                initial={reduce ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5, ease }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="label text-muted-foreground">{t('composition.feCentre')}</span>
            <span className="text-2xl font-extrabold tabular-nums text-copper-ink">
              {formatPct(overall.Fe)}%
            </span>
          </div>
        </div>
        <div>
          <ul className="space-y-2.5 text-sm">
            {slices.map((s) => (
              <li key={s.key} className="flex items-start gap-3">
                <span
                  className={cn('mt-1 h-3 w-3 shrink-0 rounded-sm', SWATCH[s.key])}
                  aria-hidden="true"
                />
                <span className="flex-1 text-muted-foreground">{t(`composition.${s.key}`)}</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatPct(s.value)}%
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {t('composition.feCentre')} {formatPct(overall.Fe)}%
            </span>{' '}
            — {t('composition.feNote')}. {t('composition.source', { m: overall.thicknessM })}
          </p>
        </div>
      </div>
    </figure>
  );
}
