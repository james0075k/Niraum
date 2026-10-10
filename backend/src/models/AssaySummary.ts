import { Schema, model } from 'mongoose';
import { toJSONOptions } from './shared.js';

/**
 * Length-weighted grade per section (Table 14) plus the deposit-wide row (`isOverall`).
 * These are the numbers the site shows by default; sample-level rows are gated by
 * SiteSettings.publicAssayDetail.
 */
export interface IAssaySummary {
  section: string;
  thicknessM: number;
  SiO2: number;
  Fe: number;
  Fe2O3: number;
  Al2O3: number;
  isOverall: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const pct = { type: Number, required: true, min: 0, max: 100 };

const assaySummarySchema = new Schema<IAssaySummary>(
  {
    section: { type: String, required: true, trim: true, maxlength: 40 },
    thicknessM: { type: Number, required: true, min: 0 },
    SiO2: pct,
    Fe: pct,
    Fe2O3: pct,
    Al2O3: pct,
    isOverall: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

assaySummarySchema.index({ section: 1 }, { unique: true });

export const AssaySummary = model<IAssaySummary>('AssaySummary', assaySummarySchema);
