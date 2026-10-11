import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loginAs } from './helpers.js';

let app: Express;
let cookies: string[];
beforeEach(async () => {
  app = createApp();
  ({ cookies } = await loginAs(app, 'editor'));
});

const day = 86_400_000;
const post = (title: string, publishedAt?: string) =>
  request(app)
    .post('/api/v1/admin/posts')
    .set('Cookie', cookies)
    .send({ title, excerpt: 'x', body: '<p>x</p>', published: true, publishedAt });

describe('scheduled publishing', () => {
  it('hides published posts whose publishedAt is in the future', async () => {
    const future = new Date(Date.now() + day).toISOString();
    await post('Later', future).expect(201);
    await post('Now').expect(201);
    const pub = await request(app).get('/api/v1/posts').expect(200);
    const titles = pub.body.data.map((p: { title: string }) => p.title);
    expect(titles).toContain('Now');
    expect(titles).not.toContain('Later');
    expect((await request(app).get('/api/v1/posts/later')).status).toBe(404);
    expect((await request(app).get('/api/v1/posts/now')).status).toBe(200);
  });

  it('keeps a past publishedAt visible and excludes scheduled items from the sitemap', async () => {
    await post('Earlier', new Date(Date.now() - day).toISOString()).expect(201);
    await post('Later', new Date(Date.now() + day).toISOString()).expect(201);
    const res = await request(app).get('/api/v1/seo/sitemap-data').expect(200);
    const slugs = res.body.data.posts.map((p: { slug: string }) => p.slug);
    expect(slugs).toContain('earlier');
    expect(slugs).not.toContain('later');
  });

  it('schedules projects the same way', async () => {
    const future = new Date(Date.now() + day).toISOString();
    await request(app)
      .post('/api/v1/admin/projects')
      .set('Cookie', cookies)
      .send({ title: 'Future site', mineral: 'iron-ore', published: true, publishedAt: future })
      .expect(201);
    expect((await request(app).get('/api/v1/projects/future-site')).status).toBe(404);
  });
});
