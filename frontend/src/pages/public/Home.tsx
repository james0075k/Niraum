import { CtaBand } from '@/components/sections/CtaBand';
import { Hero } from '@/components/sections/Hero';
import { ProcessTimeline } from '@/components/sections/ProcessTimeline';
import { ProjectTeaser } from '@/components/sections/ProjectTeaser';
import { Stats } from '@/components/sections/Stats';
import { SupplyCards } from '@/components/sections/SupplyCards';
import { SustainabilityBand } from '@/components/sections/SustainabilityBand';
import { Seo } from '@/components/seo/Seo';
import { useAssaySummary } from '@/features/assay/useAssay';
import { useDeposit } from '@/features/deposits/useDeposit';
import { useT } from '@/hooks/useLang';
import type { Stat } from '@/lib/types';

const STEPS = ['survey', 'sampling', 'assay', 'permitting', 'extraction', 'delivery'] as const;

/** Primary keyword: "iron ore supplier Nepal" (blueprint §7). Sections follow blueprint §5. */
export default function Home() {
  const { t } = useT('home');
  const assay = useAssaySummary();
  const deposit = useDeposit();

  // Every figure comes from the API (AssaySummary) or the same bundled JSON — never typed here.
  const stats: Stat[] = [
    { label: t('stats.fe2o3Avg'), value: assay.overall?.Fe2O3 ?? null, suffix: '%', decimals: 2 },
    {
      label: t('stats.topSample', { sample: assay.highlights.highestSample?.sample ?? '' }),
      value: assay.highlights.highestSample?.Fe2O3 ?? null,
      suffix: '%',
      decimals: 2,
    },
    {
      label: t('stats.sampled'),
      value: assay.overall?.thicknessM ?? null,
      suffix: ' m',
      decimals: 2,
    },
    { label: t('stats.zones'), value: deposit.areas.length || null },
  ];

  return (
    <>
      <Seo path="/" title={t('seo.title')} description={t('seo.description')} />
      <Hero />
      <Stats stats={stats} title={t('stats.title')} />
      <SupplyCards />
      <ProjectTeaser />
      <ProcessTimeline
        steps={STEPS.map((s) => ({
          title: t(`timeline.${s}.title`),
          body: t(`timeline.${s}.body`),
        }))}
        heading={{
          eyebrow: t('timeline.eyebrow'),
          title: t('timeline.title'),
          highlight: [],
          intro: t('timeline.intro'),
        }}
      />
      <SustainabilityBand />
      <CtaBand
        title={t('cta.title')}
        body={t('cta.body')}
        primaryTo="/contact?topic=supply#inquiry"
        primaryLabel={t('common:cta.bulkSupply')}
      />
    </>
  );
}
