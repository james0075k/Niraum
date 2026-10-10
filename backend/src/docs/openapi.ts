import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import type { Express, RequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';
import { z, type ZodTypeAny } from 'zod';
import { contentResources } from '../routes/index.js';
import {
  changePasswordBody,
  forgotBody,
  loginBody,
  resetBody,
  userCreateBody,
  userUpdateBody,
} from '../validators/auth.js';
import { assaySamplesQuery } from '../validators/assay.js';
import { adminListQuery, langQuery, paginationQuery } from '../validators/common.js';
import {
  applicationStatusBody,
  auditQuery,
  contactBody,
  inboxQuery,
  messageStatusBody,
  newsletterBody,
} from '../validators/public.js';
import { geocodeBody, settingsUpdateBody } from '../validators/settings.js';
import { inquiryBody, inquiryListQuery, inquiryStatusBody } from '../validators/public.js';

extendZodWithOpenApi(z);

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

const errorEnvelope = z.object({
  error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }),
});
const item = z.object({ data: z.record(z.unknown()) });
const list = z.object({
  data: z.array(z.record(z.unknown())),
  meta: z.object({ page: z.number(), limit: z.number(), total: z.number(), pages: z.number() }),
});

/** Builds the OpenAPI 3 document from the same Zod schemas the controllers parse with. */
export function buildOpenApiSpec() {
  const registry = new OpenAPIRegistry();
  registry.register('Error', errorEnvelope);
  const cookieAuth = registry.registerComponent('securitySchemes', 'cookieAuth', {
    type: 'apiKey',
    in: 'cookie',
    name: 'na_at',
  });

  const errors = {
    400: {
      description: 'VALIDATION_ERROR (login: CAPTCHA_REQUIRED, CAPTCHA_FAILED)',
      content: { 'application/json': { schema: errorEnvelope } },
    },
    401: {
      description: 'UNAUTHENTICATED (login: details.captcha tells the UI to show the captcha)',
      content: { 'application/json': { schema: errorEnvelope } },
    },
    403: { description: 'FORBIDDEN', content: { 'application/json': { schema: errorEnvelope } } },
    404: { description: 'NOT_FOUND', content: { 'application/json': { schema: errorEnvelope } } },
    429: {
      description: 'RATE_LIMITED',
      content: { 'application/json': { schema: errorEnvelope } },
    },
  };

  const add = (
    method: Method,
    path: string,
    o: {
      tag: string;
      summary: string;
      body?: ZodTypeAny;
      multipart?: ZodTypeAny;
      query?: z.AnyZodObject;
      params?: z.AnyZodObject;
      response?: ZodTypeAny;
      status?: number;
      auth?: boolean;
    },
  ) => {
    const status = o.status ?? (method === 'post' ? 201 : 200);
    registry.registerPath({
      method,
      path: `/api/v1${path}`,
      tags: [o.tag],
      summary: o.summary,
      ...(o.auth ? { security: [{ [cookieAuth.name]: [] }] } : {}),
      request: {
        ...(o.query ? { query: o.query } : {}),
        ...(o.params ? { params: o.params } : {}),
        ...(o.body ? { body: { content: { 'application/json': { schema: o.body } } } } : {}),
        ...(o.multipart
          ? { body: { content: { 'multipart/form-data': { schema: o.multipart } } } }
          : {}),
      },
      responses: {
        [status]: {
          description: 'Success',
          ...(status === 204
            ? {}
            : { content: { 'application/json': { schema: o.response ?? item } } }),
        },
        ...errors,
      },
    });
  };

  const idP = z.object({ id: z.string().openapi({ example: '665f1c2e9b1e8a0012345678' }) });
  const slugP = z.object({ slug: z.string().openapi({ example: 'iron-ore-exploration' }) });
  const file = z.string().openapi({ type: 'string', format: 'binary' });

  add('get', '/health', { tag: 'System', summary: 'Liveness + DB status', status: 200 });

  // Auth
  add('post', '/auth/login', {
    tag: 'Auth',
    summary:
      'Sign in (sets na_at + na_rt cookies). 401 carries details.captcha; after 3 failures 400 CAPTCHA_REQUIRED unless captchaToken is sent',
    body: loginBody,
    status: 200,
  });
  add('post', '/auth/refresh', { tag: 'Auth', summary: 'Rotate the token pair', status: 200 });
  add('post', '/auth/logout', {
    tag: 'Auth',
    summary: 'Clear cookies, end all sessions',
    status: 204,
  });
  add('post', '/auth/forgot', {
    tag: 'Auth',
    summary: 'Email a reset link (always 202)',
    body: forgotBody,
    status: 202,
  });
  add('post', '/auth/reset', {
    tag: 'Auth',
    summary: 'Set a new password with a reset token',
    body: resetBody,
    status: 200,
  });
  add('post', '/auth/change-password', {
    tag: 'Auth',
    summary: 'Change own password',
    body: changePasswordBody,
    status: 200,
    auth: true,
  });
  add('get', '/auth/me', { tag: 'Auth', summary: 'Current user', auth: true });

  // Settings
  add('get', '/settings/public', {
    tag: 'Settings',
    summary: 'Public site settings in ?lang=en|ne (ETag, 60 s cache)',
    query: langQuery,
  });
  add('get', '/admin/settings', { tag: 'Settings', summary: 'Full settings document', auth: true });
  add('put', '/admin/settings', {
    tag: 'Settings',
    summary: 'Update settings; geocodes a changed address unless the pin is manual',
    body: settingsUpdateBody,
    auth: true,
  });
  add('post', '/admin/settings/geocode', {
    tag: 'Settings',
    summary: 'Preview coordinates for an address (nothing saved)',
    body: geocodeBody,
    status: 200,
    auth: true,
  });

  // Content
  for (const r of contentResources) {
    const s = r.schemas;
    add('get', `/${r.path}`, {
      tag: r.tag,
      summary: `Public ${r.path} (published only)`,
      query: s.publicQuery as unknown as z.AnyZodObject,
      response: list,
    });
    if (r.publicDetail) {
      add('get', `/${r.path}/{slug}`, {
        tag: r.tag,
        summary: `Public ${r.path} item`,
        params: slugP,
      });
    }
    add('get', `/admin/${r.path}`, {
      tag: r.tag,
      summary: `All ${r.path} incl. drafts`,
      query: s.adminQuery as unknown as z.AnyZodObject,
      response: list,
      auth: true,
    });
    add('post', `/admin/${r.path}`, { tag: r.tag, summary: `Create`, body: s.create, auth: true });
    add('get', `/admin/${r.path}/{id}`, {
      tag: r.tag,
      summary: 'Get by id',
      params: idP,
      auth: true,
    });
    add('put', `/admin/${r.path}/{id}`, {
      tag: r.tag,
      summary: 'Update',
      params: idP,
      body: s.update,
      auth: true,
    });
    add('delete', `/admin/${r.path}/{id}`, {
      tag: r.tag,
      summary: 'Soft delete',
      params: idP,
      status: 204,
      auth: true,
    });
    add('post', `/admin/${r.path}/{id}/restore`, {
      tag: r.tag,
      summary: 'Restore from trash',
      params: idP,
      status: 200,
      auth: true,
    });
  }

  // Forms
  add('post', '/contact', {
    tag: 'Forms',
    summary: 'Contact form (5/hour/IP, honeypot, captcha)',
    body: contactBody,
  });
  add('post', '/applications', {
    tag: 'Forms',
    summary: 'Job application with PDF CV ≤ 5 MB',
    multipart: z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      message: z.string().optional(),
      job: z.string().optional(),
      captchaToken: z.string().optional(),
      cv: file,
    }),
  });
  add('post', '/newsletter', {
    tag: 'Forms',
    summary: 'Subscribe (double opt-in)',
    body: newsletterBody,
    status: 202,
  });
  add('get', '/newsletter/confirm', {
    tag: 'Forms',
    summary: 'Confirm link → 303 to the site',
    status: 303,
  });
  add('get', '/newsletter/unsubscribe', {
    tag: 'Forms',
    summary: 'Unsubscribe link → 303',
    status: 303,
  });

  // Phase 4.5 — assay data and bulk-supply inquiries
  add('get', '/assay/summary', {
    tag: 'Assay',
    summary: 'Weighted grade by section (Table 14), deposit average, headline figures',
    status: 200,
  });
  add('get', '/assay/samples', {
    tag: 'Assay',
    summary: 'Sample-level rows — 403 unless settings.publicAssayDetail is on',
    query: assaySamplesQuery,
    status: 200,
  });
  add('get', '/admin/assay/samples', {
    tag: 'Assay',
    summary: 'Sample-level rows (always)',
    query: assaySamplesQuery,
    auth: true,
  });
  add('post', '/inquiries', {
    tag: 'Forms',
    summary: 'Bulk supply / investor inquiry (5/hour/IP, honeypot, captcha, auto-reply in lang)',
    body: inquiryBody,
  });
  add('get', '/admin/inquiries', {
    tag: 'Inquiries',
    summary: 'Inquiries (filter by status, buyerType)',
    query: inquiryListQuery,
    response: list,
    auth: true,
  });
  add('get', '/admin/inquiries/export.csv', {
    tag: 'Inquiries',
    summary: 'CSV export (UTF-8 with BOM)',
    query: inquiryListQuery,
    auth: true,
  });
  add('get', '/admin/inquiries/{id}', {
    tag: 'Inquiries',
    summary: 'Get by id',
    params: idP,
    auth: true,
  });
  add('patch', '/admin/inquiries/{id}', {
    tag: 'Inquiries',
    summary: 'Set status (new → contacted → quoted → won / lost, or spam)',
    params: idP,
    body: inquiryStatusBody,
    auth: true,
  });

  // SEO
  add('get', '/seo/sitemap-data', {
    tag: 'SEO',
    summary: 'Public slugs + updatedAt for sitemap.xml',
  });
  add('post', '/admin/rebuild', {
    tag: 'SEO',
    summary: 'Trigger the frontend deploy hook now',
    status: 202,
    auth: true,
  });

  // Media
  add('get', '/admin/media', {
    tag: 'Media',
    summary: 'Media library',
    query: paginationQuery,
    response: list,
    auth: true,
  });
  add('post', '/admin/media', {
    tag: 'Media',
    summary: 'Upload jpg/png/webp/avif ≤ 8 MB, pdf ≤ 5 MB, mp4 ≤ 50 MB',
    multipart: z.object({ file, alt: z.string() }),
    auth: true,
  });
  add('patch', '/admin/media/{id}', {
    tag: 'Media',
    summary: 'Edit alt text',
    params: idP,
    body: z.object({ alt: z.string() }),
    auth: true,
  });
  add('delete', '/admin/media/{id}', {
    tag: 'Media',
    summary: 'Delete (also from Cloudinary)',
    params: idP,
    status: 204,
    auth: true,
  });

  // Inbox
  add('get', '/admin/messages', {
    tag: 'Inbox',
    summary: 'Contact messages',
    query: inboxQuery,
    response: list,
    auth: true,
  });
  add('patch', '/admin/messages/{id}', {
    tag: 'Inbox',
    summary: 'Set status',
    params: idP,
    body: messageStatusBody,
    auth: true,
  });
  add('get', '/admin/applications', {
    tag: 'Inbox',
    summary: 'Job applications',
    query: inboxQuery,
    response: list,
    auth: true,
  });
  add('get', '/admin/applications/{id}', {
    tag: 'Inbox',
    summary: 'Application + signed CV URL',
    params: idP,
    auth: true,
  });
  add('patch', '/admin/applications/{id}', {
    tag: 'Inbox',
    summary: 'Set status',
    params: idP,
    body: applicationStatusBody,
    auth: true,
  });

  // Users + audit
  add('get', '/admin/users', {
    tag: 'Users',
    summary: 'List users (superadmin)',
    query: paginationQuery,
    response: list,
    auth: true,
  });
  add('post', '/admin/users', {
    tag: 'Users',
    summary: 'Create user (must change password)',
    body: userCreateBody,
    auth: true,
  });
  add('put', '/admin/users/{id}', {
    tag: 'Users',
    summary: 'Update name/role/active',
    params: idP,
    body: userUpdateBody,
    auth: true,
  });
  add('delete', '/admin/users/{id}', {
    tag: 'Users',
    summary: 'Deactivate',
    params: idP,
    status: 200,
    auth: true,
  });
  add('get', '/admin/dashboard', {
    tag: 'Dashboard',
    summary:
      'Content counts + assay summary for every admin role; admin+ also get `inbox` (new inquiries/messages/applications) and the last 10 audit entries (`recent`)',
    auth: true,
  });
  add('get', '/admin/audit', {
    tag: 'Audit',
    summary: 'Audit log',
    query: auditQuery,
    response: list,
    auth: true,
  });

  void adminListQuery;
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Niraum Metals API',
      version: '1.0.0',
      description:
        'REST API for the Niraum Metals website and admin CMS. Envelope: `{ data, meta? }` / `{ error: { code, message, details? } }`.',
    },
    servers: [{ url: '/' }],
  });
}

/** Relaxed CSP just for Swagger UI (the API default is `default-src 'none'`). */
const docsCsp: RequestHandler = (_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self'",
  );
  next();
};

/** `/api/docs` (UI) and `/api/docs.json` (spec). Never mounted in production. */
export function mountDocs(app: Express): void {
  let spec: ReturnType<typeof buildOpenApiSpec> | null = null;
  const getSpec = () => (spec ??= buildOpenApiSpec());
  app.get('/api/docs.json', (_req, res) => {
    res.json(getSpec());
  });
  app.use(
    '/api/docs',
    docsCsp,
    swaggerUi.serveFiles(undefined, { swaggerUrl: '/api/docs.json' }),
    swaggerUi.setup(undefined, { swaggerUrl: '/api/docs.json' }),
  );
}
