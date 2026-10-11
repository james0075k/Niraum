import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import {
  E2E_EDITOR_EMAIL,
  E2E_SUPERADMIN_EMAIL,
  seedE2eUsers,
} from '../src/seed/e2e-admin.seed.js';

const password = 'e2e-only-password-123';

describe('e2e admin seed', () => {
  it('refuses to run in production', async () => {
    await expect(seedE2eUsers({ nodeEnv: 'production', password })).rejects.toThrow(/production/);
    expect(await User.countDocuments()).toBe(0);
  });

  it('does nothing without a password', async () => {
    expect(await seedE2eUsers({ nodeEnv: 'test', password: '' })).toEqual([]);
    expect(await User.countDocuments()).toBe(0);
  });

  it('rejects a password below the 12-character floor', async () => {
    await expect(seedE2eUsers({ nodeEnv: 'test', password: 'short' })).rejects.toThrow(/12/);
  });

  it('creates one user per role that can sign in without a forced password change', async () => {
    const emails = await seedE2eUsers({
      nodeEnv: 'test',
      password,
      adminEmail: 'E2E-Admin@Example.com',
    });
    expect(emails).toEqual(['e2e-admin@example.com', E2E_EDITOR_EMAIL, E2E_SUPERADMIN_EMAIL]);
    const users = await User.find().sort({ email: 1 }).lean();
    expect(users.map((u) => [u.email, u.role, u.mustChangePassword])).toEqual([
      ['e2e-admin@example.com', 'admin', false],
      [E2E_EDITOR_EMAIL, 'editor', false],
      [E2E_SUPERADMIN_EMAIL, 'superadmin', false],
    ]);

    const res = await request(createApp())
      .post('/api/v1/auth/login')
      .send({ email: 'e2e-admin@example.com', password });
    expect(res.status).toBe(200);
  });

  it('is idempotent and unlocks a locked e2e user on rerun', async () => {
    await seedE2eUsers({ nodeEnv: 'test', password });
    await User.updateOne(
      { email: E2E_EDITOR_EMAIL },
      { failedLoginCount: 4, lockUntil: new Date(Date.now() + 60_000), isActive: false },
    );
    await seedE2eUsers({ nodeEnv: 'test', password });
    expect(await User.countDocuments()).toBe(3);
    const editor = await User.findOne({ email: E2E_EDITOR_EMAIL }).lean();
    expect(editor).toMatchObject({ failedLoginCount: 0, lockUntil: null, isActive: true });
  });
});
