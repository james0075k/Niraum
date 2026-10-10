import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { rebuild } from '../src/jobs/rebuild.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { Job } from '../src/models/Job.js';
import { loginAs } from './helpers.js';

let app: Express;
let cookies: string[];
beforeEach(async () => {
  app = createApp();
  ({ cookies } = await loginAs(app, 'editor'));
});

const admin = (method: 'get' | 'post' | 'put' | 'delete', path: string) =>
  request(app)[method](`/api/v1/admin${path}`).set('Cookie', cookies);

const project = (over: Record<string, unknown> = {}) => ({
  title: 'Iron Ore Exploration',
  mineral: 'iron-ore',
  status: 'exploration',
  summary: 'Early-stage exploration of an iron ore prospect.',
  body: '<p>Hello</p>',
  ...over,
});

describe('projects CRUD', () => {
  it('creates with an auto-generated unique slug', async () => {
    const a = await admin('post', '/projects').send(project());
    const b = await admin('post', '/projects').send(project());
    const c = await admin('post', '/projects').send(project({ title: 'Ünïcode & Spaces — Test!' }));
    expect(a.status).toBe(201);
    expect(a.body.data.slug).toBe('iron-ore-exploration');
    expect(b.body.data.slug).toBe('iron-ore-exploration-2');
    expect(c.body.data.slug).toBe('unicode-and-spaces-test');
    expect(a.body.data.id).toMatch(/^[a-f0-9]{24}$/);
  });

  it('sanitises rich-text HTML on save', async () => {
    const res = await admin('post', '/projects').send(
      project({
        body: '<p onclick="x()">Hi<script>alert(1)</script><a href="javascript:x">l</a></p>',
      }),
    );
    expect(res.body.data.body).toBe('<p>Hi<a rel="noopener noreferrer">l</a></p>');
  });

  it('public routes only show published, non-deleted items', async () => {
    const draft = await admin('post', '/projects').send(project({ title: 'Draft One' }));
    await admin('post', '/projects').send(project({ title: 'Live One', published: true }));

    const pub = await request(app).get('/api/v1/projects');
    expect(pub.status).toBe(200);
    expect(pub.body.data.map((p: { slug: string }) => p.slug)).toEqual(['live-one']);
    expect(pub.body.meta).toEqual({ page: 1, limit: 20, total: 1, pages: 1 });
    expect(pub.body.data[0].isDeleted).toBeUndefined();
    expect(pub.body.data[0].createdBy).toBeUndefined();
    expect(pub.headers['cache-control']).toContain('max-age=60');

    expect((await request(app).get('/api/v1/projects/live-one')).status).toBe(200);
    const hidden = await request(app).get(`/api/v1/projects/${draft.body.data.slug as string}`);
    expect(hidden.status).toBe(404);
    expect(hidden.body.error.code).toBe('NOT_FOUND');

    const all = await admin('get', '/projects');
    expect(all.body.meta.total).toBe(2);
    const drafts = await admin('get', '/projects?state=draft');
    expect(drafts.body.data).toHaveLength(1);
    const live = await admin('get', '/projects?state=published');
    expect(live.body.data[0].slug).toBe('live-one');
  });

  it('publishing sets publishedAt and writes create/update/publish audit entries', async () => {
    const created = await admin('post', '/projects').send(project());
    const id = created.body.data.id as string;
    expect(created.body.data.publishedAt).toBeNull();

    const published = await admin('put', `/projects/${id}`).send({
      published: true,
      summary: 'Updated',
    });
    expect(published.status).toBe(200);
    expect(published.body.data.publishedAt).not.toBeNull();
    // Title edits keep the slug (stable URLs) unless a slug is sent explicitly.
    const renamed = await admin('put', `/projects/${id}`).send({ title: 'Renamed Project' });
    expect(renamed.body.data.slug).toBe('iron-ore-exploration');
    const reslug = await admin('put', `/projects/${id}`).send({ slug: 'new-slug' });
    expect(reslug.body.data.slug).toBe('new-slug');

    const actions = (await AuditLog.find({ entity: 'Project', entityId: id }).lean()).map(
      (a) => a.action,
    );
    expect(actions).toEqual(expect.arrayContaining(['create', 'update', 'publish']));
    const update = await AuditLog.findOne({ entity: 'Project', action: 'update' }).lean();
    expect(update?.diff).toHaveProperty('summary');

    const unpub = await admin('put', `/projects/${id}`).send({ published: false });
    expect(unpub.status).toBe(200);
    expect(await AuditLog.countDocuments({ action: 'unpublish' })).toBe(1);
  });

  it('soft-deletes to the trash and restores', async () => {
    const created = await admin('post', '/projects').send(project({ published: true }));
    const id = created.body.data.id as string;

    expect((await admin('delete', `/projects/${id}`)).status).toBe(204);
    expect((await admin('delete', `/projects/${id}`)).status).toBe(204); // idempotent
    expect((await request(app).get('/api/v1/projects')).body.data).toHaveLength(0);
    expect((await admin('get', '/projects')).body.data).toHaveLength(0);
    expect((await admin('get', '/projects?trash=true')).body.data).toHaveLength(1);
    expect((await admin('get', `/projects/${id}`)).body.data.isDeleted).toBe(true);

    // The slug stays reserved while in the trash.
    const again = await admin('post', '/projects').send(project());
    expect(again.body.data.slug).toBe('iron-ore-exploration-2');

    const restored = await admin('post', `/projects/${id}/restore`);
    expect(restored.body.data.isDeleted).toBe(false);
    expect((await request(app).get('/api/v1/projects')).body.data).toHaveLength(1);
    expect(await AuditLog.countDocuments({ action: { $in: ['delete', 'restore'] } })).toBe(2);
  });

  it('filters, searches, sorts and paginates', async () => {
    await admin('post', '/projects').send(
      project({
        title: 'Granite Quarry',
        mineral: 'stone-aggregates',
        published: true,
        featured: true,
      }),
    );
    await admin('post', '/projects').send(
      project({
        title: 'Copper Prospect',
        mineral: 'metal-minerals',
        published: true,
        summary: 'Copper showing',
      }),
    );
    await admin('post', '/projects').send(
      project({ title: 'Iron Hills', published: true, status: 'operating' }),
    );

    const byMineral = await request(app).get('/api/v1/projects?mineral=stone-aggregates');
    expect(byMineral.body.data.map((p: { title: string }) => p.title)).toEqual(['Granite Quarry']);
    const featured = await request(app).get('/api/v1/projects?featured=true');
    expect(featured.body.data).toHaveLength(1);
    const operating = await request(app).get('/api/v1/projects?status=operating');
    expect(operating.body.data[0].title).toBe('Iron Hills');

    const search = await request(app).get('/api/v1/projects?q=copper');
    expect(search.body.data.map((p: { title: string }) => p.title)).toEqual(['Copper Prospect']);
    expect(search.body.data[0].score).toBeUndefined();

    const sorted = await request(app).get('/api/v1/projects?sort=title');
    expect(sorted.body.data.map((p: { title: string }) => p.title)).toEqual([
      'Copper Prospect',
      'Granite Quarry',
      'Iron Hills',
    ]);
    // Unknown sort fields fall back to the default order instead of erroring.
    expect((await request(app).get('/api/v1/projects?sort=-passwordHash')).status).toBe(200);

    const page2 = await request(app).get('/api/v1/projects?limit=2&page=2&sort=title');
    expect(page2.body.meta).toEqual({ page: 2, limit: 2, total: 3, pages: 2 });
    expect(page2.body.data).toHaveLength(1);
  });

  it('error paths: validation, bad id, missing id, unknown fields, limit cap', async () => {
    const invalid = await admin('post', '/projects').send({ title: 'X', mineral: 'gold' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details.fieldErrors).toHaveProperty('mineral');
    expect(invalid.body.error.details.fieldErrors).toHaveProperty('title');

    expect((await admin('get', '/projects/not-an-id')).status).toBe(400);
    expect(
      (await admin('put', '/projects/665f1c2e9b1e8a0012345678').send({ title: 'Nope' })).status,
    ).toBe(404);
    expect((await admin('delete', '/projects/665f1c2e9b1e8a0012345678')).status).toBe(404);
    expect((await admin('post', '/projects/665f1c2e9b1e8a0012345678/restore')).status).toBe(404);

    const created = await admin('post', '/projects').send(project());
    const extra = await admin('put', `/projects/${created.body.data.id as string}`).send({
      isDeleted: true,
    });
    expect(extra.status).toBe(400);

    expect((await request(app).get('/api/v1/projects?limit=500')).status).toBe(400);
    expect((await request(app).get('/api/v1/projects/BAD_SLUG!')).status).toBe(400);

    const badImage = await admin('post', '/projects').send(
      project({ coverImage: { src: 'javascript:alert(1)' } }),
    );
    expect(badImage.status).toBe(400);
  });

  it('schedules a frontend rebuild when published content changes', async () => {
    const spy = vi.spyOn(rebuild, 'schedule');
    await admin('post', '/projects').send(project()); // draft — no rebuild
    expect(spy).not.toHaveBeenCalled();
    await admin('post', '/projects').send(project({ published: true }));
    expect(spy).toHaveBeenCalledWith('Project created');
  });
});

describe('posts, jobs, team, services', () => {
  it('posts: tag filter, publishedAt order, text search on title + excerpt', async () => {
    await admin('post', '/posts').send({
      title: 'Older news',
      excerpt: 'Safety drill',
      tags: ['Safety'],
      published: true,
      publishedAt: '2026-01-01',
    });
    await admin('post', '/posts').send({
      title: 'Newer news',
      excerpt: 'Community meeting',
      tags: ['community'],
      published: true,
      publishedAt: '2026-06-01',
    });
    await admin('post', '/posts').send({ title: 'Draft news', published: false });

    const all = await request(app).get('/api/v1/posts');
    expect(all.body.data.map((p: { title: string }) => p.title)).toEqual([
      'Newer news',
      'Older news',
    ]);
    const tagged = await request(app).get('/api/v1/posts?tag=safety');
    expect(tagged.body.data).toHaveLength(1);
    const search = await request(app).get('/api/v1/posts?q=community');
    expect(search.body.data[0].title).toBe('Newer news');
    expect((await request(app).get('/api/v1/posts/newer-news')).body.data.author).toBe(
      'Niraum Metals',
    );
  });

  it('jobs: closed or past-deadline jobs are hidden publicly', async () => {
    const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
    await admin('post', '/jobs').send({
      title: 'Mine Geologist',
      department: 'Exploration',
      isOpen: true,
      deadline: future,
    });
    await admin('post', '/jobs').send({ title: 'Driver', isOpen: true, deadline: null });
    await admin('post', '/jobs').send({ title: 'Closed Role', isOpen: false });
    const expired = await admin('post', '/jobs').send({
      title: 'Expired Role',
      isOpen: true,
      deadline: future,
    });
    await Job.updateOne({ _id: expired.body.data.id }, { deadline: new Date(Date.now() - 1000) });

    const pub = await request(app).get('/api/v1/jobs');
    expect(pub.body.data.map((j: { title: string }) => j.title).sort()).toEqual([
      'Driver',
      'Mine Geologist',
    ]);
    expect((await request(app).get('/api/v1/jobs/expired-role')).status).toBe(404);
    const dept = await request(app).get('/api/v1/jobs?department=exploration');
    expect(dept.body.data).toHaveLength(1);
    expect(
      (await request(app).get('/api/v1/jobs/mine-geologist')).body.data.publishedAt,
    ).not.toBeNull();
  });

  it('team: ordered by `order`, unpublished hidden, no slug route', async () => {
    await admin('post', '/team').send({ name: 'Second Person', order: 2 });
    await admin('post', '/team').send({ name: 'First Person', order: 1 });
    await admin('post', '/team').send({ name: 'Hidden Person', order: 0, published: false });
    const res = await request(app).get('/api/v1/team');
    expect(res.body.data.map((t: { name: string }) => t.name)).toEqual([
      'First Person',
      'Second Person',
    ]);
    expect(res.body.data[0].slug).toBeUndefined();
    expect((await request(app).get('/api/v1/team/first-person')).status).toBe(404);
  });

  it('services: ordered list and detail', async () => {
    await admin('post', '/services').send({
      title: 'Stone & Aggregates',
      icon: 'mountain',
      order: 2,
    });
    await admin('post', '/services').send({
      title: 'Iron Ore',
      icon: 'pickaxe',
      order: 1,
      stats: [{ label: 'Tonnage', value: null, placeholder: '[PLACEHOLDER: tonnage]' }],
    });
    const res = await request(app).get('/api/v1/services');
    expect(res.body.data.map((s: { slug: string }) => s.slug)).toEqual([
      'iron-ore',
      'stone-and-aggregates',
    ]);
    const one = await request(app).get('/api/v1/services/iron-ore');
    expect(one.body.data.stats[0]).toMatchObject({
      value: null,
      placeholder: '[PLACEHOLDER: tonnage]',
    });
  });

  it('GET /seo/sitemap-data lists public slugs with updatedAt', async () => {
    await admin('post', '/projects').send(project({ published: true }));
    await admin('post', '/projects').send(project({ title: 'Draft' }));
    await admin('post', '/posts').send({ title: 'Post A', published: true });
    await admin('post', '/jobs').send({ title: 'Job A', isOpen: true });
    const res = await request(app).get('/api/v1/seo/sitemap-data');
    expect(res.status).toBe(200);
    expect(res.body.data.projects).toEqual([
      { slug: 'iron-ore-exploration', updatedAt: expect.any(String) },
    ]);
    expect(res.body.data.posts[0].slug).toBe('post-a');
    expect(res.body.data.jobs[0].slug).toBe('job-a');
  });
});

describe('rebuild hook', () => {
  afterEach(() => {
    env.REBUILD_HOOK_URL = undefined;
    vi.useRealTimers();
  });

  it('is a no-op without REBUILD_HOOK_URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    rebuild.schedule('x');
    expect(rebuild.pending()).toBe(false);
    expect(await rebuild.now()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('debounces many changes into one POST', async () => {
    vi.useFakeTimers();
    env.REBUILD_HOOK_URL = 'https://api.vercel.com/v1/integrations/deploy/abc';
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 201 }));
    rebuild.schedule('a');
    rebuild.schedule('b');
    expect(rebuild.pending()).toBe(true);
    await vi.advanceTimersByTimeAsync(env.REBUILD_DEBOUNCE_SECONDS * 1000 + 10);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]![1]).toMatchObject({ method: 'POST' });
  });

  it('POST /admin/rebuild triggers immediately (admin only)', async () => {
    env.REBUILD_HOOK_URL = 'https://api.netlify.com/build_hooks/abc';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('down'));
    expect((await admin('post', '/rebuild')).status).toBe(403); // editor
    const { cookies: adminCookies } = await loginAs(app, 'admin');
    const res = await request(app).post('/api/v1/admin/rebuild').set('Cookie', adminCookies);
    expect(res.status).toBe(202);
    expect(res.body.data.triggered).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
