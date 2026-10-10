import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { useMounted } from '@/hooks/useMounted';
import { useT } from '@/hooks/useLang';
import type { AssaySection } from '@/lib/types';

/**
 * Fe₂O₃ by section (Recharts, brand copper). Client-only — the prerendered page and screen
 * readers get the summary table above it (same numbers), and the figure has a text description.
 */
export function FeBySectionChart({ sections }: { sections: AssaySection[] }) {
  const { t } = useT('technical');
  const mounted = useMounted();
  const data = sections.map((s) => ({ section: s.section, Fe2O3: s.Fe2O3 }));

  return (
    <figure
      className="glass p-4 sm:p-6"
      aria-labelledby="fe-chart-title"
      aria-describedby="fe-chart-desc"
    >
      <figcaption id="fe-chart-title" className="label mb-1 text-foreground">
        {t('chart.title')}
      </figcaption>
      <p id="fe-chart-desc" className="sr-only">
        {t('chart.desc')}
      </p>
      <div className="h-72 w-full" aria-hidden="true">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 24, right: 8, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="copper-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DDA27C" />
                  <stop offset="100%" stopColor="#8A5236" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.12} />
              <XAxis
                dataKey="section"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'currentColor', fontSize: 12 }}
              />
              <YAxis
                domain={[0, 50]}
                tickLine={false}
                axisLine={false}
                width={36}
                tick={{ fill: 'currentColor', fontSize: 12 }}
                label={{
                  value: t('chart.axis'),
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'currentColor',
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="Fe2O3"
                fill="url(#copper-bar)"
                radius={[8, 8, 0, 0]}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="Fe2O3"
                  position="top"
                  fill="currentColor"
                  fontSize={12}
                  formatter={(v: number) => v.toFixed(2)}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </figure>
  );
}
