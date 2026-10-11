import mongoose, { type ClientSession } from 'mongoose';
import { rebuild } from '../jobs/rebuild.js';
import { AssaySample, type AssayDataset, type IAssaySample } from '../models/AssaySample.js';
import { AssaySummary, type IAssaySummary } from '../models/AssaySummary.js';
import { AppError } from '../utils/AppError.js';
import { CsvError, parseCsv } from '../utils/csv.js';
import { diffFields } from '../utils/diff.js';
import {
  CSV_COLUMNS,
  CSV_REQUIRED,
  SAMPLE_OPTIONAL_PCT,
  SAMPLE_REQUIRED_PCT,
  type AssayImportQuery,
  type AssaySampleBody,
  type AssaySamplesQuery,
  type AssaySampleUpdate,
  type AssaySummaryUpdate,
  type CsvColumn,
} from '../validators/assay.js';
import { auditService, type Actor } from './audit.service.js';
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

/** Admin shape: like `strip` but keeps `updatedAt` (when a row was last edited). */
const adminView = ({ _id, __v: _v, createdAt: _c, ...rest }: Plain): Plain => ({
  id: String(_id),
  ...rest,
});

const toPlain = (doc: { toObject(): unknown }): Plain => doc.toObject() as Plain;

const round = (n: number) => Math.round(n * 100) / 100;

const SAMPLE = 'AssaySample';
const SUMMARY = 'AssaySummary';

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

/** One validated CSV row, ready to insert. */
type SampleRow = Omit<IAssaySample, 'createdAt' | 'updatedAt'>;

export interface RowError {
  line: number;
  errors: string[];
}

const NUMBER = /^[-+]?(?:\d+\.?\d*|\.\d+)$/;

/** Cell → number | null with a readable error ("Fe must be ≤ 100"). */
function numberCell(
  name: string,
  raw: string | undefined,
  opts: { required: boolean; max?: number },
  errors: string[],
): number | null {
  const value = (raw ?? '').trim();
  if (value === '') {
    if (opts.required) errors.push(`${name} is required`);
    return null;
  }
  if (!NUMBER.test(value)) {
    errors.push(`${name} must be a number`);
    return null;
  }
  const n = Number(value);
  if (n < 0) errors.push(`${name} must be ≥ 0`);
  else if (opts.max !== undefined && n > opts.max) errors.push(`${name} must be ≤ ${opts.max}`);
  return n;
}

/**
 * CSV text → validated rows, or a 400 listing every problem: header errors in `formErrors`,
 * row errors with their file line in `rows`. Nothing is written unless the whole file is clean.
 */
export function parseAssayCsv(
  text: string,
  dataset: AssayDataset,
  existing: ReadonlySet<string> = new Set(),
): Omit<SampleRow, 'order'>[] {
  const fail = (formErrors: string[], rows: RowError[] = []) =>
    AppError.badRequest(
      formErrors[0] ?? `${rows.length} row${rows.length === 1 ? '' : 's'} need fixing`,
      { formErrors, rows },
    );

  let records;
  try {
    records = parseCsv(text);
  } catch (err) {
    if (err instanceof CsvError) throw fail([err.message]);
    throw err;
  }
  const [head, ...body] = records;
  if (!head) throw fail(['The file is empty']);

  const header = head.cells.map((c) => c.trim());
  const formErrors: string[] = [];
  const known = new Set<string>(CSV_COLUMNS);
  const unknown = header.filter((h) => !known.has(h));
  if (unknown.length) {
    formErrors.push(
      `Unknown column${unknown.length > 1 ? 's' : ''}: ${unknown.map((u) => `"${u}"`).join(', ')} — allowed: ${CSV_COLUMNS.join(', ')}`,
    );
  }
  const repeated = [...new Set(header.filter((h, i) => header.indexOf(h) !== i))];
  if (repeated.length) formErrors.push(`Column used more than once: ${repeated.join(', ')}`);
  const missing = CSV_REQUIRED.filter((c) => !header.includes(c));
  if (missing.length) formErrors.push(`Missing required column: ${missing.join(', ')}`);
  if (formErrors.length) throw fail(formErrors);
  if (!body.length) throw fail(['The file has no data rows']);

  const index = Object.fromEntries(header.map((h, i) => [h, i])) as Partial<
    Record<CsvColumn, number>
  >;
  const cell = (cells: string[], col: CsvColumn) => {
    const i = index[col];
    return i === undefined ? undefined : cells[i];
  };

  const rows: Omit<SampleRow, 'order'>[] = [];
  const rowErrors: RowError[] = [];
  const seen = new Map<string, number>();

  for (const { line, cells } of body) {
    const errors: string[] = [];
    if (cells.length !== header.length) {
      rowErrors.push({
        line,
        errors: [`Expected ${header.length} cells, found ${cells.length}`],
      });
      continue;
    }
    const sample = (cell(cells, 'sample') ?? '').trim();
    if (!sample) errors.push('sample is required');
    else if (sample.length > 30) errors.push('sample must be at most 30 characters');
    else if (seen.has(sample)) {
      errors.push(`Duplicate sample "${sample}" (also on line ${seen.get(sample)})`);
    } else if (existing.has(sample)) {
      errors.push(`Sample "${sample}" already exists in ${dataset}`);
    }
    if (sample && !seen.has(sample)) seen.set(sample, line);

    const pctOf = (name: string, required: boolean) =>
      numberCell(name, cell(cells, name as CsvColumn), { required, max: 100 }, errors);
    const required = Object.fromEntries(
      SAMPLE_REQUIRED_PCT.map((f) => [f, pctOf(f, true)]),
    ) as Record<(typeof SAMPLE_REQUIRED_PCT)[number], number>;
    const optional = Object.fromEntries(
      SAMPLE_OPTIONAL_PCT.map((f) => [f, pctOf(f, false)]),
    ) as Record<(typeof SAMPLE_OPTIONAL_PCT)[number], number | null>;
    const lengthM = numberCell('lengthM', cell(cells, 'lengthM'), { required: false }, errors);
    const note = (cell(cells, 'note') ?? '').trim();
    if (note.length > 300) errors.push('note must be at most 300 characters');

    if (errors.length) rowErrors.push({ line, errors });
    else rows.push({ sample, dataset, ...required, ...optional, lengthM, note });
  }

  if (rowErrors.length) throw fail([], rowErrors);
  return rows;
}

/** Mongo without a replica set (local dev, the test server) can't run transactions. */
const transactionsUnsupported = (err: unknown) => {
  const e = err as { code?: number; message?: string };
  return e?.code === 20 || /replica set|Transaction numbers/i.test(e?.message ?? '');
};

/**
 * Runs `work` in a transaction when the deployment supports one (Atlas). Otherwise runs it
 * without a session; callers validate everything first so only infrastructure errors remain.
 */
async function inTransaction<T>(work: (session: ClientSession | null) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result as T;
  } catch (err) {
    if (!transactionsUnsupported(err)) throw err;
  } finally {
    await session.endSession();
  }
  return work(null);
}

async function findSample(id: string) {
  const doc = await AssaySample.findById(id);
  if (!doc) throw AppError.notFound('Assay sample');
  return doc;
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
    return {
      data: docs.map(opts.admin ? adminView : strip),
      meta: { total: docs.length, source: ASSAY_SOURCE },
    };
  },

  // ── Admin writes (editor+). Each one is audit-logged and schedules a site rebuild. ──

  async createSample(input: AssaySampleBody, actor: Actor): Promise<Plain> {
    const data: Plain = { ...input };
    if (input.order === undefined) {
      const last = await AssaySample.findOne({ dataset: input.dataset })
        .sort({ order: -1 })
        .select('order')
        .lean<{ order: number }>();
      data.order = last ? last.order + 1 : 0;
    }
    const doc = await AssaySample.create(data);
    const created = adminView(toPlain(doc));
    await auditService.record(actor, {
      action: 'create',
      entity: SAMPLE,
      entityId: String(doc._id),
      diff: diffFields(null, created),
    });
    rebuild.schedule('assay sample created');
    return created;
  },

  async updateSample(id: string, input: AssaySampleUpdate, actor: Actor): Promise<Plain> {
    const doc = await findSample(id);
    const before = toPlain(doc);
    doc.set(input);
    await doc.save();
    const after = toPlain(doc);
    await auditService.record(actor, {
      action: 'update',
      entity: SAMPLE,
      entityId: id,
      diff: diffFields(before, after),
    });
    rebuild.schedule('assay sample updated');
    return adminView(after);
  },

  /** Hard delete; the audit entry keeps the old values. */
  async removeSample(id: string, actor: Actor): Promise<void> {
    const doc = await findSample(id);
    const before = toPlain(doc);
    await doc.deleteOne();
    await auditService.record(actor, {
      action: 'delete',
      entity: SAMPLE,
      entityId: id,
      diff: diffFields(before, null),
    });
    rebuild.schedule('assay sample deleted');
  },

  async summaryAdmin(): Promise<Plain[]> {
    const rows = await AssaySummary.find().sort({ order: 1, section: 1 }).lean<Plain[]>();
    return rows.map(adminView);
  },

  async updateSummary(id: string, input: AssaySummaryUpdate, actor: Actor): Promise<Plain> {
    const doc = await AssaySummary.findById(id);
    if (!doc) throw AppError.notFound('Assay summary row');
    const before = toPlain(doc);
    doc.set(input);
    await doc.save();
    const after = toPlain(doc);
    await auditService.record(actor, {
      action: 'update',
      entity: SUMMARY,
      entityId: id,
      diff: diffFields(before, after),
    });
    rebuild.schedule('assay summary updated');
    return adminView(after);
  },

  /**
   * CSV import into one dataset. All-or-nothing: the whole file is validated first (bad rows
   * → 400 with line numbers, nothing written); then `replace` swaps the dataset's rows and
   * `append` adds after them — inside a transaction where Mongo supports one.
   */
  async importCsv(
    text: string,
    { dataset, mode }: AssayImportQuery,
    actor: Actor,
  ): Promise<{ inserted: number; replaced: number }> {
    const current = await AssaySample.find({ dataset }).sort({ order: 1 }).lean<IAssaySample[]>();
    const existing = mode === 'append' ? new Set(current.map((r) => r.sample)) : new Set<string>();
    const parsed = parseAssayCsv(text, dataset, existing);
    const offset = mode === 'append' ? Math.max(-1, ...current.map((r) => r.order)) + 1 : 0;
    const rows = parsed.map((r, i) => ({ ...r, order: offset + i }));

    const result = await inTransaction(async (session) => {
      let replaced = 0;
      const opts = session ? { session } : {};
      if (mode === 'replace') {
        replaced = (await AssaySample.deleteMany({ dataset }, opts)).deletedCount;
      }
      try {
        await AssaySample.insertMany(rows, { ...opts, ordered: true });
      } catch (err) {
        // No transaction: put the previous rows back so a failed insert never empties a dataset.
        if (!session) {
          await AssaySample.deleteMany({ dataset, sample: { $in: rows.map((r) => r.sample) } });
          if (mode === 'replace' && current.length) await AssaySample.insertMany(current);
        }
        throw err;
      }
      return { inserted: rows.length, replaced };
    });

    await auditService.record(actor, {
      action: 'import',
      entity: SAMPLE,
      entityId: null,
      diff: { dataset, mode, ...result },
    });
    rebuild.schedule(`assay ${dataset} imported`);
    return result;
  },
};
