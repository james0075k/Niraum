import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { GeocodeCache } from '../src/models/GeocodeCache.js';
import { SiteSettings } from '../src/models/SiteSettings.js';
import { addressToQuery, geocodeService } from '../src/services/geocode.service.js';
import { Post } from '../src/models/Post.js';
import { Project } from '../src/models/Project.js';
import { seedAdmin, seedContent, seedSettings } from '../src/seed/index.js';
import { User } from '../src/models/User.js';
import { jsonResponse, loginAs } from './helpers.js';

let app: Express;
let cookies: string[];
beforeEach(async () => {
  app = createApp();
  ({ cookies } = await loginAs(app, 'admin'));
});

const nominatim = (lat: string, lon: string) =>
  jsonResponse([{ lat, lon, display_name: 'Somewhere, Nepal' }]);

describe('GET /settings/public', () => {
  it('returns defaults with only public fields', async () => {
    const res = await request(app).get('/api/v1/settings/public');
    expect(res.status).toBe(200);
    const s = res.body.data;
    expect(s.companyName).toBe('Niraum Metals');
    expect(s.address.line1).toBe('Lalitpur-13');
    expect(s.location).toEqual({ lat: 27.6588, lng: 85.3247, zoom: 14, approximate: true });
    expect(s.location.manualOverride).toBeUndefined();
    expect(s.updatedBy).toBeUndefined();
    expect(s._id).toBeUndefined();
  });

  it('filters inactive socials and sorts by order', async () => {
    await SiteSettings.create({
      _id: 'site',
      social: [
        { platform: 'youtube', url: 'https://youtube.com/@n', isActive: true, order: 3 },
        { platform: 'facebook', url: 'https://facebook.com/n', isActive: false, order: 1 },
        { platform: 'linkedin', url: 'https://linkedin.com/company/n', isActive: true, order: 2 },
      ],
    });
    const res = await request(app).get('/api/v1/settings/public');
    expect(res.body.data.social.map((s: { platform: string }) => s.platform)).toEqual([
      'linkedin',
      'youtube',
    ]);
  });

  it('sends an ETag and answers If-None-Match with 304; updates bust the cache', async () => {
    const first = await request(app).get('/api/v1/settings/public');
    const etag = first.headers.etag as string;
    expect(etag).toMatch(/^".+"$/);
    expect(first.headers['cache-control']).toContain('max-age=60');

    const cached = await request(app).get('/api/v1/settings/public').set('If-None-Match', etag);
    expect(cached.status).toBe(304);

    await request(app)
      .put('/api/v1/admin/settings')
      .set('Cookie', cookies)
      .send({ motto: 'New motto' });
    const fresh = await request(app).get('/api/v1/settings/public').set('If-None-Match', etag);
    expect(fresh.status).toBe(200);
    expect(fresh.body.data.motto).toBe('New motto');
    expect(fresh.headers.etag).not.toBe(etag);
  });
});

describe('PUT /admin/settings + geocoding', () => {
  it('geocodes a changed address via Nominatim with the right parameters', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(nominatim('27.6700', '85.3200'));
    const res = await request(app)
      .put('/api/v1/admin/settings')
      .set('Cookie', cookies)
      .send({ address: { line1: 'Jhamsikhel Road' } });
    expect(res.status).toBe(200);
    expect(res.body.meta.warnings).toEqual([]);
    expect(res.body.data.location).toMatchObject({ lat: 27.67, lng: 85.32, approximate: false });
    expect(res.body.data.address).toMatchObject({ line1: 'Jhamsikhel Road', city: 'Lalitpur' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0]!;
    const u = new URL(String(url));
    expect(u.pathname).toBe('/search');
    expect(u.searchParams.get('format')).toBe('json');
    expect(u.searchParams.get('limit')).toBe('1');
    expect(u.searchParams.get('countrycodes')).toBe('np');
    expect(u.searchParams.get('q')).toBe('Jhamsikhel Road, Lalitpur, Bagmati, Nepal');
    expect((init?.headers as Record<string, string>)['User-Agent']).toMatch(/NiraumMetals/);
  });

  it('keeps old coordinates and warns when geocoding fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
    const res = await request(app)
      .put('/api/v1/admin/settings')
      .set('Cookie', cookies)
      .send({ address: { line1: 'Somewhere New' } });
    expect(res.status).toBe(200);
    expect(res.body.data.location).toMatchObject({ lat: 27.6588, lng: 85.3247 });
    expect(res.body.meta.warnings[0].code).toBe('GEOCODE_FAILED');
    expect(res.body.data.address.line1).toBe('Somewhere New');
  });

  it('falls back to a city-level, approximate match', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(nominatim('27.66', '85.32'));
    const res = await request(app)
      .put('/api/v1/admin/settings')
      .set('Cookie', cookies)
      .send({ address: { line1: 'Unknown Ward 99' } });
    expect(res.body.data.location).toMatchObject({ lat: 27.66, approximate: true });
    expect(res.body.meta.warnings[0].code).toBe('GEOCODE_APPROXIMATE');
  }, 10_000);

  it('reports not_found when nothing matches', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse([]));
    const res = await request(app)
      .put('/api/v1/admin/settings')
      .set('Cookie', cookies)
      .send({ address: { line1: 'Nowhere 1' } });
    expect(res.body.meta.warnings[0]).toMatchObject({ code: 'GEOCODE_FAILED' });
    expect(res.body.meta.warnings[0].message).toMatch(/could not be located/);
  }, 10_000);

  it('never moves a manually placed pin when the address changes', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const pin = await request(app)
      .put('/api/v1/admin/settings')
      .set('Cookie', cookies)
      .send({ location: { lat: 27.68, lng: 85.31, manualOverride: true } });
    expect(pin.body.data.location).toMatchObject({ lat: 27.68, lng: 85.31, approximate: false });

    const moved = await request(app)
      .put('/api/v1/admin/settings')
      .set('Cookie', cookies)
      .send({ address: { line1: 'Another Street' } });
    expect(moved.body.data.location).toMatchObject({
      lat: 27.68,
      lng: 85.31,
      manualOverride: true,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not geocode when the address is unchanged', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await request(app)
      .put('/api/v1/admin/settings')
      .set('Cookie', cookies)
      .send({ address: { line1: 'Lalitpur-13' }, officeHours: 'Sun–Fri 10:00–17:00' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('validates input and rejects unknown fields', async () => {
    const bad = await request(app)
      .put('/api/v1/admin/settings')
      .set('Cookie', cookies)
      .send({ social: [{ platform: 'myspace', url: 'https://x.y' }] });
    expect(bad.status).toBe(400);
    const unknown = await request(app)
      .put('/api/v1/admin/settings')
      .set('Cookie', cookies)
      .send({ hacked: true });
    expect(unknown.status).toBe(400);
    const halfPin = await request(app)
      .put('/api/v1/admin/settings')
      .set('Cookie', cookies)
      .send({ location: { lat: 27 } });
    expect(halfPin.status).toBe(400);
  });

  it('merges nested sections and writes an audit entry', async () => {
    const res = await request(app)
      .put('/api/v1/admin/settings')
      .set('Cookie', cookies)
      .send({
        contact: { phone: ['+977 1 5555555'] },
        seo: { keywords: ['iron ore', 'nepal'] },
        footer: { about: 'About us' },
        logo: { light: 'https://res.cloudinary.com/x/logo.svg' },
        theme: { defaultMode: 'dark' },
      });
    expect(res.body.data.contact.phone).toEqual(['+977 1 5555555']);
    expect(res.body.data.contact.email).toEqual(['[PLACEHOLDER: email]']);
    expect(res.body.data.seo.defaultTitle).toMatch(/Niraum/);
    expect(res.body.data.logo).toEqual({
      light: 'https://res.cloudinary.com/x/logo.svg',
      dark: null,
    });

    const audit = await request(app)
      .get('/api/v1/admin/audit?entity=SiteSettings')
      .set('Cookie', cookies);
    expect(audit.body.data).toHaveLength(1);
    expect(Object.keys(audit.body.data[0].diff)).toEqual(
      expect.arrayContaining(['contact', 'seo', 'theme']),
    );
  });

  it('GET /admin/settings returns the full document', async () => {
    const res = await request(app).get('/api/v1/admin/settings').set('Cookie', cookies);
    expect(res.body.data.location.manualOverride).toBe(false);
    expect(res.headers['cache-control']).toBe('no-store');
  });
});

describe('POST /admin/settings/geocode (preview)', () => {
  it('returns coordinates without saving', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(nominatim('27.7', '85.3'));
    const res = await request(app)
      .post('/api/v1/admin/settings/geocode')
      .set('Cookie', cookies)
      .send({ address: { line1: 'Pulchowk' } });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ ok: true, lat: 27.7, lng: 85.3, cached: false });
    const stored = await SiteSettings.findById('site');
    expect(stored?.location.lat).toBe(27.6588);
  });
});

describe('geocode service', () => {
  it('caches results for 30 days and serves repeats from the cache', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(nominatim('27.1', '85.1'));
    const a = await geocodeService.search('Patan Durbar Square');
    const b = await geocodeService.search('  patan   durbar square ');
    expect(a).toMatchObject({ lat: 27.1, cached: false });
    expect(b).toMatchObject({ lat: 27.1, cached: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const indexes = await GeocodeCache.collection.indexes();
    const ttl = indexes.find((i) => i.expireAfterSeconds !== undefined);
    expect(ttl?.expireAfterSeconds).toBe(60 * 60 * 24 * 30);
  });

  it('spaces Nominatim requests at least 1 s apart', async () => {
    const times: number[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      times.push(Date.now());
      return nominatim('27', '85');
    });
    await Promise.all([geocodeService.search('place a'), geocodeService.search('place b')]);
    expect(times).toHaveLength(2);
    expect(times[1]! - times[0]!).toBeGreaterThanOrEqual(990);
  }, 10_000);

  it('treats HTTP errors as unavailable and bad coordinates as no match', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ error: 'rate limited' }, 429))
      .mockResolvedValueOnce(jsonResponse([{ lat: 'x', lon: 'y' }]));
    const down = await geocodeService.geocodeAddress({ line1: 'A', country: 'Nepal' });
    expect(down).toMatchObject({ ok: false, reason: 'unavailable' });
    expect(await geocodeService.search('weird place')).toBeNull();
  }, 10_000);

  it('builds queries without empty or duplicate parts', () => {
    expect(
      addressToQuery({
        line1: 'Lalitpur-13',
        city: 'Lalitpur',
        district: 'Lalitpur',
        province: '',
        country: 'Nepal',
      }),
    ).toBe('Lalitpur-13, Lalitpur, Nepal');
    expect(addressToQuery({ line1: 'X', city: 'Lalitpur', country: 'Nepal' }, false)).toBe(
      'Lalitpur, Nepal',
    );
  });
});

describe('seed', () => {
  it('creates the superadmin once, forcing a password change', async () => {
    expect(await seedAdmin()).toBe('skipped'); // no SEED_ADMIN_* in the test env
    const { env } = await import('../src/config/env.js');
    env.SEED_ADMIN_EMAIL = 'owner@example.com';
    env.SEED_ADMIN_PASSWORD = 'initial-password-123';
    try {
      expect(await seedAdmin()).toBe('created');
      expect(await seedAdmin()).toBe('exists');
      const owner = await User.findOne({ email: 'owner@example.com' });
      expect(owner).toMatchObject({ role: 'superadmin', mustChangePassword: true });
    } finally {
      env.SEED_ADMIN_EMAIL = undefined;
      env.SEED_ADMIN_PASSWORD = undefined;
    }
  });

  it('geocodes Lalitpur-13 and leaves the pin for the admin to confirm', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(nominatim('27.6766', '85.3166'));
    expect(await seedSettings()).toMatch(/geocoded/);
    const s = await SiteSettings.findById('site');
    expect(s?.location).toMatchObject({ lat: 27.6766, approximate: true });
    expect(await seedSettings()).toBe('unchanged');
  });

  it('keeps the fallback pin if geocoding fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    expect(await seedSettings()).toMatch(/kept fallback/);
  });

  it('fills empty collections with sample content the public API serves', async () => {
    expect(await seedContent()).toEqual({ services: 4, projects: 4, posts: 3 });
    expect(await seedContent()).toEqual({
      services: 'exists',
      projects: 'exists',
      posts: 'exists',
    });

    const projects = await request(app).get('/api/v1/projects');
    expect(projects.body.meta.total).toBe(4);
    expect(projects.body.data[0]).toMatchObject({
      isSample: true,
      coverImage: { src: expect.stringMatching(/^\/images\/[a-z0-9-]+\.jpg$/) },
    });
    const posts = await request(app).get('/api/v1/posts');
    expect(posts.body.data[0].slug).toBe('how-iron-ore-exploration-starts'); // newest first
    expect((await request(app).get('/api/v1/services')).body.data).toHaveLength(4);
  });

  it('seeded content passes the admin validators unchanged', async () => {
    await seedContent();
    const doc = await Project.findOne({ slug: 'hillside-aggregate-quarry' }).lean();
    const { title, mineral, status, location, summary, body, facts, coverImage, gallery } = doc!;
    const res = await request(app)
      .put(`/api/v1/admin/projects/${String(doc!._id)}`)
      .set('Cookie', cookies)
      .send({ title, mineral, status, location, summary, body, facts, coverImage, gallery });
    expect(res.status).toBe(200);
  });

  it('never re-seeds a collection whose samples were deleted', async () => {
    await Post.create({ title: 'Gone', slug: 'gone', isDeleted: true, deletedAt: new Date() });
    expect((await seedContent()).posts).toBe('exists');
  });
});
