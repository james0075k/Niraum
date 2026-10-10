import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AssaySample } from '../src/models/AssaySample.js';
import { AssaySummary } from '../src/models/AssaySummary.js';
import { weightedAverage } from '../src/services/assay.service.js';
import { loadAssayData, seedAssay } from '../src/seed/assay.seed.js';
import {
  HEMATITE_SLUG,
  KATUJPANI_SLUG,
  seedFounder,
  seedKatujpani,
  seedProduct,
  seedSiteText,
} from '../src/seed/katujpani.seed.js';
import { Deposit } from '../src/models/Deposit.js';
import { SETTINGS_ID, SiteSettings } from '../src/models/SiteSettings.js';
import { loginAs } from './helpers.js';

const data = loadAssayData();

describe('assay data (docs/content/data/assay_data.json)', () => {
  it('length-weighted averages over the five sections match Table 14 (±0.02)', () => {
    const rows = data.weighted_by_section;
    const avg = (field: 'Fe' | 'Fe2O3' | 'SiO2' | 'Al2O3') =>
      weightedAverage(
        rows,
        (r) => r.thickness_m,
        (r) => r[field],
      );
    expect(rows.reduce((s, r) => s + r.thickness_m, 0)).toBeCloseTo(62.55, 2);
    expect(Math.abs(avg('Fe') - 23.48)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(avg('Fe2O3') - 33.59)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(avg('SiO2') - 53.05)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(avg('Al2O3') - 3.22)).toBeLessThanOrEqual(0.02);
  });

  it('section B and K/X/Y channel rows reproduce their Table 14 grades', () => {
    const check = (rows: { length_m?: number; Fe: number; Fe2O3: number }[], section: string) => {
      const t14 = data.weighted_by_section.find((s) => s.section === section)!;
      const w = (r: { length_m?: number }) => r.length_m ?? 0;
      expect(Math.abs(weightedAverage(rows, w, (r) => r.Fe) - t14.Fe)).toBeLessThanOrEqual(0.02);
      expect(Math.abs(weightedAverage(rows, w, (r) => r.Fe2O3) - t14.Fe2O3)).toBeLessThanOrEqual(
        0.02,
      );
      expect(rows.reduce((s, r) => s + w(r), 0)).toBeCloseTo(t14.thickness_m, 2);
    };
    check(data.channel_section_B, 'B');
    check(data.channel_section_KXY, 'K, X, Y');
  });
});

describe('assay API', () => {
  let app: Express;
  beforeEach(async () => {
    app = createApp();
    await seedAssay(data);
  });

  it('seeds idempotently', async () => {
    const again = await seedAssay(data);
    expect(await AssaySummary.countDocuments()).toBe(again.summaries);
    expect(await AssaySample.countDocuments()).toBe(again.samples);
    expect(again.summaries).toBe(6);
    expect(again.samples).toBe(63);
  });

  it('GET /assay/summary returns sections, the deposit average and headline figures', async () => {
    const res = await request(app).get('/api/v1/assay/summary');
    expect(res.status).toBe(200);
    const { sections, overall, highlights, source } = res.body.data;
    expect(sections.map((s: { section: string }) => s.section)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'K, X, Y',
    ]);
    expect(overall).toMatchObject({ thicknessM: 62.55, Fe: 23.48, Fe2O3: 33.59, SiO2: 53.05 });
    expect(highlights.highestSample).toMatchObject({ sample: 'N-2', Fe: 41.87, Fe2O3: 59.85 });
    expect(highlights.grabBC).toEqual({ n: 20, Fe2O3: 44.88 });
    expect(source.disclaimer).toMatch(/not a JORC\/NI 43-101 reserve statement/);
  });

  it('keeps sample rows private until publicAssayDetail is switched on', async () => {
    const hidden = await request(app).get('/api/v1/assay/samples');
    expect(hidden.status).toBe(403);

    const { cookies } = await loginAs(app, 'admin');
    const adminRows = await request(app)
      .get('/api/v1/admin/assay/samples?dataset=grab_B_C&sort=-Fe')
      .set('Cookie', cookies);
    expect(adminRows.body.data).toHaveLength(20);
    expect(adminRows.body.data[0].sample).toBe('N-2');

    await request(app)
      .put('/api/v1/admin/settings')
      .set('Cookie', cookies)
      .send({ publicAssayDetail: true });
    const open = await request(app).get('/api/v1/assay/samples?dataset=channel_B');
    expect(open.status).toBe(200);
    expect(open.body.data).toHaveLength(12);
    expect(open.body.data[0]).toMatchObject({ sample: 'CH-B-1', lengthM: 0.6 });
  });

  it('flags the stamped DM-9 reading', async () => {
    const dm9 = await AssaySample.findOne({ dataset: 'grab_A', sample: 'DM-9' }).lean();
    expect(dm9?.note).toMatch(/stamp/);
  });
});

describe('Katujpani deposit, product and founder seeds', () => {
  it('creates them once and serves them publicly in both languages', async () => {
    const app = createApp();
    expect(await seedKatujpani()).toBe('created');
    expect(await seedKatujpani()).toBe('exists');
    expect(await seedProduct()).toBe('created');
    expect(await seedFounder()).toBe('created');
    expect(await seedFounder()).toBe('exists');

    const deposit = await request(app).get(`/api/v1/deposits/${KATUJPANI_SLUG}?lang=ne`);
    expect(deposit.status).toBe(200);
    expect(deposit.body.data.name).toBe('कटुजपानी फलाम निक्षेप');
    expect(deposit.body.data.location.district).toBe('मकवानपुर');
    const depositEn = await request(app).get(`/api/v1/deposits/${KATUJPANI_SLUG}`);
    expect(depositEn.body.data.name).toBe('Katujpani Iron Deposit');
    expect(deposit.body.data.location).toMatchObject({
      topoSheet: '2785 10A',
      easting: 627755,
      northing: 3033300,
      spotHeightM: 914,
      lat: null,
      lng: null,
    });
    expect(deposit.body.data.land.confirmed).toBe(false);
    expect(deposit.body.data.areas.map((a: { code: string }) => a.code)).toEqual(['A', 'B', 'C']);

    const product = await request(app).get(`/api/v1/products/${HEMATITE_SLUG}`);
    expect(product.body.data.typicalChemistry[0]).toMatchObject({ oxide: 'Fe₂O₃', value: 33.59 });
    expect(product.body.data.applications[0].title).toBe('Cement industry — iron corrective');
    expect(JSON.stringify(product.body.data)).not.toMatch(/high[- ]grade/i);

    const team = await request(app).get('/api/v1/team');
    const founder = team.body.data.find((m: { isFounder: boolean }) => m.isFounder);
    expect(founder).toMatchObject({ name: 'Shivahari Pudasaini', role: 'Founder' });
    expect(founder.otherVentures).toHaveLength(5);
  });
});

describe('Nepali fill-in for content seeded before translations existed', () => {
  it('adds missing Nepali without overwriting edited English, then reports "exists"', async () => {
    // A pre-translation deposit: English only, with an admin-edited summary.
    await Deposit.create({
      name: 'Katujpani Iron Deposit',
      slug: KATUJPANI_SLUG,
      summary: 'Edited by an admin.',
      location: {
        district: 'Makawanpur',
        municipality: 'Bakaiya Gaupalika',
        province: 'Bagmati Province',
      },
      areas: [{ code: 'A', label: 'Area A' }],
      published: true,
    });
    expect(await seedKatujpani()).toBe('translated');
    const doc = await Deposit.findOne({ slug: KATUJPANI_SLUG }).lean();
    expect(doc?.summary).toMatchObject({
      en: 'Edited by an admin.',
      ne: expect.stringContaining('बकैया'),
    });
    expect(doc?.location.district).toEqual({ en: 'Makawanpur', ne: 'मकवानपुर' });
    expect(await seedKatujpani()).toBe('exists');
  });

  it('sets the Nepali motto and the blueprint email on placeholder settings', async () => {
    await SiteSettings.create({ _id: SETTINGS_ID });
    expect(await seedSiteText()).toEqual(['motto.ne', 'contact.email']);
    const s = await SiteSettings.findById(SETTINGS_ID).lean();
    expect(s?.motto).toEqual({
      en: 'Strength Forged For Generations',
      ne: 'पुस्तौँसम्म टिक्ने बल',
    });
    expect(s?.contact.email).toEqual(['niraummetals@gmail.com']);
    expect(await seedSiteText()).toEqual([]);
  });
});
