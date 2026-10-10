import type { Express } from 'express';
import request, { type Response as TestResponse } from 'supertest';
import { User, type Role } from '../src/models/User.js';
import { hashPassword } from '../src/services/auth.service.js';

export const PASSWORD = 'correct-horse-battery';

let n = 0;
export async function createUser(
  role: Role = 'editor',
  overrides: { email?: string; mustChangePassword?: boolean; isActive?: boolean } = {},
) {
  n += 1;
  return User.create({
    name: `${role} ${n}`,
    email: overrides.email ?? `${role}${n}@example.com`,
    role,
    passwordHash: await hashPassword(PASSWORD),
    mustChangePassword: overrides.mustChangePassword ?? false,
    isActive: overrides.isActive ?? true,
  });
}

/** Set-Cookie header → `name=value` pairs, ready to send back as a Cookie header. */
export function cookiesFrom(res: TestResponse): string[] {
  const raw = res.headers['set-cookie'] as unknown;
  const list = Array.isArray(raw) ? (raw as string[]) : typeof raw === 'string' ? [raw] : [];
  return list.map((c) => c.split(';')[0] ?? '').filter((c) => c && !c.endsWith('='));
}

export const cookieValue = (cookies: string[], name: string) =>
  cookies.find((c) => c.startsWith(`${name}=`));

/** Creates a user of `role`, logs in, returns the auth cookies. */
export async function loginAs(app: Express, role: Role = 'editor') {
  const user = await createUser(role);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: user.email, password: PASSWORD });
  if (res.status !== 200)
    throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { user, cookies: cookiesFrom(res) };
}

/** Minimal valid file headers for upload tests. */
export const fixtures = {
  png: Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(64),
  ]),
  jpg: Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]),
  webp: Buffer.concat([
    Buffer.from('RIFF'),
    Buffer.alloc(4),
    Buffer.from('WEBPVP8 '),
    Buffer.alloc(64),
  ]),
  avif: Buffer.concat([Buffer.from([0, 0, 0, 0x1c]), Buffer.from('ftypavif'), Buffer.alloc(64)]),
  mp4: Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(64)]),
  pdf: Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(64)]),
  exe: Buffer.concat([Buffer.from('MZ'), Buffer.alloc(64)]),
};

/** fetch() Response for mocked Nominatim / captcha / hook calls. */
export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
