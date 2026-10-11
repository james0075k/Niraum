import { z } from 'zod';
import { ASSAY_DATASETS } from '../models/AssaySample.js';

export const assaySamplesQuery = z.object({
  dataset: z.enum(ASSAY_DATASETS).optional(),
  sort: z.enum(['order', 'Fe', '-Fe', 'Fe2O3', '-Fe2O3', 'SiO2', '-SiO2']).default('order'),
});
export type AssaySamplesQuery = z.infer<typeof assaySamplesQuery>;

/** Weight-% fields: 0–100, mirrors the AssaySample / AssaySummary models. */
const pct = z.number().min(0).max(100);
const optPct = pct.nullable();

/** Numeric weight-% fields of AssaySample (required ones first). */
export const SAMPLE_REQUIRED_PCT = ['SiO2', 'Fe', 'Fe2O3', 'Al2O3'] as const;
export const SAMPLE_OPTIONAL_PCT = ['LOI', 'CaO', 'MgO'] as const;

const sampleFields = {
  sample: z.string().trim().min(1).max(30),
  dataset: z.enum(ASSAY_DATASETS),
  SiO2: pct,
  LOI: optPct,
  Fe: pct,
  Fe2O3: pct,
  Al2O3: pct,
  CaO: optPct,
  MgO: optPct,
  lengthM: z.number().min(0).nullable(),
  note: z.string().trim().max(300),
  order: z.number().int().min(0),
};

/** POST /admin/assay/samples — optional oxides default to `null`, `order` to the end. */
export const assaySampleBody = z
  .object({
    ...sampleFields,
    LOI: sampleFields.LOI.default(null),
    CaO: sampleFields.CaO.default(null),
    MgO: sampleFields.MgO.default(null),
    lengthM: sampleFields.lengthM.default(null),
    note: sampleFields.note.default(''),
    order: sampleFields.order.optional(),
  })
  .strict();
export type AssaySampleBody = z.infer<typeof assaySampleBody>;

/** PUT /admin/assay/samples/:id — any subset of the fields. */
export const assaySampleUpdate = z.object(sampleFields).partial().strict();
export type AssaySampleUpdate = z.infer<typeof assaySampleUpdate>;

/**
 * PUT /admin/assay/summary/:id — only the reported numbers (Table 14 + deposit average).
 * `section` and `isOverall` identify the row and stay fixed.
 */
export const assaySummaryUpdate = z
  .object({
    thicknessM: z.number().min(0),
    SiO2: pct,
    Fe: pct,
    Fe2O3: pct,
    Al2O3: pct,
    order: z.number().int().min(0),
  })
  .partial()
  .strict();
export type AssaySummaryUpdate = z.infer<typeof assaySummaryUpdate>;

export const assayImportQuery = z.object({
  dataset: z.enum(ASSAY_DATASETS),
  mode: z.enum(['replace', 'append']).default('replace'),
});
export type AssayImportQuery = z.infer<typeof assayImportQuery>;

/**
 * CSV columns for the import (case-sensitive, any order). Required columns must be present
 * and filled; optional columns may be left out or blank (→ `null`, note → '').
 */
export const CSV_REQUIRED = ['sample', ...SAMPLE_REQUIRED_PCT] as const;
export const CSV_OPTIONAL = [...SAMPLE_OPTIONAL_PCT, 'lengthM', 'note'] as const;
export const CSV_COLUMNS = [
  'sample',
  'SiO2',
  'LOI',
  'Fe',
  'Fe2O3',
  'Al2O3',
  'CaO',
  'MgO',
  'lengthM',
  'note',
] as const;
export type CsvColumn = (typeof CSV_COLUMNS)[number];
