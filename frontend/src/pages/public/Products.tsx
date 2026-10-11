import { Factory, Flame } from 'lucide-react';
import { Img } from '@/components/common/Img';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { CtaBand } from '@/components/sections/CtaBand';
import { DataOriginNote } from '@/components/sections/DataOriginNote';
import { StatCard } from '@/components/sections/StatCard';
import { Seo } from '@/components/seo/Seo';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { banners, photos } from '@/content/siteImages';
import { useAssaySummary } from '@/features/assay/useAssay';
import { useProduct } from '@/features/products/useProducts';
import { useLang, useT } from '@/hooks/useLang';
import { localePath } from '@/app/i18n';
import { formatPct } from '@/lib/format';
import { productLd } from '@/lib/seo';
import type { Stat } from '@/lib/types';

const ICONS = [Factory, Flame];

/** Primary keyword: "hematite ore for cement" (blueprint §7). Never "high-grade". */
export default function Products() {
  const { t } = useT(['products', 'common', 'home']);
  const lang = useLang();
  const p = useProduct();
  const assay = useAssaySummary();
  const top = assay.highlights.highestSample;
  const headline: Stat[] = [
    {
      label: t('home:stats.fe2o3Avg'),
      value: assay.overall?.Fe2O3 ?? null,
      suffix: '%',
      decimals: 2,
    },
    {
      label: t('home:stats.topSample', { sample: top?.sample ?? '' }),
      value: top?.Fe2O3 ?? null,
      suffix: '%',
      decimals: 2,
    },
  ];
  const crumbs = [
    { name: t('common:nav.home'), path: '/' },
    { name: t('common:nav.products'), path: '/products' },
  ];
  const supply = [
    { label: t('supply.sizes'), value: p.sizes.join(', ') },
    { label: t('supply.minOrder'), value: p.minOrder },
    { label: t('supply.packing'), value: p.packing },
  ];

  return (
    <>
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        crumbs={crumbs}
        image={photos.sampleCh8.src}
        jsonLd={[productLd(p, localePath(lang, '/products'), photos.sampleCh8.src)]}
      />
      <PageHero
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        intro={t('hero.intro')}
        image={banners.crushingPlant}
        crumbs={crumbs}
      />

      <section id="product" aria-labelledby="product-title" className="section grain">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="aspect-[4/3] overflow-hidden rounded-[20px] shadow-glass">
            <Img image={photos.sampleChd5} sizes="(min-width: 1024px) 50vw, 100vw" />
          </Reveal>
          <div>
            <p className="eyebrow mb-4">{p.chemicalFormula}</p>
            <h2 id="product-title" className="text-3xl sm:text-4xl">
              {p.name}
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">{p.summary}</p>
            {/* Headline figures from the assay API (same strip as Home) — never typed in. */}
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {headline.map((stat) => (
                <li key={stat.label}>
                  <StatCard stat={stat} className="h-full" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="applications"
        aria-labelledby="applications-title"
        className="section bg-muted/40"
      >
        <div className="container-site">
          <SectionHeading
            id="applications-title"
            eyebrow={t('applications.eyebrow')}
            title={t('applications.title')}
          />
          <RevealGroup as="ol" className="grid gap-4 md:grid-cols-2">
            {p.applications.map((a, i) => {
              const Icon = ICONS[i % ICONS.length]!;
              return (
                <RevealItem as="li" key={a.title} className="glass p-6 sm:p-8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-copper-gradient text-graphite">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl">{a.title}</h3>
                  <p className="mt-3 text-muted-foreground">{a.body}</p>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      <section id="chemistry" aria-labelledby="chemistry-title" className="section grain">
        <div className="container-site max-w-4xl">
          <SectionHeading
            id="chemistry-title"
            eyebrow={t('chemistry.eyebrow')}
            title={t('chemistry.title')}
            intro={t('chemistry.note')}
          />
          <div className="glass overflow-x-auto p-2 sm:p-4">
            <Table className="tabular-nums">
              <TableCaption className="sr-only">{t('chemistry.caption')}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{t('chemistry.oxide')}</TableHead>
                  <TableHead scope="col" className="text-right">
                    {t('chemistry.value')}
                  </TableHead>
                  <TableHead scope="col">{t('chemistry.basis')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.typicalChemistry.map((c) => (
                  <TableRow key={c.oxide}>
                    <TableHead scope="row" className="font-semibold text-foreground">
                      {c.oxide}
                    </TableHead>
                    <TableCell className="text-right font-semibold text-copper-ink">
                      {formatPct(c.value)} {c.unit}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.basis}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DataOriginNote />
        </div>
      </section>

      <section id="supply" aria-labelledby="supply-title" className="section bg-muted/40">
        <div className="container-site max-w-4xl">
          <SectionHeading
            id="supply-title"
            eyebrow={t('supply.eyebrow')}
            title={t('supply.title')}
          />
          <dl className="grid gap-4 sm:grid-cols-3">
            {supply.map((s) => (
              <div key={s.label} className="glass p-6">
                <dt className="label text-muted-foreground">{s.label}</dt>
                <dd className="mt-2 font-semibold">
                  {s.value ? s.value : <span className="tbc text-sm">{t('supply.tbc')}</span>}
                </dd>
              </div>
            ))}
          </dl>
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
