import { Router } from 'express';
import { dbState } from '../config/db.js';
import { env } from '../config/env.js';
import {
  auditController,
  inboxController,
  mediaController,
  rebuildController,
  userController,
} from '../controllers/admin.controller.js';
import { assayController, csvBody } from '../controllers/assay.controller.js';
import { authController } from '../controllers/auth.controller.js';
import { contentController, type ContentSchemas } from '../controllers/content.controller.js';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { inquiryController } from '../controllers/inquiry.controller.js';
import { publicController } from '../controllers/public.controller.js';
import { settingsController } from '../controllers/settings.controller.js';
import { ADMIN_ROLES, CONTENT_ROLES, requireAuth, requireRole } from '../middlewares/auth.js';
import type { RateLimiters } from '../middlewares/rateLimits.js';
import { uploadSingle } from '../middlewares/upload.js';
import type { ContentService } from '../services/content.service.js';
import {
  depositService,
  jobService,
  postService,
  productService,
  projectService,
  serviceService,
  teamService,
} from '../services/resources.js';
import * as v from '../validators/content.js';

export interface ContentResource {
  path: string;
  tag: string;
  service: ContentService;
  schemas: ContentSchemas;
  /** Has a public `GET /<path>/:slug`. */
  publicDetail: boolean;
}

export const contentResources: ContentResource[] = [
  {
    path: 'projects',
    tag: 'Projects',
    service: projectService,
    publicDetail: true,
    schemas: {
      publicQuery: v.projectPublicQuery,
      adminQuery: v.projectAdminQuery,
      create: v.projectCreate,
      update: v.projectUpdate,
    },
  },
  {
    path: 'posts',
    tag: 'Posts',
    service: postService,
    publicDetail: true,
    schemas: {
      publicQuery: v.postPublicQuery,
      adminQuery: v.postAdminQuery,
      create: v.postCreate,
      update: v.postUpdate,
    },
  },
  {
    path: 'jobs',
    tag: 'Jobs',
    service: jobService,
    publicDetail: true,
    schemas: {
      publicQuery: v.jobPublicQuery,
      adminQuery: v.jobAdminQuery,
      create: v.jobCreate,
      update: v.jobUpdate,
    },
  },
  {
    path: 'team',
    tag: 'Team',
    service: teamService,
    publicDetail: false,
    schemas: {
      publicQuery: v.teamPublicQuery,
      adminQuery: v.teamAdminQuery,
      create: v.teamCreate,
      update: v.teamUpdate,
    },
  },
  {
    path: 'services',
    tag: 'Services',
    service: serviceService,
    publicDetail: true,
    schemas: {
      publicQuery: v.servicePublicQuery,
      adminQuery: v.serviceAdminQuery,
      create: v.serviceCreate,
      update: v.serviceUpdate,
    },
  },
  // Phase 4.5
  {
    path: 'products',
    tag: 'Products',
    service: productService,
    publicDetail: true,
    schemas: {
      publicQuery: v.productPublicQuery,
      adminQuery: v.productAdminQuery,
      create: v.productCreate,
      update: v.productUpdate,
    },
  },
  {
    path: 'deposits',
    tag: 'Deposits',
    service: depositService,
    publicDetail: true,
    schemas: {
      publicQuery: v.depositPublicQuery,
      adminQuery: v.depositAdminQuery,
      create: v.depositCreate,
      update: v.depositUpdate,
    },
  },
];

const MB = 1024 * 1024;

/** All `/api/v1` routes. Route files only declare path + middleware chain. */
export function createApiRouter(limits: RateLimiters): Router {
  const api = Router();

  api.get('/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      data: {
        status: 'ok',
        uptime: process.uptime(),
        db: dbState(),
        commit: env.RENDER_GIT_COMMIT ?? null,
      },
    });
  });

  // ── Auth ────────────────────────────────────────────────────────────────
  const auth = Router();
  auth.post('/login', limits.login, authController.login);
  auth.post('/refresh', authController.refresh);
  auth.post('/logout', authController.logout);
  auth.post('/forgot', limits.forgot, authController.forgot);
  auth.post('/reset', limits.forgot, authController.reset);
  auth.post('/change-password', requireAuth, authController.changePassword);
  auth.get('/me', requireAuth, authController.me);
  api.use('/auth', auth);

  // ── Public ──────────────────────────────────────────────────────────────
  api.get('/settings/public', settingsController.getPublic);
  for (const r of contentResources) {
    const c = contentController(r.service, r.schemas);
    api.get(`/${r.path}`, c.publicCache, c.listPublic);
    if (r.publicDetail) api.get(`/${r.path}/:slug`, c.publicCache, c.getPublic);
  }
  api.post('/contact', limits.contact, publicController.contact);
  api.post(
    '/applications',
    limits.applications,
    uploadSingle('cv', 5 * MB),
    publicController.apply,
  );
  api.post('/newsletter', limits.newsletter, publicController.subscribe);
  api.get('/newsletter/confirm', publicController.confirmNewsletter);
  api.get('/newsletter/unsubscribe', publicController.unsubscribeNewsletter);
  api.get('/seo/sitemap-data', publicController.sitemapData);
  // Phase 4.5: assay data + bulk-supply inquiries
  api.get('/assay/summary', assayController.summary);
  api.get('/assay/samples', assayController.samplesPublic);
  api.post('/inquiries', limits.inquiries, inquiryController.submit);

  // ── Admin (every route authenticated; roles per group) ─────────────────
  const admin = Router();
  admin.use(requireAuth, (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  const content = requireRole(...CONTENT_ROLES);
  for (const r of contentResources) {
    const c = contentController(r.service, r.schemas);
    admin.get(`/${r.path}`, content, c.listAdmin);
    admin.post(`/${r.path}`, content, c.create);
    admin.get(`/${r.path}/:id`, content, c.getAdmin);
    admin.put(`/${r.path}/:id`, content, c.update);
    admin.delete(`/${r.path}/:id`, content, c.remove);
    admin.post(`/${r.path}/:id/restore`, content, c.restore);
  }

  admin.get('/dashboard', content, dashboardController.stats);

  admin.get('/media', content, mediaController.list);
  admin.post('/media', content, uploadSingle('file', 50 * MB), mediaController.upload);
  admin.patch('/media/:id', content, mediaController.updateAlt);
  admin.delete('/media/:id', content, mediaController.remove);

  const adminOnly = requireRole(...ADMIN_ROLES);
  admin.get('/settings', adminOnly, settingsController.getAdmin);
  admin.put('/settings', adminOnly, settingsController.update);
  admin.post('/settings/geocode', adminOnly, settingsController.geocode);
  admin.get('/messages', adminOnly, inboxController.listMessages);
  admin.patch('/messages/:id', adminOnly, inboxController.setMessageStatus);
  admin.get('/applications', adminOnly, inboxController.listApplications);
  admin.get('/applications/:id', adminOnly, inboxController.getApplication);
  admin.patch('/applications/:id', adminOnly, inboxController.setApplicationStatus);
  admin.get('/inquiries', adminOnly, inquiryController.list);
  admin.get('/inquiries/export.csv', adminOnly, inquiryController.exportCsv);
  admin.get('/inquiries/:id', adminOnly, inquiryController.get);
  admin.patch('/inquiries/:id', adminOnly, inquiryController.setStatus);
  admin.get('/assay/samples', content, assayController.samplesAdmin);
  admin.post('/assay/samples', content, assayController.createSample);
  admin.put('/assay/samples/:id', content, assayController.updateSample);
  admin.delete('/assay/samples/:id', content, assayController.removeSample);
  admin.get('/assay/summary', content, assayController.summaryAdmin);
  admin.put('/assay/summary/:id', content, assayController.updateSummary);
  admin.post('/assay/import', content, csvBody, assayController.importCsv);
  admin.get('/audit', adminOnly, auditController.list);
  admin.post('/rebuild', adminOnly, rebuildController.trigger);

  const superadmin = requireRole('superadmin');
  admin.get('/users', superadmin, userController.list);
  admin.post('/users', superadmin, userController.create);
  admin.put('/users/:id', superadmin, userController.update);
  admin.delete('/users/:id', superadmin, userController.deactivate);

  api.use('/admin', admin);
  return api;
}
