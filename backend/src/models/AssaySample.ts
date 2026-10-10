import { Schema, model } from 'mongoose';
import { toJSONOptions } from './shared.js';

/** Sample sets in docs/content/data/assay_data.json (grab = indicative only). */
export const ASSAY_DATASETS = [
  'grab_B_C',
  'grab_A',
  'channel_B',
  'channel_C',
  'channel_KXY',
] as const;
export type AssayDataset = (typeof ASSAY_DATASETS)[number];

/** One analysed sample (weight %; channel samples carry their length in metres). */
export interface IAssaySample {
  sample: string;
  dataset: AssayDataset;
  SiO2: number;
  LOI: number | null;
  Fe: number;
  Fe2O3: number;
  Al2O3: number;
  CaO: number | null;
  MgO: number | null;
  lengthM: number | null;
  note: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const pct = { type: Number, required: true, min: 0, max: 100 };
const optPct = { type: Number, default: null, min: 0, max: 100 };

const assaySampleSchema = new Schema<IAssaySample>(
  {
    sample: { type: String, required: true, trim: true, maxlength: 30 },
    dataset: { type: String, enum: ASSAY_DATASETS, required: true },
    SiO2: pct,
    LOI: optPct,
    Fe: pct,
    Fe2O3: pct,
    Al2O3: pct,
    CaO: optPct,
    MgO: optPct,
    lengthM: { type: Number, default: null, min: 0 },
    note: { type: String, default: '', maxlength: 300 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

assaySampleSchema.index({ dataset: 1, sample: 1 }, { unique: true });
assaySampleSchema.index({ dataset: 1, order: 1 });

export const AssaySample = model<IAssaySample>('AssaySample', assaySampleSchema);
