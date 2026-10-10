/**
 * Phase 4.5 local fallback content — the same facts the backend seeds
 * (backend/src/seed/katujpani.seed.ts), all from docs/content/NIRAUM_MASTER_BLUEPRINT.md.
 * Assay numbers are read straight from docs/content/data/assay_data.json, so the prerendered
 * site and the API can never disagree. Keep the deposit/product/founder text in step with the
 * backend seed (or let the admin panel own it).
 */
import assayData from '../../../docs/content/data/assay_data.json';
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

export const KATUJPANI_SLUG = 'katujpani-iron-deposit';
export const HEMATITE_SLUG = 'industrial-hematite-iron-ore';

export const katujpani: Deposit = {
  name: 'Katujpani Iron Deposit',
  slug: KATUJPANI_SLUG,
  summary:
    'Hematite iron deposit at Bakaiya Gaupalika-09, Makawanpur District, Bagmati Province, mapped in three zones (Areas A, B and C) and sampled across 62.55 m in five sections.',
  location: {
    district: 'Makawanpur',
    municipality: 'Bakaiya Gaupalika',
    ward: '09',
    province: 'Bagmati Province',
    topoSheet: '2785 10A',
    easting: 627755.0,
    northing: 3033300.0,
    spotHeightM: 914,
    lat: null,
    lng: null,
  },
  areas: [
    { code: 'A', label: 'Area A' },
    { code: 'B', label: 'Area B' },
    { code: 'C', label: 'Area C' },
  ],
  land: {
    surveyHa: 20.68,
    quarryHa: 2.88,
    topsoilYardHa: 0.116,
    wasteYardHa: 0.135,
    officeHa: 0.032,
    approachRoadHa: 0.147,
    totalLandUseHa: 3.41,
    landType: 'Forest land',
    confirmed: false,
  },
  geologySummary: 'Middle Siwalik sandstone belt north of Shikharpur (regional map after DMG).',
  consultant: {
    name: 'Shubharambha Mining and Engineering Services Pvt. Ltd.',
    address: 'Tarkeshwor-07, Kathmandu',
  },
  status: 'development',
  statusText:
    'Government procedures and geological studies completed; development toward commercial mining in progress.',
};

const TABLE_14 = 'Deposit weighted average over 62.55 m (Table 14)';

export const hematite: Product = {
  name: 'Industrial Hematite Iron Ore',
  slug: HEMATITE_SLUG,
  chemicalFormula: 'Fe₂O₃',
  summary:
    "Hematite iron ore from the Katujpani deposit, Makawanpur — supplied to Nepal's cement and metals industry.",
  applications: [
    {
      title: 'Cement industry — iron corrective',
      body: 'Hematite ore adds Fe₂O₃ to the cement raw mix. Plants use it to adjust the iron and silica moduli and to act as a flux, which lowers the clinkering temperature and helps form the C₄AF phase.',
    },
    {
      title: 'Foundry and metallurgical buyers — on request',
      body: "Supplied for evaluation and blending. Suitability for direct furnace feed depends on the buyer's grade requirements and may need beneficiation. Samples and full assay sheets are available on request.",
    },
  ],
  typicalChemistry: [
    { oxide: 'Fe₂O₃', value: overall.Fe2O3, unit: '%', basis: TABLE_14 },
    { oxide: 'Fe', value: overall.Fe, unit: '%', basis: TABLE_14 },
    { oxide: 'SiO₂', value: overall.SiO2, unit: '%', basis: TABLE_14 },
    { oxide: 'Al₂O₃', value: overall.Al2O3, unit: '%', basis: TABLE_14 },
  ],
  sizes: [],
  minOrder: '',
  packing: '',
  image: null,
};

export const founder: TeamMember = {
  name: 'Shivahari Pudasaini',
  role: 'Founder',
  bio: "Shivahari Pudasaini founded Niraum Metals to develop Nepal's iron ore resources responsibly. He has led Nepal Souvenir Craft and Trade, an exporter of Nepali handicrafts to international and European markets, since 2010, and invests across mining, hydropower and securities. He works with engineers, geologists and technical specialists to take the Katujpani project from study to commercial operation.",
  photo: null,
  order: 0,
  linkedin: null,
  isFounder: true,
  otherVentures: [
    {
      company: 'Nepal Souvenir Craft and Trade',
      role: 'President',
      sector: 'Handicrafts & export',
      since: 2010,
    },
    { company: 'Roadshow Securities Limited', role: 'Investor', sector: 'Securities', since: 2023 },
    { company: 'Malta Bagmati Hydropower', role: 'Investor', sector: 'Hydropower', since: 2024 },
    {
      company: 'Deshim Mines and Minerals Pvt. Ltd.',
      role: 'Investor',
      sector: 'Mining & minerals',
      since: 2026,
    },
    { company: 'Deshim Mineralium Energy', role: 'Investor', sector: 'Hydropower', since: 2026 },
  ],
};
