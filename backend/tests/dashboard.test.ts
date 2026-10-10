import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Inquiry } from '../src/models/Inquiry.js';
import { Product } from '../src/models/Product.js';
import { Service } from '../src/models/Service.js';
import { loginAs } from './helpers.js';

describe('GET /admin/dashboard', () => {
  let app: Express;
  beforeEach(async () => {
    app = createApp();
    await Product.create({ name: { en: 'Hematite' }, slug: 'hematite', published: true });
    await Product.create({ name: { en: 'Draft ore' }, slug: 'draft-ore', published: false });
    await Product.create({
      name: { en: 'Deleted ore' },
      slug: 'deleted-ore',
      published: true,
      isDeleted: true,
    });
    await Service.create({ title: { en: 'Haulage' }, slug: 'haulage', published: true });
    await Inquiry.create({
      companyName: 'Acme Cement',
      contactName: 'A. Buyer',
      email: 'buyer@example.com',
      phone: '9800000000',
      buyerType: 'cement',
    });
  });

  it('rejects anonymous callers', async () => {
    await request(app).get('/api/v1/admin/dashboard').expect(401);
  });

  it('gives editors content and assay counts but no inbox or recent keys', async () => {
    const { cookies } = await loginAs(app, 'editor');
    const res = await request(app).get('/api/v1/admin/dashboard').set('Cookie', cookies);
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.content.products).toEqual({ published: 1, draft: 1 });
    expect(d.content.services).toEqual({ published: 1, draft: 0 });
    expect(d.content.deposits).toEqual({ published: 0, draft: 0 });
    expect(d.content.team).toEqual({ published: 0, draft: 0 });
    expect(d.assay).toEqual({ samples: 0, summaries: 0, publicDetail: false });
    expect('inbox' in d).toBe(false);
    expect('recent' in d).toBe(false);
  });

  it('gives admins the inbox counts and recent activity', async () => {
    const { cookies } = await loginAs(app, 'admin');
    const res = await request(app).get('/api/v1/admin/dashboard').set('Cookie', cookies);
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.inbox).toEqual({ inquiriesNew: 1, messagesNew: 0, applicationsNew: 0 });
    expect(d.recent.length).toBeGreaterThan(0);
    expect(d.recent.length).toBeLessThanOrEqual(10);
    expect(d.recent[0]).toMatchObject({ action: 'login' });
  });
});
