import { z } from 'zod';
import { ASSAY_DATASETS } from '../models/AssaySample.js';

export const assaySamplesQuery = z.object({
  dataset: z.enum(ASSAY_DATASETS).optional(),
  sort: z.enum(['order', 'Fe', '-Fe', 'Fe2O3', '-Fe2O3', 'SiO2', '-SiO2']).default('order'),
});
export type AssaySamplesQuery = z.infer<typeof assaySamplesQuery>;
