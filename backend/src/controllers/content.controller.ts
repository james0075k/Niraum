import type { RequestHandler } from 'express';
import type { ZodType, ZodTypeDef } from 'zod';
import type { AdminListInput, ContentService, ListInput } from '../services/content.service.js';
import { ah } from '../utils/asyncHandler.js';
import { idParams, langQuery, slugParams } from '../validators/common.js';
import { actorOf } from './helpers.js';

type Schema<T> = ZodType<T, ZodTypeDef, unknown>;

export interface ContentSchemas {
  publicQuery: Schema<ListInput>;
  adminQuery: Schema<AdminListInput>;
  create: Schema<Record<string, unknown>>;
  update: Schema<Record<string, unknown>>;
}

/** Public + admin handlers for one content type (projects, posts, jobs, team, services). */
export function contentController(service: ContentService, schemas: ContentSchemas) {
  const publicCache: RequestHandler = (_req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    next();
  };

  return {
    publicCache,

    listPublic: ah(async (req, res) => {
      res.json(await service.listPublic(schemas.publicQuery.parse(req.query)));
    }),

    getPublic: ah(async (req, res) => {
      const { slug } = slugParams.parse(req.params);
      const { lang } = langQuery.parse(req.query);
      res.json({ data: await service.getPublic(slug, lang) });
    }),

    listAdmin: ah(async (req, res) => {
      res.json(await service.listAdmin(schemas.adminQuery.parse(req.query)));
    }),

    getAdmin: ah(async (req, res) => {
      const { id } = idParams.parse(req.params);
      res.json({ data: await service.getAdmin(id) });
    }),

    create: ah(async (req, res) => {
      const input = schemas.create.parse(req.body);
      res.status(201).json({ data: await service.create(input, actorOf(req)) });
    }),

    update: ah(async (req, res) => {
      const { id } = idParams.parse(req.params);
      const input = schemas.update.parse(req.body);
      res.json({ data: await service.update(id, input, actorOf(req)) });
    }),

    remove: ah(async (req, res) => {
      const { id } = idParams.parse(req.params);
      await service.remove(id, actorOf(req));
      res.status(204).end();
    }),

    restore: ah(async (req, res) => {
      const { id } = idParams.parse(req.params);
      res.json({ data: await service.restore(id, actorOf(req)) });
    }),
  };
}
