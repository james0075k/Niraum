import { FileText } from 'lucide-react';
import { Img } from '@/components/common/Img';
import { Link } from '@/components/common/LangLink';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { AssaySampleTable } from '@/components/sections/AssaySampleTable';
import { CtaBand } from '@/components/sections/CtaBand';
import { AssaySummaryTable } from '@/components/sections/AssaySummaryTable';
import { DataOriginNote } from '@/components/sections/DataOriginNote';
import { CompositionDonut } from '@/components/sections/CompositionDonut';
import { FeBySectionChart } from '@/components/sections/FeBySectionChart';
import { InquiryForm } from '@/components/sections/InquiryForm';
import { StatCard } from '@/components/sections/StatCard';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui/button';
import { banners, photos, siteImages } from '@/content/siteImages';
import { useAssaySamples, useAssaySummary } from '@/features/assay/useAssay';
import { localePath } from '@/app/i18n';
import { useLang, useT } from '@/hooks/useLang';
import { assayDatasetLd } from '@/lib/seo';
import { formatPct } from '@/lib/format';
import type { Stat } from '@/lib/types';

const REPORT_HREF = '/contact?topic=technical_report#inquiry';

/** Primary keyword: "iron ore assay Nepal" (blueprint §7). */
export default function TechnicalData() {
  const { t } = useT(['technical', 'common']);
  const assay = useAssaySummary();
  const lang = useLang();
  const samples = useAssaySamples();
  const o = assay.overall;
  const top = assay.highlights.highestSample;
  const grab = assay.highlights.grabBC;
  const crumbs = [
    { name: t('common:nav.home'), path: '/' },
    { name: t('common:nav.technical'), path: '/technical-data' },
  ];

  const key: Stat[] = [
    { label: t('key.fe2o3'), value: o?.Fe2O3 ?? null, suffix: '%', decimals: 2 },
    { label: t('key.fe'), value: o?.Fe ?? null, suffix: '%', decimals: 2 },
    {
      label: t('key.top', { sample: top?.sample ?? '' }),
      value: top?.Fe2O3 ?? null,
      suffix: '%',
      decimals: 2,
    },
    {
      label: t('key.grab', { n: grab?.n ?? 0 }),
      value: grab?.Fe2O3 ?? null,
      suffix: '%',
      decimals: 2,
    },
    { label: t('key.thickness'), value: o?.thicknessM ?? null, suffix: ' m', decimals: 2 },
  ];

  return (
    <>
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        crumbs={crumbs}
        image={photos.channelWide.src}
        jsonLd={[
          assayDatasetLd(
            t('table.caption'),
            t('seo.description'),
            localePath(lang, '/technical-data'),
          ),
        ]}
      />
      <PageHero
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        intro={t('hero.intro')}
        image={banners.crushingPlant}
        crumbs={crumbs}
      >
        <Button asChild size="lg" className="mt-8">
          <Link to={REPORT_HREF}>
            <FileText aria-hidden="true" /> {t('request')}
          </Link>
        </Button>
      </PageHero>

      <section id="key-figures" aria-labelledby="key-title" className="section grain">
        <div className="container-site">
          <SectionHeading id="key-title" eyebrow={t('key.eyebrow')} title={t('key.title')} />
          <RevealGroup
            as="ul"
            className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-5"
          >
            {key.map((s) => (
              <RevealItem as="li" key={s.label}>
                <StatCard stat={s} className="h-full" />
              </RevealItem>
            ))}
          </RevealGroup>
          {o && (
            <p className="mt-4 text-sm tabular-nums text-muted-foreground">
              {t('key.sio2Al2o3')}: {formatPct(o.SiO2)}% / {formatPct(o.Al2O3)}%
            </p>
          )}
          <DataOriginNote />
        </div>
      </section>

      <section id="weighted-average" aria-labelledby="table-title" className="section bg-muted/40">
        <div className="container-site grid gap-10 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <SectionHeading
              id="table-title"
              eyebrow={t('table.eyebrow')}
              title={t('table.title')}
            />
            <AssaySummaryTable data={assay} />
          </div>
          <div className="min-w-0 space-y-6 lg:col-span-5 lg:pt-28">
            <CompositionDonut overall={assay.overall} stacked />
            <FeBySectionChart sections={assay.sections} />
            <DataOriginNote />
          </div>
        </div>
      </section>

      <section id="samples" aria-labelledby="samples-title" className="section grain">
        <div className="container-site">
          <SectionHeading
            id="samples-title"
            eyebrow={t('samples.eyebrow')}
            title={t('samples.title')}
          />
          {samples ? (
            <AssaySampleTable rows={samples} />
          ) : (
            <div className="grid gap-10 lg:grid-cols-12">
              <Reveal className="min-w-0 lg:col-span-5">
                <h3 className="text-2xl">{t('samples.privateTitle')}</h3>
                <p className="mt-3 text-muted-foreground">{t('samples.privateBody')}</p>
              </Reveal>
              <div className="min-w-0 lg:col-span-7">
                <InquiryForm topic="technical_report" />
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="method" aria-labelledby="method-title" className="section bg-muted/40">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="method-title"
              eyebrow={t('method.eyebrow')}
              title={t('method.title')}
              intro={t('method.body')}
            />
            <Button asChild variant="outline" size="lg">
              <Link to={REPORT_HREF}>{t('request')}</Link>
            </Button>
          </div>
          <RevealGroup as="ul" className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              photos.channelMarks,
              siteImages.channelChB1,
              photos.sampleChd5,
              siteImages.labAssay,
            ].map((img) => (
              <RevealItem
                as="li"
                key={img.src}
                className="aspect-square overflow-hidden rounded-[20px]"
              >
                <Img image={img} sizes="(min-width: 1024px) 25vw, 50vw" />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <CtaBand
        title={t('cta.title')}
        body={t('cta.body')}
        primaryTo="/contact?topic=supply#inquiry"
        primaryLabel={t('common:cta.bulkSupply')}
      />
    </>
  );
}
