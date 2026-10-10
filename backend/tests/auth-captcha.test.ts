import request from 'supertest';
import { vi } from 'vitest';
import { createApp } from '../src/app.js';
import * as captcha from '../src/services/captcha.service.js';
import { createUser, PASSWORD } from './helpers.js';

// Fresh app per test: login is rate limited (10 / 15 min) per app instance.
let app = createApp();
beforeEach(() => {
  app = createApp();
});
const login = (email: string, password: string, captchaToken?: string) =>
  request(app).post('/api/v1/auth/login').send({ email, password, captchaToken });

afterEach(() => vi.restoreAllMocks());

it('asks for a captcha after 3 wrong passwords and requires it when configured', async () => {
  const user = await createUser('editor');
  for (let i = 1; i <= 3; i += 1) {
    const res = await login(user.email, 'wrong-password-xx');
    expect(res.status).toBe(401);
    expect(res.body.error.details.captcha).toBe(i >= 3);
  }
  vi.spyOn(captcha, 'captchaConfigured').mockReturnValue(true);
  const verify = vi.spyOn(captcha.captchaService, 'verify');
  const noToken = await login(user.email, PASSWORD);
  expect(noToken.status).toBe(400);
  expect(noToken.body.error.code).toBe('CAPTCHA_REQUIRED');
  expect(noToken.body.error.details).toEqual({ captcha: true });
  verify.mockResolvedValueOnce();
  expect((await login(user.email, PASSWORD, 'tok')).status).toBe(200);
  expect(verify).toHaveBeenCalledWith('tok', expect.any(String));
});

it('does not require a captcha before the threshold', async () => {
  vi.spyOn(captcha, 'captchaConfigured').mockReturnValue(true);
  const user = await createUser('editor');
  expect((await login(user.email, PASSWORD)).status).toBe(200);
});

it('does not require a captcha past the threshold when none is configured', async () => {
  const user = await createUser('editor');
  for (let i = 0; i < 3; i += 1) await login(user.email, 'wrong-password-xx');
  expect((await login(user.email, PASSWORD)).status).toBe(200);
});

it('reports captcha false for unknown emails', async () => {
  for (let i = 0; i < 4; i += 1) {
    const res = await login('nobody@example.com', 'wrong-password-xx');
    expect(res.status).toBe(401);
    expect(res.body.error.details).toEqual({ captcha: false });
  }
});
