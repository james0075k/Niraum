import request from 'supertest';
import { createApp } from '../src/app.js';

describe('app shell', () => {
  const app = createApp();

  it('GET /health returns status, uptime and db', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'ok', db: 'up' });
    expect(typeof res.body.data.uptime).toBe('number');
  });

  it('sets security headers and a strict CSP', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  it('assigns a request id, or keeps a well-formed incoming one', async () => {
    const generated = await request(app).get('/api/v1/health');
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    const kept = await request(app).get('/api/v1/health').set('X-Request-Id', 'proxy-req-12345');
    expect(kept.headers['x-request-id']).toBe('proxy-req-12345');
    const replaced = await request(app).get('/api/v1/health').set('X-Request-Id', 'bad id!');
    expect(replaced.headers['x-request-id']).not.toBe('bad id!');
  });

  it('returns the error envelope for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('allows credentialed CORS only for the allow-list', async () => {
    const ok = await request(app).get('/api/v1/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
    const bad = await request(app).get('/api/v1/health').set('Origin', 'https://evil.example');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects state-changing requests from foreign origins (CSRF)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: 'a@b.co', password: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('maps malformed JSON and oversized bodies', async () => {
    const bad = await request(app)
      .post('/api/v1/contact')
      .set('Content-Type', 'application/json')
      .send('{"name":');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');

    const big = await request(app)
      .post('/api/v1/contact')
      .send({ message: 'x'.repeat(1_100_000) });
    expect(big.status).toBe(413);
    expect(big.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('strips Mongo operators from input', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: { $gt: '' }, password: 'whatever-password' });
    expect(res.status).toBe(400);
  });

  it('serves the OpenAPI spec outside production', async () => {
    const res = await request(app).get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining(['/api/v1/auth/login', '/api/v1/projects', '/api/v1/admin/settings']),
    );
    const ui = await request(app).get('/api/docs/');
    expect(ui.status).toBe(200);
    expect(ui.headers['content-security-policy']).toContain("script-src 'self'");
  });
});
