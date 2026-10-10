/**
 * Phase 4.5 local fallback content — read from the same files the backend seeds from, so the
 * prerendered site and the API can never disagree:
 *  - docs/content/data/assay_data.json (assay numbers)
 *  - docs/content/data/site_content.json (deposit, product, founder as { en, ne })
 */
import assayData from '../../../docs/content/data/assay_data.json';
import siteContent from '../../../docs/content/data/site_content.json';
import type { Lang } from '@/app/i18n';
import type {
  AssayDataset,
  AssaySampleRow,
  AssaySummaryData,
  Deposit,
  Product,
  TeamMember,
} from '@/lib/types';

type Row = {
  sample: string;
  SiO2: number;
  LOI?: number;
  Fe: number;
  Fe2O3: number;
  Al2O3: number;
  CaO?: number;
  MgO?: number;
  length_m?: number;
};

const DATASETS: Record<AssayDataset, Row[]> = {
  grab_B_C: assayData.grab_area_B_C,
  grab_A: assayData.grab_area_A_quarry,
  channel_B: assayData.channel_section_B,
  channel_C: assayData.channel_section_C,
  channel_KXY: assayData.channel_section_KXY,
};

export const assaySamples: AssaySampleRow[] = (
  Object.entries(DATASETS) as [AssayDataset, Row[]][]
).flatMap(([dataset, rows]) =>
  rows.map((r) => ({
    sample: r.sample,
    dataset,
    SiO2: r.SiO2,
    LOI: r.LOI ?? null,
    Fe: r.Fe,
    Fe2O3: r.Fe2O3,
    Al2O3: r.Al2O3,
    CaO: r.CaO ?? null,
    MgO: r.MgO ?? null,
    lengthM: r.length_m ?? null,
    note: '',
  })),
);

const overall = assayData.summary.deposit_weighted_average;
const grabBC = assaySamples.filter((s) => s.dataset === 'grab_B_C');
const top = assaySamples.reduce((a, b) => (b.Fe > a.Fe ? b : a));

export const assaySummary: AssaySummaryData = {
  sections: assayData.weighted_by_section.map((s) => ({
    section: s.section,
    thicknessM: s.thickness_m,
    SiO2: s.SiO2,
    Fe: s.Fe,
    Fe2O3: s.Fe2O3,
    Al2O3: s.Al2O3,
  })),
  overall: {
    section: 'Deposit weighted average',
    thicknessM: overall.total_sample_thickness_m,
    SiO2: overall.SiO2,
    Fe: overall.Fe,
    Fe2O3: overall.Fe2O3,
    Al2O3: overall.Al2O3,
  },
  highlights: {
    highestSample: { sample: top.sample, dataset: top.dataset, Fe: top.Fe, Fe2O3: top.Fe2O3 },
    grabBC: {
      n: grabBC.length,
      Fe2O3: Math.round((grabBC.reduce((s, r) => s + r.Fe2O3, 0) / grabBC.length) * 100) / 100,
    },
  },
  sampleCount: assaySamples.length,
};

export const KATUJPANI_SLUG = siteContent.deposit.slug;
export const HEMATITE_SLUG = siteContent.product.slug;

type L = { en: string; ne?: string };
/** `{ en, ne }` → text for `lang` (English when the Nepali is missing). */
const pick = (v: L, lang: Lang) => (lang === 'ne' && v.ne?.trim() ? v.ne : v.en);

export function katujpaniFor(lang: Lang): Deposit {
  const d = siteContent.deposit;
  return {
    name: pick(d.name, lang),
    slug: d.slug,
    summary: pick(d.summary, lang),
    location: {
      district: pick(d.location.district, lang),
      municipality: pick(d.location.municipality, lang),
      ward: d.location.ward,
      province: pick(d.location.province, lang),
      topoSheet: d.location.topoSheet,
      easting: d.location.easting,
      northing: d.location.northing,
      spotHeightM: d.location.spotHeightM,
      lat: null, // WGS-84 not confirmed yet
      lng: null,
    },
    areas: d.areas.map((a) => ({ code: a.code, label: pick(a.label, lang) })),
    land: {
      surveyHa: d.land.surveyHa,
      quarryHa: d.land.quarryHa,
      topsoilYardHa: d.land.topsoilYardHa,
      wasteYardHa: d.land.wasteYardHa,
      officeHa: d.land.officeHa,
      approachRoadHa: d.land.approachRoadHa,
      totalLandUseHa: d.land.totalLandUseHa,
      landType: d.land.landType,
      confirmed: false,
    },
    geologySummary: pick(d.geologySummary, lang),
    consultant: d.consultant,
    status: 'development',
    statusText: pick(d.statusText, lang),
  };
}

export function hematiteFor(lang: Lang): Product {
  const p = siteContent.product;
  const basis = pick(p.chemistryBasis, lang);
  return {
    name: pick(p.name, lang),
    slug: p.slug,
    chemicalFormula: p.chemicalFormula,
    summary: pick(p.summary, lang),
    applications: p.applications.map((a) => ({
      title: pick(a.title, lang),
      body: pick(a.body, lang),
    })),
    typicalChemistry: [
      { oxide: 'Fe₂O₃', value: overall.Fe2O3, unit: '%', basis },
      { oxide: 'Fe', value: overall.Fe, unit: '%', basis },
      { oxide: 'SiO₂', value: overall.SiO2, unit: '%', basis },
      { oxide: 'Al₂O₃', value: overall.Al2O3, unit: '%', basis },
    ],
    sizes: [],
    minOrder: '',
    packing: '',
    image: null,
  };
}

export function founderFor(lang: Lang): TeamMember {
  const f = siteContent.founder;
  return {
    name: f.name,
    role: pick(f.role, lang),
    bio: pick(f.bio, lang),
    photo: null,
    order: 0,
    linkedin: null,
    isFounder: true,
    otherVentures: f.otherVentures.map((v) => ({
      company: v.company,
      role: pick(v.role, lang),
      sector: pick(v.sector, lang),
      since: v.since,
    })),
  };
}

/** English versions (existing imports and tests). */
export const katujpani = katujpaniFor('en');
export const hematite = hematiteFor('en');
export const founder = founderFor('en');
