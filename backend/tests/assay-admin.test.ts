import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { rebuild } from '../src/jobs/rebuild.js';
import { AssaySample } from '../src/models/AssaySample.js';
import { AssaySummary } from '../src/models/AssaySummary.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { loadAssayData, seedAssay } from '../src/seed/assay.seed.js';
import { loginAs } from './helpers.js';

/**
 * Admin assay writes + CSV import. Sample IDs and numbers below are test fixtures only (made
 * up, prefixed "T-"); the real figures live in docs/content/data/assay_data.json.
 */
const HEADER = 'sample,SiO2,LOI,Fe,Fe2O3,Al2O3,CaO,MgO,lengthM,note';
const csv = (rows: string[], header = HEADER) => [header, ...rows].join('\n');

let app: Express;
let editor: string[];

beforeEach(async () => {
  app = createApp();
  await seedAssay(loadAssayData());
  editor = (await loginAs(app, 'editor')).cookies;
});

const importCsv = (body: string, query = 'dataset=channel_C&mode=replace', cookies = editor) =>
  request(app)
    .post(`/api/v1/admin/assay/import?${query}`)
    .set('Cookie', cookies)
    .set('Content-Type', 'text/csv')
    .send(body);

describe('POST /admin/assay/import', () => {
  it('imports a valid CSV in replace mode', async () => {
    const before = await AssaySample.countDocuments({ dataset: 'channel_C' });
    const others = await AssaySample.countDocuments({ dataset: { $ne: 'channel_C' } });
    const schedule = vi.spyOn(rebuild, 'schedule');

    const res = await importCsv(
      csv(['T-1,50.1,,30.2,43.2,3.2,,,1.5,', 'T-2,48.0,2.1,25.0,35.7,4.0,0.4,0.2,2,"edge, west"']),
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ inserted: 2, replaced: before });

    const rows = await AssaySample.find({ dataset: 'channel_C' }).sort({ order: 1 }).lean();
    expect(rows.map((r) => r.sample)).toEqual(['T-1', 'T-2']);
    expect(rows[0]).toMatchObject({ LOI: null, CaO: null, MgO: null, lengthM: 1.5, note: '' });
    expect(rows[1]).toMatchObject({ LOI: 2.1, CaO: 0.4, lengthM: 2, note: 'edge, west' });
    expect(await AssaySample.countDocuments({ dataset: { $ne: 'channel_C' } })).toBe(others);

    const audit = await AuditLog.findOne({ entity: 'AssaySample', action: 'import' }).lean();
    expect(audit?.diff).toMatchObject({ dataset: 'channel_C', mode: 'replace', inserted: 2 });
    expect(schedule).toHaveBeenCalled();
  });

  it('accepts columns in any order, a BOM and CRLF line endings', async () => {
    const body = '﻿Fe,sample,Al2O3,Fe2O3,SiO2\r\n30,T-9,3,42.9,50\r\n';
    const res = await importCsv(body);
    expect(res.status).toBe(200);
    const row = await AssaySample.findOne({ dataset: 'channel_C', sample: 'T-9' }).lean();
    expect(row).toMatchObject({ Fe: 30, Fe2O3: 42.9, SiO2: 50, Al2O3: 3, LOI: null });
  });

  it('appends after the existing rows and refuses samples that already exist', async () => {
    const existing = await AssaySample.find({ dataset: 'channel_C' }).sort({ order: 1 }).lean();
    const res = await importCsv(csv(['T-10,50,,30,42.9,3,,,1,']), 'dataset=channel_C&mode=append');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ inserted: 1, replaced: 0 });
    const added = await AssaySample.findOne({ dataset: 'channel_C', sample: 'T-10' }).lean();
    expect(added!.order).toBeGreaterThan(existing.at(-1)!.order);

    const dup = await importCsv(
      csv([`${existing[0]!.sample},50,,30,42.9,3,,,1,`]),
      'dataset=channel_C&mode=append',
    );
    expect(dup.status).toBe(400);
    expect(dup.body.error.details.rows).toEqual([
      { line: 2, errors: [expect.stringMatching(/already exists/)] },
    ]);
  });

  it('rejects the whole file and lists every bad line (Review Focus 3)', async () => {
    const before = await AssaySample.find({ dataset: 'channel_C' }).lean();
    const res = await importCsv(
      csv([
        'T-1,50,,101,42.9,3,,,1,', // line 2: Fe > 100
        ',50,,30,42.9,3,,,1,', // line 3: empty sample
        'T-3,50,,30,42.9,3,,,1,', // line 4: fine
        'T-3,50,,31,44.3,3,,,1,', // line 5: duplicate of line 4
        'T-6,abc,,30,42.9,3,,,1,', // line 6: not a number
        'T-7,50,,30,42.9,3', // line 7: missing cells
      ]),
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const rows = res.body.error.details.rows as { line: number; errors: string[] }[];
    expect(rows.map((r) => r.line)).toEqual([2, 3, 5, 6, 7]);
    expect(rows[0]!.errors).toContain('Fe must be ≤ 100');
    expect(rows[1]!.errors).toContain('sample is required');
    expect(rows[2]!.errors[0]).toMatch(/duplicate.*line 4/i);
    expect(rows[3]!.errors).toContain('SiO2 must be a number');
    expect(rows[4]!.errors[0]).toMatch(/10 cells/);

    const after = await AssaySample.find({ dataset: 'channel_C' }).lean();
    expect(after.map((r) => String(r._id))).toEqual(before.map((r) => String(r._id)));
  });

  it('rejects unknown and missing headers', async () => {
    const unknown = await importCsv(csv(['T-1,50,30,42.9,3'], 'sample,SiO2,Iron,Fe2O3,Al2O3'));
    expect(unknown.status).toBe(400);
    const errors = unknown.body.error.details.formErrors as string[];
    expect(errors.join(' ')).toMatch(/Iron/);
    expect(errors.join(' ')).toMatch(/Fe\b/); // Fe is required and now missing

    const repeated = await importCsv(csv([], 'sample,Fe,Fe,SiO2,Fe2O3,Al2O3'));
    expect(repeated.status).toBe(400);
    expect(repeated.body.error.details.formErrors.join(' ')).toMatch(/more than once/);
  });

  it('rejects an empty file, a bad dataset and a non-CSV body', async () => {
    expect((await importCsv(HEADER)).body.error.details.formErrors[0]).toMatch(/no data rows/i);
    expect((await importCsv(csv(['T-1,50,,30,42.9,3,,,1,']), 'dataset=nope')).status).toBe(400);
    const json = await request(app)
      .post('/api/v1/admin/assay/import?dataset=channel_C')
      .set('Cookie', editor)
      .send({ rows: [] });
    expect(json.status).toBe(415);
  });

  it('refuses bodies over 1 MB', async () => {
    const big = csv([`T-1,50,,30,42.9,3,,,1,${'x'.repeat(1024 * 1024)}`]);
    expect((await importCsv(big)).status).toBe(413);
  });

  it('needs a signed-in editor', async () => {
    const res = await importCsv(csv(['T-1,50,,30,42.9,3,,,1,']), undefined, []);
    expect(res.status).toBe(401);
  });
});

describe('admin sample + summary writes', () => {
  const sampleBody = {
    sample: 'T-100',
    dataset: 'grab_A',
    SiO2: 50,
    Fe: 30,
    Fe2O3: 42.9,
    Al2O3: 3,
  };

  it('creates, edits and hard-deletes a sample, audit-logging each step', async () => {
    const created = await request(app)
      .post('/api/v1/admin/assay/samples')
      .set('Cookie', editor)
      .send(sampleBody);
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ ...sampleBody, LOI: null, note: '' });
    const id = created.body.data.id as string;

    const edited = await request(app)
      .put(`/api/v1/admin/assay/samples/${id}`)
      .set('Cookie', editor)
      .send({ Fe: 31.5, note: 'Re-checked against the report' });
    expect(edited.status).toBe(200);
    expect(edited.body.data).toMatchObject({ Fe: 31.5, SiO2: 50, note: expect.any(String) });

    const removed = await request(app)
      .delete(`/api/v1/admin/assay/samples/${id}`)
      .set('Cookie', editor);
    expect(removed.status).toBe(204);
    expect(await AssaySample.findById(id)).toBeNull();

    const log = await AuditLog.find({ entity: 'AssaySample', entityId: id }).sort({ at: 1 }).lean();
    expect(log.map((l) => l.action)).toEqual(['create', 'update', 'delete']);
    expect(log[1]!.diff).toMatchObject({ Fe: { from: 30, to: 31.5 } });
    expect(log[2]!.diff).toMatchObject({ Fe: { from: 31.5 }, sample: { from: 'T-100' } });
  });

  it('validates numbers and keeps (dataset, sample) unique', async () => {
    const bad = await request(app)
      .post('/api/v1/admin/assay/samples')
      .set('Cookie', editor)
      .send({ ...sampleBody, Fe: 120 });
    expect(bad.status).toBe(400);

    const existing = await AssaySample.findOne({ dataset: 'grab_A' }).lean();
    const dup = await request(app)
      .post('/api/v1/admin/assay/samples')
      .set('Cookie', editor)
      .send({ ...sampleBody, sample: existing!.sample });
    expect(dup.status).toBe(409);

    const unknown = await request(app)
      .put(`/api/v1/admin/assay/samples/${String(existing!._id)}`)
      .set('Cookie', editor)
      .send({ Iron: 3 });
    expect(unknown.status).toBe(400);
  });

  it('editor can edit a sample; anonymous cannot', async () => {
    const row = await AssaySample.findOne({ dataset: 'channel_B' }).lean();
    const path = `/api/v1/admin/assay/samples/${String(row!._id)}`;
    expect((await request(app).put(path).send({ note: 'x' })).status).toBe(401);
    const ok = await request(app).put(path).set('Cookie', editor).send({ note: 'x' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.Fe).toBe(row!.Fe);

    const missing = await request(app)
      .put('/api/v1/admin/assay/samples/665f1c2e9b1e8a0012345678')
      .set('Cookie', editor)
      .send({ note: 'x' });
    expect(missing.status).toBe(404);
  });

  it('lists and edits summary rows; the public summary follows', async () => {
    const list = await request(app).get('/api/v1/admin/assay/summary').set('Cookie', editor);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(6);
    const overall = list.body.data.find((r: { isOverall: boolean }) => r.isOverall);
    expect(overall).toMatchObject({ thicknessM: 62.55, Fe: 23.48 });

    const sectionA = list.body.data.find((r: { section: string }) => r.section === 'A');
    const res = await request(app)
      .put(`/api/v1/admin/assay/summary/${sectionA.id as string}`)
      .set('Cookie', editor)
      .send({ Fe: sectionA.Fe + 0.01 });
    expect(res.status).toBe(200);
    expect(res.body.data.Fe).toBeCloseTo(sectionA.Fe + 0.01, 5);

    const pub = await request(app).get('/api/v1/assay/summary');
    const a = pub.body.data.sections.find((s: { section: string }) => s.section === 'A');
    expect(a.Fe).toBeCloseTo(sectionA.Fe + 0.01, 5);
    const log = await AuditLog.findOne({ entity: 'AssaySummary', action: 'update' }).lean();
    expect(log?.entityId).toBe(sectionA.id);

    const tooHigh = await request(app)
      .put(`/api/v1/admin/assay/summary/${sectionA.id as string}`)
      .set('Cookie', editor)
      .send({ SiO2: 100.5 });
    expect(tooHigh.status).toBe(400);
    const rename = await request(app)
      .put(`/api/v1/admin/assay/summary/${sectionA.id as string}`)
      .set('Cookie', editor)
      .send({ isOverall: true });
    expect(rename.status).toBe(400);
    expect(await AssaySummary.countDocuments({ isOverall: true })).toBe(1);
  });
});
