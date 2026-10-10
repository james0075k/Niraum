import type { Express } from 'express';
import request from 'supertest';
import { vi } from 'vitest';
import { createApp } from '../src/app.js';
import { mailer } from '../src/config/mailer.js';
import { Inquiry } from '../src/models/Inquiry.js';
import { loginAs } from './helpers.js';

let app: Express;
beforeEach(() => {
  app = createApp();
});

const inquiry = (over: Record<string, unknown> = {}) => ({
  companyName: 'Himal Cement Ltd',
  contactName: 'Sita Sharma',
  email: 'Buyer@Example.com',
  phone: '+977 1 5555555',
  buyerType: 'cement',
  quantity: 500,
  quantityUnit: 'tpm',
  deliveryLocation: 'Hetauda',
  specRequirement: 'Fe2O3 ≥ 40 %',
  message: 'Please quote for monthly supply.',
  lang: 'en',
  sourcePage: '/en/contact',
  ...over,
});

const sent = () => vi.mocked(mailer.send).mock.calls.map(([m]) => m);

describe('POST /inquiries', () => {
  it('stores the inquiry, notifies the inbox and auto-replies in English', async () => {
    const res = await request(app).post('/api/v1/inquiries').send(inquiry());
    expect(res.status).toBe(201);
    const doc = await Inquiry.findById(res.body.data.id).lean();
    expect(doc).toMatchObject({
      email: 'buyer@example.com',
      status: 'new',
      topic: 'supply',
      quantity: 500,
      quantityUnit: 'tpm',
      lang: 'en',
    });
    await vi.waitFor(() => expect(sent()).toHaveLength(2));
    const [toInbox, reply] = sent();
    expect(toInbox?.subject).toMatch(/\[Inquiry\] Bulk supply — Himal Cement Ltd \(Cement plant\)/);
    expect(toInbox?.text).toMatch(/Quantity: 500 tonnes per month/);
    expect(toInbox?.replyTo).toBe('buyer@example.com');
    expect(reply?.to).toBe('buyer@example.com');
    expect(reply?.subject).toMatch(/^We received your inquiry/);
  });

  it('auto-replies in Nepali for /ne visitors', async () => {
    const res = await request(app)
      .post('/api/v1/inquiries')
      .send(inquiry({ lang: 'ne', sourcePage: '/ne/contact', topic: 'technical_report' }));
    expect(res.status).toBe(201);
    await vi.waitFor(() => expect(sent()).toHaveLength(2));
    expect(sent()[1]?.subject).toMatch(/तपाईंको सोधपुछ प्राप्त भयो/);
    expect(sent()[0]?.subject).toMatch(/Full assay report/);
  });

  it('validates required fields and the quantity unit', async () => {
    const missing = await request(app).post('/api/v1/inquiries').send({ email: 'x@y.z' });
    expect(missing.status).toBe(400);
    const noUnit = await request(app)
      .post('/api/v1/inquiries')
      .send(inquiry({ quantityUnit: undefined }));
    expect(noUnit.status).toBe(400);
    expect(noUnit.body.error.details.fieldErrors.quantityUnit).toBeDefined();
    const badType = await request(app)
      .post('/api/v1/inquiries')
      .send(inquiry({ buyerType: 'pirate' }));
    expect(badType.status).toBe(400);
  });

  it('stores honeypot hits as spam without email', async () => {
    const res = await request(app)
      .post('/api/v1/inquiries')
      .send(inquiry({ website: 'http://spam' }));
    expect(res.status).toBe(201);
    expect((await Inquiry.findById(res.body.data.id).lean())?.status).toBe('spam');
    expect(sent()).toHaveLength(0);
  });

  it('allows 5 inquiries per hour per IP', async () => {
    for (let i = 0; i < 5; i += 1) {
      expect((await request(app).post('/api/v1/inquiries').send(inquiry())).status).toBe(201);
    }
    const sixth = await request(app).post('/api/v1/inquiries').send(inquiry());
    expect(sixth.status).toBe(429);
  });
});

describe('admin inquiries', () => {
  it('lists, filters, moves through the pipeline and exports CSV', async () => {
    await request(app).post('/api/v1/inquiries').send(inquiry());
    await request(app)
      .post('/api/v1/inquiries')
      .send(inquiry({ companyName: '=HYPERLINK("x")', buyerType: 'trader' }));
    const { cookies } = await loginAs(app, 'admin');
    const admin = (method: 'get' | 'patch', path: string) =>
      request(app)[method](`/api/v1/admin${path}`).set('Cookie', cookies);

    const all = await admin('get', '/inquiries');
    expect(all.body.meta.total).toBe(2);
    const traders = await admin('get', '/inquiries?buyerType=trader');
    expect(traders.body.data).toHaveLength(1);

    const id = all.body.data[0].id as string;
    const quoted = await admin('patch', `/inquiries/${id}`).send({ status: 'quoted' });
    expect(quoted.body.data.status).toBe('quoted');
    const one = await admin('get', `/inquiries/${id}`);
    expect(one.body.data.status).toBe('quoted');

    const csv = await admin('get', '/inquiries/export.csv');
    expect(csv.headers['content-type']).toMatch(/text\/csv/);
    expect(csv.text.startsWith('\uFEFFid,createdAt,status')).toBe(true);
    expect(csv.text).toContain('"\'=HYPERLINK(""x"")"'); // formula neutralised
  });

  it('is admin-only', async () => {
    const { cookies } = await loginAs(app, 'editor');
    const res = await request(app).get('/api/v1/admin/inquiries').set('Cookie', cookies);
    expect(res.status).toBe(403);
  });
});
