/**
 * Assay data from docs/content/data/assay_data.json → AssaySummary + AssaySample.
 * Idempotent upserts: edit the JSON, re-run `pnpm seed`, the database follows.
 * The JSON is the source of truth (transcribed from the mine scheme and re-verified).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AssaySample, type AssayDataset } from '../models/AssaySample.js';
import { AssaySummary } from '../models/AssaySummary.js';

interface Row {
  sample: string;
  SiO2: number;
  LOI?: number;
  Fe: number;
  Fe2O3: number;
  Al2O3: number;
  CaO?: number;
  MgO?: number;
  length_m?: number;
}

export interface AssayData {
  summary: {
    deposit_weighted_average: {
      total_sample_thickness_m: number;
      SiO2: number;
      Fe: number;
      Fe2O3: number;
      Al2O3: number;
    };
  };
  weighted_by_section: {
    section: string;
    thickness_m: number;
    SiO2: number;
    Fe: number;
    Fe2O3: number;
    Al2O3: number;
  }[];
  grab_area_B_C: Row[];
  grab_area_A_quarry: Row[];
  channel_section_B: Row[];
  channel_section_C: Row[];
  channel_section_KXY: Row[];
}

/** JSON key → dataset name stored on AssaySample. */
export const DATASET_KEYS: Record<AssayDataset, keyof AssayData> = {
  grab_B_C: 'grab_area_B_C',
  grab_A: 'grab_area_A_quarry',
  channel_B: 'channel_section_B',
  channel_C: 'channel_section_C',
  channel_KXY: 'channel_section_KXY',
};

/** Caveats from the data notes, attached to the affected rows. */
const NOTES: Record<string, string> = {
  'grab_A:DM-9':
    'Fe and Al2O3 partly hidden by a stamp in the scan: Fe derived from Fe2O3; Al2O3 is a best reading.',
};

export const OVERALL_SECTION = 'Deposit weighted average';

/** Finds the JSON from the backend folder, the repo root or ASSAY_DATA_PATH. */
export function loadAssayData(path = process.env.ASSAY_DATA_PATH): AssayData {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path,
    resolve(here, '../../../docs/content/data/assay_data.json'),
    resolve(process.cwd(), '../docs/content/data/assay_data.json'),
    resolve(process.cwd(), 'docs/content/data/assay_data.json'),
  ].filter((p): p is string => !!p);
  const file = candidates.find((p) => existsSync(p));
  if (!file) throw new Error(`assay_data.json not found (tried ${candidates.join(', ')})`);
  return JSON.parse(readFileSync(file, 'utf8')) as AssayData;
}

export async function seedAssay(data: AssayData = loadAssayData()) {
  const overall = data.summary.deposit_weighted_average;
  const summaries = [
    ...data.weighted_by_section.map((s, i) => ({
      section: s.section,
      thicknessM: s.thickness_m,
      SiO2: s.SiO2,
      Fe: s.Fe,
      Fe2O3: s.Fe2O3,
      Al2O3: s.Al2O3,
      isOverall: false,
      order: i,
    })),
    {
      section: OVERALL_SECTION,
      thicknessM: overall.total_sample_thickness_m,
      SiO2: overall.SiO2,
      Fe: overall.Fe,
      Fe2O3: overall.Fe2O3,
      Al2O3: overall.Al2O3,
      isOverall: true,
      order: 99,
    },
  ];
  await AssaySummary.bulkWrite(
    summaries.map((doc) => ({
      updateOne: { filter: { section: doc.section }, update: { $set: doc }, upsert: true },
    })),
  );

  const samples = (Object.entries(DATASET_KEYS) as [AssayDataset, keyof AssayData][]).flatMap(
    ([dataset, key]) =>
      (data[key] as Row[]).map((r, i) => ({
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
        note: NOTES[`${dataset}:${r.sample}`] ?? '',
        order: i,
      })),
  );
  await AssaySample.bulkWrite(
    samples.map((doc) => ({
      updateOne: {
        filter: { dataset: doc.dataset, sample: doc.sample },
        update: { $set: doc },
        upsert: true,
      },
    })),
  );
  return { summaries: summaries.length, samples: samples.length };
}
