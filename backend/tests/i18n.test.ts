import type { Express } from 'express';
import type mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { localizeFields } from '../src/migrations/2026-10-localize-fields.js';
import { Project } from '../src/models/Project.js';
import { SETTINGS_ID, SiteSettings } from '../src/models/SiteSettings.js';
import { loginAs } from './helpers.js';

let app: Express;
let cookies: string[];
beforeEach(async () => {
  app = createApp();
  ({ cookies } = await loginAs(app, 'admin'));
});

const admin = (method: 'get' | 'post' | 'put', path: string) =>
  request(app)[method](`/api/v1/admin${path}`).set('Cookie', cookies);

describe('LocalizedString content (Phase 4.5)', () => {
  it('serves Nepali with ?lang=ne and falls back to English per field', async () => {
    await admin('post', '/projects').send({
      title: { en: 'Katujpani Iron Deposit', ne: 'कटुजपानी फलाम खानी' },
      summary: 'English only summary',
      mineral: 'iron-ore',
      published: true,
    });

    const en = await request(app).get('/api/v1/projects/katujpani-iron-deposit');
    expect(en.body.data.title).toBe('Katujpani Iron Deposit');

    const ne = await request(app).get('/api/v1/projects/katujpani-iron-deposit?lang=ne');
    expect(ne.body.data.title).toBe('कटुजपानी फलाम खानी');
    expect(ne.body.data.summary).toBe('English only summary');

    const list = await request(app).get('/api/v1/projects?lang=ne');
    expect(list.body.data[0].title).toBe('कटुजपानी फलाम खानी');

    // Unknown language → English, not an error.
    const xx = await request(app).get('/api/v1/projects?lang=xx');
    expect(xx.status).toBe(200);
    expect(xx.body.data[0].title).toBe('Katujpani Iron Deposit');
  });

  it('admin keeps English strings, adds translations, and merges without losing Nepali', async () => {
    const created = await admin('post', '/projects').send({
      title: { en: 'Iron Hills', ne: 'फलाम पहाड' },
      mineral: 'iron-ore',
    });
    expect(created.status).toBe(201);
    expect(created.body.data.title).toBe('Iron Hills');
    expect(created.body.data.translations.title).toEqual({ en: 'Iron Hills', ne: 'फलाम पहाड' });

    const id = created.body.data.id as string;
    const updated = await admin('put', `/projects/${id}`).send({ title: 'Iron Hills East' });
    expect(updated.body.data.translations.title).toEqual({
      en: 'Iron Hills East',
      ne: 'फलाम पहाड',
    });

    const cleared = await admin('put', `/projects/${id}`).send({
      title: { en: 'Iron Hills East', ne: '' },
    });
    expect(cleared.body.data.translations.title.ne).toBe('');
  });

  it('sanitises rich text in both languages', async () => {
    const res = await admin('post', '/projects').send({
      title: 'Sanitised',
      mineral: 'iron-ore',
      body: { en: '<p>ok</p><script>x</script>', ne: '<p>ठीक</p><img src=x onerror=y>' },
    });
    expect(res.body.data.translations.body.en).toBe('<p>ok</p>');
    expect(res.body.data.translations.body.ne).not.toContain('onerror');
  });

  it('site settings: localized motto and new Phase 4.5 flags', async () => {
    await admin('put', '/settings').send({
      motto: { en: 'Strength Forged For Generations', ne: 'पुस्तौँसम्म टिक्ने बल' },
      publicAssayDetail: true,
      defaultLanguage: 'en',
    });
    const ne = await request(app).get('/api/v1/settings/public?lang=ne');
    expect(ne.body.data.motto).toBe('पुस्तौँसम्म टिक्ने बल');
    expect(ne.body.data.publicAssayDetail).toBe(true);
    const en = await request(app).get('/api/v1/settings/public');
    expect(en.body.data.motto).toBe('Strength Forged For Generations');
    expect(en.headers.etag).not.toBe(ne.headers.etag);

    const full = await admin('get', '/settings');
    expect(full.body.data.motto).toBe('Strength Forged For Generations');
    expect(full.body.data.translations.motto.ne).toBe('पुस्तौँसम्म टिक्ने बल');
  });
});

describe('migration 2026-10-localize-fields', () => {
  it('wraps legacy strings as { en } and is idempotent', async () => {
    const coll = Project.collection;
    // A document written before Phase 4.5 (plain strings), bypassing the new schema.
    await coll.insertOne({
      title: 'Legacy Project',
      slug: 'legacy-project',
      mineral: 'iron-ore',
      status: 'exploration',
      summary: 'Old summary',
      body: '<p>Old</p>',
      published: true,
      isDeleted: false,
    });
    await SiteSettings.collection.updateOne(
      { _id: SETTINGS_ID as unknown as mongoose.Types.ObjectId },
      { $set: { motto: 'Old motto', footer: { about: 'Old about', links: [] } } },
      { upsert: true },
    );

    const first = await localizeFields();
    expect(first.converted[`${coll.collectionName}.title`]).toBe(1);
    expect(first.converted['sitesettings.footer.about']).toBe(1);

    const raw = await coll.findOne({ slug: 'legacy-project' });
    expect(raw?.title).toEqual({ en: 'Legacy Project' });
    expect(raw?.summary).toEqual({ en: 'Old summary' });
    const settings = await SiteSettings.collection.findOne({});
    expect(settings?.motto).toEqual({ en: 'Old motto' });
    expect(settings?.footer).toMatchObject({ about: { en: 'Old about' } });

    const second = await localizeFields();
    expect(Object.values(second.converted).every((n) => n === 0)).toBe(true);
    expect(second.droppedIndexes).toEqual([]);

    // The migrated document is served normally, and text search still works.
    const pub = await request(app).get('/api/v1/projects/legacy-project');
    expect(pub.body.data.title).toBe('Legacy Project');
    const search = await request(app).get('/api/v1/projects?q=legacy');
    expect(search.body.data).toHaveLength(1);
  });

  it('drops a pre-4.5 text index on the plain fields', async () => {
    const coll = Project.collection;
    const text = (await coll.indexes()).find((i) => (i as { weights?: unknown }).weights);
    if (text?.name) await coll.dropIndex(text.name);
    await coll.createIndex({ title: 'text', summary: 'text' }, { name: 'title_text_summary_text' });

    const report = await localizeFields();
    expect(report.droppedIndexes).toContain(`${coll.collectionName}.title_text_summary_text`);
    const names = (await coll.indexes()).map((i) => i.name);
    expect(names).not.toContain('title_text_summary_text');
  });
});
