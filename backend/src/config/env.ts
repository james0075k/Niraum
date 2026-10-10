import { z } from 'zod';

const bool = z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1');

const csv = z.string().transform((s) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean),
);

/** Empty strings in .env files mean "not set". */
const optionalString = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined));

const optionalUrl = optionalString.pipe(z.string().url().optional());

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    TRUST_PROXY: z.coerce.number().int().min(0).default(1),

    /** Public website origin — CORS allow-list, links in emails. */
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    /** Admin CMS origin (same app under /admin unless hosted separately). */
    ADMIN_URL: z.string().url().default('http://localhost:5173'),
    /** Extra allowed origins (e.g. `vite preview` on :4173). */
    CORS_ORIGINS: csv.default(''),
    /** Public base URL of this API — used in emailed confirmation links. */
    API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),

    MONGODB_URI: z.string().min(1),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL: z.string().default('7d'),
    COOKIE_DOMAIN: optionalString,

    LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    LOGIN_LOCK_MINUTES: z.coerce.number().int().positive().default(15),

    CLOUDINARY_CLOUD_NAME: optionalString,
    CLOUDINARY_API_KEY: optionalString,
    CLOUDINARY_API_SECRET: optionalString,
    CLOUDINARY_FOLDER: z.string().default('niraum'),

    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    SMTP_SECURE: bool.default('false'),
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    /** If set, email goes through the Resend HTTP API instead of SMTP. */
    RESEND_API_KEY: optionalString,
    MAIL_FROM: z.string().default('Niraum Metals <no-reply@example.com>'),
    /** PLACEHOLDER mailbox until the company confirms its addresses. */
    CONTACT_INBOX: z.string().email().default('contact@example.com'),
    /** Job applications; falls back to CONTACT_INBOX. */
    HR_INBOX: optionalString.pipe(z.string().email().optional()),

    /** Nominatim usage policy requires an identifying User-Agent (app name + contact). */
    NOMINATIM_USER_AGENT: z.string().min(5).default('NiraumMetalsWebsite/0.1 (dev@example.com)'),
    NOMINATIM_URL: z.string().url().default('https://nominatim.openstreetmap.org'),

    TURNSTILE_SECRET: optionalString,
    RECAPTCHA_SECRET: optionalString,

    REBUILD_HOOK_URL: optionalUrl,
    REBUILD_DEBOUNCE_SECONDS: z.coerce.number().int().min(0).default(120),

    SEED_ADMIN_NAME: z.string().default('Site Owner'),
    SEED_ADMIN_EMAIL: optionalString.pipe(z.string().email().optional()),
    SEED_ADMIN_PASSWORD: optionalString.pipe(z.string().min(12).optional()),
  })
  .superRefine((e, ctx) => {
    if (e.NODE_ENV !== 'production') return;
    const need = (key: string, ok: boolean, message = 'Required in production') => {
      if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message });
    };
    need('JWT_ACCESS_SECRET', !e.JWT_ACCESS_SECRET.startsWith('change-me'), 'Placeholder secret');
    need('JWT_REFRESH_SECRET', !e.JWT_REFRESH_SECRET.startsWith('change-me'), 'Placeholder secret');
    need('CLOUDINARY_CLOUD_NAME', !!e.CLOUDINARY_CLOUD_NAME);
    need('CLOUDINARY_API_KEY', !!e.CLOUDINARY_API_KEY);
    need('CLOUDINARY_API_SECRET', !!e.CLOUDINARY_API_SECRET);
    need('SMTP_HOST', !!(e.SMTP_HOST || e.RESEND_API_KEY), 'Set SMTP_* or RESEND_API_KEY');
    need(
      'TURNSTILE_SECRET',
      !!(e.TURNSTILE_SECRET || e.RECAPTCHA_SECRET),
      'Set TURNSTILE_SECRET or RECAPTCHA_SECRET',
    );
    need(
      'NOMINATIM_USER_AGENT',
      !e.NOMINATIM_USER_AGENT.includes('example.com'),
      'Use a real contact',
    );
  });

export type Env = z.infer<typeof schema>;

/** Values injected under Vitest so tests never need a .env file. */
const testDefaults = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017/niraum-test',
  JWT_ACCESS_SECRET: 'test-access-secret-test-access-secret!!',
  JWT_REFRESH_SECRET: 'test-refresh-secret-test-refresh-secret!',
  LOG_LEVEL: 'silent',
};

export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const input = source.NODE_ENV === 'test' ? { ...testDefaults, ...source } : source;
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment configuration: ${JSON.stringify(fields)}`);
  }
  return parsed.data;
}

function load(): Env {
  try {
    return parseEnv(process.env);
  } catch (err) {
    // Crash early and loudly — never boot half-configured.
    console.error((err as Error).message);
    process.exit(1);
  }
}

export const env = load();
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

/** Browser origins allowed to call the API with credentials. */
export const allowedOrigins = [
  ...new Set([env.CLIENT_URL, env.ADMIN_URL, ...env.CORS_ORIGINS].map((u) => new URL(u).origin)),
];
