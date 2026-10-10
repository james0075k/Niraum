import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { mailer } from '../src/config/mailer.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { User } from '../src/models/User.js';
import { PASSWORD, cookieValue, cookiesFrom, createUser, loginAs } from './helpers.js';

// Fresh app per test: login is rate limited (10 / 15 min) per app instance.
let app: Express;
beforeEach(() => {
  app = createApp();
});
const login = (email: string, password = PASSWORD) =>
  request(app).post('/api/v1/auth/login').send({ email, password });

describe('POST /auth/login', () => {
  it('sets httpOnly, Secure, SameSite=Strict access + refresh cookies', async () => {
    const user = await createUser('admin');
    const res = await login(user.email);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: user.email, role: 'admin' });
    expect(res.body.data.passwordHash).toBeUndefined();

    const raw = res.headers['set-cookie'] as unknown as string[];
    const at = raw.find((c) => c.startsWith('na_at='));
    const rt = raw.find((c) => c.startsWith('na_rt='));
    for (const c of [at, rt]) {
      expect(c).toMatch(/HttpOnly/);
      expect(c).toMatch(/Secure/);
      expect(c).toMatch(/SameSite=Strict/);
    }
    expect(at).toMatch(/Path=\/api;/);
    expect(rt).toMatch(/Path=\/api\/v1\/auth/);
    expect(at).toMatch(/Max-Age=900/);
    expect(rt).toMatch(/Max-Age=604800/);

    const stored = await User.findById(user._id);
    expect(stored?.lastLoginAt).toBeInstanceOf(Date);
    expect(await AuditLog.countDocuments({ action: 'login' })).toBe(1);
  });

  it('rejects a wrong password and unknown email with the same 401', async () => {
    const user = await createUser();
    const wrong = await login(user.email, 'wrong-password-123');
    const unknown = await login('nobody@example.com');
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
    expect(await AuditLog.countDocuments({ action: 'login_failed' })).toBe(2);
  });

  it('rejects inactive users', async () => {
    const user = await createUser('editor', { isActive: false });
    expect((await login(user.email)).status).toBe(401);
  });

  it('validates the body', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.fieldErrors.email).toBeDefined();
  });

  it('locks the account for 15 minutes after 5 failures', async () => {
    const user = await createUser();
    for (let i = 0; i < 4; i++)
      expect((await login(user.email, 'bad-password-xx')).status).toBe(401);
    const fifth = await login(user.email, 'bad-password-xx');
    expect(fifth.status).toBe(423);
    expect(fifth.body.error.code).toBe('ACCOUNT_LOCKED');

    // Even the right password is refused while locked.
    const locked = await login(user.email);
    expect(locked.status).toBe(423);
    const stored = await User.findById(user._id);
    const minutes = ((stored?.lockUntil?.getTime() ?? 0) - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(14);
    expect(minutes).toBeLessThanOrEqual(15);

    // After the lock expires, login works and the counter resets.
    await User.updateOne({ _id: user._id }, { lockUntil: new Date(Date.now() - 1000) });
    expect((await login(user.email)).status).toBe(200);
    expect((await User.findById(user._id))?.failedLoginCount).toBe(0);
  });
});

describe('session lifecycle', () => {
  it('GET /auth/me needs a valid access cookie', async () => {
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
    const bogus = await request(app).get('/api/v1/auth/me').set('Cookie', ['na_at=garbage']);
    expect(bogus.status).toBe(401);
    const { user, cookies } = await loginAs(app, 'editor');
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
  });

  it('a refresh token cannot be used as an access token', async () => {
    const { cookies } = await loginAs(app);
    const rt = cookieValue(cookies, 'na_rt')!.replace('na_rt=', '');
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [`na_at=${rt}`]);
    expect(res.status).toBe(401);
  });

  it('POST /auth/refresh rotates the token pair', async () => {
    const { cookies } = await loginAs(app);
    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookies);
    expect(res.status).toBe(200);
    const next = cookiesFrom(res);
    expect(cookieValue(next, 'na_rt')).toBeDefined();
    expect(cookieValue(next, 'na_rt')).not.toBe(cookieValue(cookies, 'na_rt'));
    expect(cookieValue(next, 'na_at')).toBeDefined();
  });

  it('refresh without a cookie is 401', async () => {
    expect((await request(app).post('/api/v1/auth/refresh')).status).toBe(401);
  });

  it('logout clears cookies and invalidates every refresh token', async () => {
    const { cookies } = await loginAs(app);
    const out = await request(app).post('/api/v1/auth/logout').set('Cookie', cookies);
    expect(out.status).toBe(204);
    const cleared = (out.headers['set-cookie'] as unknown as string[]).join(';');
    expect(cleared).toMatch(/na_at=;/);
    expect(cleared).toMatch(/na_rt=;/);

    const refresh = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookies);
    expect(refresh.status).toBe(401);
    const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookies);
    expect(me.status).toBe(401);
    expect(await AuditLog.countDocuments({ action: 'logout' })).toBe(1);
  });

  it('logout without cookies still succeeds', async () => {
    expect((await request(app).post('/api/v1/auth/logout')).status).toBe(204);
  });
});

describe('forced password change', () => {
  it('blocks everything but /me, /change-password and /logout until changed', async () => {
    const user = await createUser('superadmin', { mustChangePassword: true });
    const res = await login(user.email);
    const cookies = cookiesFrom(res);
    expect(res.body.data.mustChangePassword).toBe(true);

    const blocked = await request(app).get('/api/v1/admin/projects').set('Cookie', cookies);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
    expect((await request(app).get('/api/v1/auth/me').set('Cookie', cookies)).status).toBe(200);

    const same = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Cookie', cookies)
      .send({ currentPassword: PASSWORD, newPassword: PASSWORD });
    expect(same.status).toBe(400);

    const wrong = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Cookie', cookies)
      .send({ currentPassword: 'not-my-password', newPassword: 'a-brand-new-password' });
    expect(wrong.status).toBe(400);

    const changed = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Cookie', cookies)
      .send({ currentPassword: PASSWORD, newPassword: 'a-brand-new-password' });
    expect(changed.status).toBe(200);
    expect(changed.body.data.mustChangePassword).toBe(false);

    // Old cookies are dead (version bumped); the new ones work.
    expect((await request(app).get('/api/v1/auth/me').set('Cookie', cookies)).status).toBe(401);
    const fresh = cookiesFrom(changed);
    const ok = await request(app).get('/api/v1/admin/projects').set('Cookie', fresh);
    expect(ok.status).toBe(200);
  });
});

describe('forgot / reset password', () => {
  const resetToken = () => {
    const send = vi.mocked(mailer.send);
    const text = send.mock.calls.at(-1)?.[0].text ?? '';
    return /token=([a-f0-9]{64})/.exec(text)?.[1] ?? '';
  };

  it('answers 202 whether or not the email exists', async () => {
    const res = await request(app).post('/api/v1/auth/forgot').send({ email: 'ghost@example.com' });
    expect(res.status).toBe(202);
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('emails a single-use, hashed, 30-minute token', async () => {
    const user = await createUser();
    const res = await request(app).post('/api/v1/auth/forgot').send({ email: user.email });
    expect(res.status).toBe(202);
    await vi.waitFor(() => expect(mailer.send).toHaveBeenCalledTimes(1));
    const token = resetToken();
    expect(token).toHaveLength(64);

    const stored = await User.findById(user._id).select('+resetTokenHash +resetTokenExpires');
    expect(stored?.resetTokenHash).not.toBe(token); // only the hash is stored
    const ttl = (stored?.resetTokenExpires?.getTime() ?? 0) - Date.now();
    expect(ttl).toBeGreaterThan(29 * 60_000);
    expect(ttl).toBeLessThanOrEqual(30 * 60_000);

    const reset = await request(app)
      .post('/api/v1/auth/reset')
      .send({ token, password: 'my-new-long-password' });
    expect(reset.status).toBe(200);
    expect((await login(user.email, 'my-new-long-password')).status).toBe(200);

    const again = await request(app)
      .post('/api/v1/auth/reset')
      .send({ token, password: 'another-long-password' });
    expect(again.status).toBe(400);
  });

  it('rejects an expired token', async () => {
    const user = await createUser();
    await request(app).post('/api/v1/auth/forgot').send({ email: user.email });
    await vi.waitFor(() => expect(mailer.send).toHaveBeenCalled());
    const token = resetToken();
    await User.updateOne({ _id: user._id }, { resetTokenExpires: new Date(Date.now() - 1) });
    const res = await request(app)
      .post('/api/v1/auth/reset')
      .send({ token, password: 'my-new-long-password' });
    expect(res.status).toBe(400);
  });

  it('enforces the password policy', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset')
      .send({ token: 'a'.repeat(64), password: 'short' });
    expect(res.status).toBe(400);
  });
});
