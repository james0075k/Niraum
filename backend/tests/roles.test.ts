import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { cookiesFrom, createUser, loginAs, PASSWORD } from './helpers.js';

let app: Express;
beforeEach(() => {
  app = createApp();
});

const project = { title: 'Role Test Project', mineral: 'iron-ore' };

describe('role guards', () => {
  it('anonymous users get 401 on every admin route', async () => {
    for (const path of ['/projects', '/settings', '/messages', '/users', '/media', '/audit']) {
      const res = await request(app).get(`/api/v1/admin${path}`);
      expect(res.status, path).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    }
  });

  it('editor: content yes; settings, messages, users no', async () => {
    const { cookies } = await loginAs(app, 'editor');
    const created = await request(app)
      .post('/api/v1/admin/projects')
      .set('Cookie', cookies)
      .send(project);
    expect(created.status).toBe(201);
    expect((await request(app).get('/api/v1/admin/media').set('Cookie', cookies)).status).toBe(200);
    for (const path of ['/settings', '/messages', '/applications', '/audit', '/users']) {
      const res = await request(app).get(`/api/v1/admin${path}`).set('Cookie', cookies);
      expect(res.status, path).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    }
    const put = await request(app).put('/api/v1/admin/settings').set('Cookie', cookies).send({});
    expect(put.status).toBe(403);
  });

  it('admin: content + settings + messages; users no', async () => {
    const { cookies } = await loginAs(app, 'admin');
    for (const path of ['/projects', '/settings', '/messages', '/applications', '/audit']) {
      const res = await request(app).get(`/api/v1/admin${path}`).set('Cookie', cookies);
      expect(res.status, path).toBe(200);
    }
    expect((await request(app).get('/api/v1/admin/users').set('Cookie', cookies)).status).toBe(403);
  });

  it('superadmin: everything', async () => {
    const { cookies } = await loginAs(app, 'superadmin');
    for (const path of ['/projects', '/settings', '/messages', '/audit', '/users']) {
      const res = await request(app).get(`/api/v1/admin${path}`).set('Cookie', cookies);
      expect(res.status, path).toBe(200);
    }
  });

  it('deactivating a user ends their session immediately', async () => {
    const { user, cookies } = await loginAs(app, 'editor');
    await User.updateOne({ _id: user._id }, { isActive: false });
    expect((await request(app).get('/api/v1/admin/projects').set('Cookie', cookies)).status).toBe(
      401,
    );
  });
});

describe('user management (superadmin)', () => {
  it('creates users who must change their password, updates and deactivates them', async () => {
    const { cookies } = await loginAs(app, 'superadmin');
    const created = await request(app).post('/api/v1/admin/users').set('Cookie', cookies).send({
      name: 'New Editor',
      email: 'NEW@Example.com',
      role: 'editor',
      password: 'temporary-password',
    });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ email: 'new@example.com', mustChangePassword: true });
    expect(created.body.data.passwordHash).toBeUndefined();
    const id = created.body.data.id as string;

    const dup = await request(app)
      .post('/api/v1/admin/users')
      .set('Cookie', cookies)
      .send({ name: 'Dup', email: 'new@example.com', password: 'temporary-password' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CONFLICT');

    const promoted = await request(app)
      .put(`/api/v1/admin/users/${id}`)
      .set('Cookie', cookies)
      .send({ role: 'admin' });
    expect(promoted.body.data.role).toBe('admin');

    const list = await request(app).get('/api/v1/admin/users').set('Cookie', cookies);
    expect(list.body.meta.total).toBe(2);

    const off = await request(app).delete(`/api/v1/admin/users/${id}`).set('Cookie', cookies);
    expect(off.status).toBe(200);
    expect(off.body.data.isActive).toBe(false);
  });

  it('protects the last active superadmin and self-deactivation', async () => {
    const { user, cookies } = await loginAs(app, 'superadmin');
    const self = await request(app)
      .delete(`/api/v1/admin/users/${String(user._id)}`)
      .set('Cookie', cookies);
    expect(self.status).toBe(409);

    const demote = await request(app)
      .put(`/api/v1/admin/users/${String(user._id)}`)
      .set('Cookie', cookies)
      .send({ role: 'admin' });
    expect(demote.status).toBe(409);

    // With a second superadmin, demoting the other one is allowed.
    const other = await createUser('superadmin');
    const ok = await request(app)
      .put(`/api/v1/admin/users/${String(other._id)}`)
      .set('Cookie', cookies)
      .send({ role: 'editor' });
    expect(ok.status).toBe(200);

    const missing = await request(app)
      .put('/api/v1/admin/users/665f1c2e9b1e8a0012345678')
      .set('Cookie', cookies)
      .send({ name: 'Nobody' });
    expect(missing.status).toBe(404);
  });

  it('a role change signs the user out', async () => {
    const { cookies: superCookies } = await loginAs(app, 'superadmin');
    const editor = await createUser('editor');
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: editor.email, password: PASSWORD });
    const editorCookies = cookiesFrom(login);
    await request(app)
      .put(`/api/v1/admin/users/${String(editor._id)}`)
      .set('Cookie', superCookies)
      .send({ role: 'admin' });
    expect((await request(app).get('/api/v1/auth/me').set('Cookie', editorCookies)).status).toBe(
      401,
    );
  });
});
