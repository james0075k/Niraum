import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { storage } from '../src/config/cloudinary.js';
import { env } from '../src/config/env.js';
import { mailer } from '../src/config/mailer.js';
import { Application } from '../src/models/Application.js';
import { Job } from '../src/models/Job.js';
import { Message } from '../src/models/Message.js';
import { Subscriber } from '../src/models/Subscriber.js';
import { captchaService } from '../src/services/captcha.service.js';
import { fixtures, jsonResponse, loginAs } from './helpers.js';

let app: Express;
beforeEach(() => {
  app = createApp();
});

const contact = {
  name: 'Sita Sharma',
  email: 'sita@example.com',
  phone: '+977 9800000000',
  company: 'Himal Cement',
  subject: 'Aggregate supply',
  message: 'We need 2,000 m³ of crushed stone per month.',
};

const mails = () => vi.mocked(mailer.send).mock.calls.map((c) => c[0]);

describe('POST /contact', () => {
  it('saves the message, emails the inbox and auto-replies', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .set('User-Agent', 'vitest')
      .send({ ...contact, website: '' });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toMatch(/^[a-f0-9]{24}$/);

    const msg = await Message.findById(res.body.data.id);
    expect(msg).toMatchObject({ status: 'new', subject: 'Aggregate supply', userAgent: 'vitest' });
    expect(msg?.ip).toBeTruthy();

    await vi.waitFor(() => expect(mailer.send).toHaveBeenCalledTimes(2));
    const [notify, reply] = mails();
    expect(notify).toMatchObject({ to: env.CONTACT_INBOX, replyTo: 'sita@example.com' });
    expect(notify?.subject).toContain('Aggregate supply');
    expect(reply?.to).toBe('sita@example.com');
  });

  it('stores honeypot hits as spam, answers 201 and sends nothing', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ ...contact, website: 'http://spam.biz' });
    expect(res.status).toBe(201);
    expect((await Message.findById(res.body.data.id))?.status).toBe('spam');
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('validates input', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ ...contact, email: 'nope', message: 'short' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details.fieldErrors)).toEqual(
      expect.arrayContaining(['email', 'message']),
    );
  });

  it('rate limits to 5 per hour per IP', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await request(app).post('/api/v1/contact').send(contact)).status).toBe(201);
    }
    const sixth = await request(app).post('/api/v1/contact').send(contact);
    expect(sixth.status).toBe(429);
    expect(sixth.body.error.code).toBe('RATE_LIMITED');
    expect(sixth.headers['ratelimit-policy']).toContain('5;w=3600');
    expect(await Message.countDocuments()).toBe(5);
  });

  it('survives email delivery failures', async () => {
    vi.mocked(mailer.send).mockRejectedValue(new Error('SMTP down'));
    expect((await request(app).post('/api/v1/contact').send(contact)).status).toBe(201);
  });

  it('admin inbox lists messages and updates status', async () => {
    await request(app).post('/api/v1/contact').send(contact);
    const { cookies } = await loginAs(app, 'admin');
    const list = await request(app).get('/api/v1/admin/messages?status=new').set('Cookie', cookies);
    expect(list.body.meta.total).toBe(1);
    const id = list.body.data[0].id as string;
    const read = await request(app)
      .patch(`/api/v1/admin/messages/${id}`)
      .set('Cookie', cookies)
      .send({ status: 'read' });
    expect(read.body.data.status).toBe('read');
    expect(
      (
        await request(app)
          .patch(`/api/v1/admin/messages/${id}`)
          .set('Cookie', cookies)
          .send({ status: 'bogus' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .patch('/api/v1/admin/messages/665f1c2e9b1e8a0012345678')
          .set('Cookie', cookies)
          .send({ status: 'read' })
      ).status,
    ).toBe(404);
  });
});

describe('captcha', () => {
  afterEach(() => {
    env.TURNSTILE_SECRET = undefined;
    env.RECAPTCHA_SECRET = undefined;
  });

  it('verifies Turnstile tokens when a secret is configured', async () => {
    env.TURNSTILE_SECRET = 'turnstile-secret';
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ success: true }))
      .mockResolvedValueOnce(
        jsonResponse({ success: false, 'error-codes': ['invalid-input-response'] }),
      );
    expect(
      (
        await request(app)
          .post('/api/v1/contact')
          .send({ ...contact, captchaToken: 'ok' })
      ).status,
    ).toBe(201);
    expect(String(fetchSpy.mock.calls[0]![0])).toContain('challenges.cloudflare.com');
    const bad = await request(app)
      .post('/api/v1/contact')
      .send({ ...contact, captchaToken: 'bad' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('CAPTCHA_FAILED');
    const missing = await request(app).post('/api/v1/contact').send(contact);
    expect(missing.body.error.code).toBe('CAPTCHA_FAILED');
  });

  it('supports reCAPTCHA v3 scores and handles outages', async () => {
    env.RECAPTCHA_SECRET = 'recaptcha-secret';
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ success: true, score: 0.2 }))
      .mockRejectedValueOnce(new Error('timeout'));
    await expect(captchaService.verify('t', '1.2.3.4')).rejects.toMatchObject({ status: 400 });
    await expect(captchaService.verify('t', '1.2.3.4')).rejects.toMatchObject({ status: 503 });
  });
});

describe('POST /applications', () => {
  beforeEach(() => {
    vi.spyOn(storage, 'upload').mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/raw/authenticated/cv.pdf',
      publicId: 'niraum/applications/cv123',
      resourceType: 'raw',
      bytes: 73,
    });
  });

  const apply = (file: Buffer, mime: string, fields: Record<string, string> = {}) => {
    const req = request(app)
      .post('/api/v1/applications')
      .field('name', 'Ram Thapa')
      .field('email', 'ram@example.com')
      .field('phone', '+977 9811111111')
      .field('message', 'Experienced driller.');
    for (const [k, v] of Object.entries(fields)) void req.field(k, v);
    return req.attach('cv', file, { filename: 'cv.pdf', contentType: mime });
  };

  it('stores a general application with the CV in private storage and emails HR', async () => {
    const res = await apply(fixtures.pdf, 'application/pdf');
    expect(res.status).toBe(201);
    expect(storage.upload).toHaveBeenCalledWith(expect.any(Buffer), {
      subfolder: 'applications',
      resourceType: 'raw',
      private: true,
    });
    const saved = await Application.findById(res.body.data.id);
    expect(saved).toMatchObject({
      jobTitle: 'General application',
      cvPublicId: 'niraum/applications/cv123',
    });
    await vi.waitFor(() => expect(mailer.send).toHaveBeenCalledTimes(2));
    expect(mails()[0]?.subject).toContain('[Careers]');
  });

  it('links the application to an open job by slug', async () => {
    await Job.create({ title: 'Driller', slug: 'driller', isOpen: true });
    await Job.create({ title: 'Closed', slug: 'closed', isOpen: false });
    const ok = await apply(fixtures.pdf, 'application/pdf', { job: 'driller' });
    expect(ok.status).toBe(201);
    expect((await Application.findById(ok.body.data.id))?.jobTitle).toBe('Driller');
    const closed = await apply(fixtures.pdf, 'application/pdf', { job: 'closed' });
    expect(closed.status).toBe(400);
  });

  it('rejects non-PDF files, spoofed MIME types and missing CVs', async () => {
    const png = await apply(fixtures.png, 'image/png');
    expect(png.status).toBe(415);
    const spoofed = await apply(fixtures.exe, 'application/pdf');
    expect(spoofed.status).toBe(415);
    expect(spoofed.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    const none = await request(app)
      .post('/api/v1/applications')
      .field('name', 'Ram Thapa')
      .field('email', 'ram@example.com')
      .field('phone', '+977 9811111111');
    expect(none.status).toBe(400);
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('rejects CVs over 5 MB', async () => {
    const big = Buffer.concat([fixtures.pdf, Buffer.alloc(5 * 1024 * 1024)]);
    const res = await apply(big, 'application/pdf');
    expect(res.status).toBe(413);
  });

  it('honeypot hits are accepted silently and stored nowhere', async () => {
    const res = await apply(fixtures.pdf, 'application/pdf', { website: 'spam' });
    expect(res.status).toBe(201);
    expect(await Application.countDocuments()).toBe(0);
  });

  it('admins list applications, get a signed CV link and update status', async () => {
    vi.spyOn(storage, 'signedUrl').mockReturnValue('https://signed.example/cv');
    const created = await apply(fixtures.pdf, 'application/pdf');
    const id = created.body.data.id as string;
    const { cookies } = await loginAs(app, 'admin');
    const list = await request(app).get('/api/v1/admin/applications').set('Cookie', cookies);
    expect(list.body.data).toHaveLength(1);
    const one = await request(app).get(`/api/v1/admin/applications/${id}`).set('Cookie', cookies);
    expect(one.body.data.cvUrl).toBe('https://signed.example/cv');
    const status = await request(app)
      .patch(`/api/v1/admin/applications/${id}`)
      .set('Cookie', cookies)
      .send({ status: 'shortlisted' });
    expect(status.body.data.status).toBe('shortlisted');
    expect(
      (
        await request(app)
          .get('/api/v1/admin/applications/665f1c2e9b1e8a0012345678')
          .set('Cookie', cookies)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .patch('/api/v1/admin/applications/665f1c2e9b1e8a0012345678')
          .set('Cookie', cookies)
          .send({ status: 'hired' })
      ).status,
    ).toBe(404);
  });

  it('signed CV link is null when storage is not configured', async () => {
    const created = await apply(fixtures.pdf, 'application/pdf');
    const { cookies } = await loginAs(app, 'admin');
    const one = await request(app)
      .get(`/api/v1/admin/applications/${created.body.data.id as string}`)
      .set('Cookie', cookies);
    expect(one.body.data.cvUrl).toBeNull();
  });
});

describe('newsletter (double opt-in)', () => {
  const lastToken = () => /token=([a-f0-9]{64})/.exec(mails().at(-1)?.text ?? '')?.[1] ?? '';

  it('subscribe → confirm → unsubscribe', async () => {
    const res = await request(app).post('/api/v1/newsletter').send({ email: 'Reader@Example.com' });
    expect(res.status).toBe(202);
    expect((await Subscriber.findOne({ email: 'reader@example.com' }))?.status).toBe('pending');

    await vi.waitFor(() => expect(mailer.send).toHaveBeenCalledTimes(1));
    const confirmToken = lastToken();
    const confirm = await request(app).get(`/api/v1/newsletter/confirm?token=${confirmToken}`);
    expect(confirm.status).toBe(303);
    expect(confirm.headers.location).toBe('http://localhost:5173/?newsletter=confirmed');
    expect((await Subscriber.findOne({ email: 'reader@example.com' }))?.status).toBe('subscribed');

    // The confirm link is single-use.
    const reuse = await request(app).get(`/api/v1/newsletter/confirm?token=${confirmToken}`);
    expect(reuse.headers.location).toContain('newsletter=invalid');

    await vi.waitFor(() => expect(mailer.send).toHaveBeenCalledTimes(2));
    const unsubscribeToken = lastToken();
    const out = await request(app).get(`/api/v1/newsletter/unsubscribe?token=${unsubscribeToken}`);
    expect(out.headers.location).toContain('newsletter=unsubscribed');
    expect((await Subscriber.findOne({ email: 'reader@example.com' }))?.status).toBe(
      'unsubscribed',
    );
  });

  it('does not re-email confirmed subscribers and ignores the honeypot', async () => {
    await Subscriber.create({ email: 'done@example.com', status: 'subscribed', tokenHash: 'x' });
    expect(
      (await request(app).post('/api/v1/newsletter').send({ email: 'done@example.com' })).status,
    ).toBe(202);
    expect(
      (
        await request(app)
          .post('/api/v1/newsletter')
          .send({ email: 'bot@example.com', website: 'x' })
      ).status,
    ).toBe(202);
    expect(mailer.send).not.toHaveBeenCalled();
    expect(await Subscriber.countDocuments()).toBe(1);
  });

  it('handles bad or malformed tokens with a redirect', async () => {
    const bad = await request(app).get('/api/v1/newsletter/confirm?token=nope');
    expect(bad.status).toBe(303);
    expect(bad.headers.location).toContain('invalid');
    const badOut = await request(app).get('/api/v1/newsletter/unsubscribe');
    expect(badOut.headers.location).toContain('invalid');
  });
});
