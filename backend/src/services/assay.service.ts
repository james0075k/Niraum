import { AssaySample, type IAssaySample } from '../models/AssaySample.js';
import { AssaySummary, type IAssaySummary } from '../models/AssaySummary.js';
import { AppError } from '../utils/AppError.js';
import type { AssaySamplesQuery } from '../validators/assay.js';
import { settingsService } from './settings.service.js';

type Plain = Record<string, unknown>;

/** Source credit shown under every technical table (blueprint §4 data origin statement). */
export const ASSAY_SOURCE = {
  consultant: 'Shubharambha Mining and Engineering Services Pvt. Ltd., Tarkeshwor-07, Kathmandu',
  basis: 'Mine scheme submitted under Department of Mines and Geology (DMG) guidelines',
  disclaimer:
    'Figures are indicative of the sampled zones and are not a JORC/NI 43-101 reserve statement.',
} as const;

const strip = ({ _id, __v: _v, createdAt: _c, updatedAt: _u, ...rest }: Plain): Plain => ({
  id: String(_id),
  ...rest,
});

const round = (n: number) => Math.round(n * 100) / 100;

/** Length-weighted average of `field` over rows with a thickness/length. */
export function weightedAverage<T>(
  rows: readonly T[],
  weight: (r: T) => number,
  value: (r: T) => number,
): number {
  const total = rows.reduce((s, r) => s + weight(r), 0);
  if (total === 0) return 0;
  return rows.reduce((s, r) => s + weight(r) * value(r), 0) / total;
}

export const assayService = {
  /**
   * Public summary: Table 14 rows, the deposit-wide row and a few headline figures computed
   * from the stored samples (highest sample, grab-sample average). Always public — only
   * sample-level rows are gated.
   */
  async summary() {
    const [rows, samples] = await Promise.all([
      AssaySummary.find().sort({ order: 1, section: 1 }).lean<IAssaySummary[]>(),
      AssaySample.find().select('sample dataset Fe Fe2O3').lean<IAssaySample[]>(),
    ]);
    const sections = rows.filter((r) => !r.isOverall).map((r) => strip(r as unknown as Plain));
    const overallRow = rows.find((r) => r.isOverall);

    const top = samples.reduce<IAssaySample | null>((a, b) => (!a || b.Fe > a.Fe ? b : a), null);
    const grabBC = samples.filter((s) => s.dataset === 'grab_B_C');

    return {
      sections,
      overall: overallRow ? strip(overallRow as unknown as Plain) : null,
      highlights: {
        highestSample: top
          ? { sample: top.sample, dataset: top.dataset, Fe: top.Fe, Fe2O3: top.Fe2O3 }
          : null,
        grabBC: grabBC.length
          ? {
              n: grabBC.length,
              Fe2O3: round(grabBC.reduce((s, r) => s + r.Fe2O3, 0) / grabBC.length),
            }
          : null,
      },
      sampleCount: samples.length,
      source: ASSAY_SOURCE,
    };
  },

  /**
   * Sample-level rows. Public only when SiteSettings.publicAssayDetail is on; otherwise
   * visitors use the "Request full assay report" inquiry. Admins always see them.
   */
  async samples(query: AssaySamplesQuery, opts: { admin: boolean }) {
    if (!opts.admin) {
      const settings = await settingsService.get();
      if (!settings.publicAssayDetail) {
        throw AppError.forbidden(
          'Sample-level assay data is available on request — use the "Request full assay report" form.',
        );
      }
    }
    const filter = query.dataset ? { dataset: query.dataset } : {};
    const desc = query.sort.startsWith('-');
    const field = desc ? query.sort.slice(1) : query.sort;
    const docs = await AssaySample.find(filter)
      .sort({ [field]: desc ? -1 : 1, dataset: 1, order: 1 })
      .lean<Plain[]>();
    return { data: docs.map(strip), meta: { total: docs.length, source: ASSAY_SOURCE } };
  },
};
