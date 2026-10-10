import { z } from 'zod';
import { rebuild } from '../jobs/rebuild.js';
import { MEDIA_TYPES } from '../models/Media.js';
import { applicationService } from '../services/application.service.js';
import { auditService } from '../services/audit.service.js';
import { contactService } from '../services/contact.service.js';
import { mediaService } from '../services/media.service.js';
import { userService } from '../services/user.service.js';
import { ah } from '../utils/asyncHandler.js';
import { paginationQuery } from '../utils/pagination.js';
import { userCreateBody, userUpdateBody } from '../validators/auth.js';
import { idParams } from '../validators/common.js';
import {
  applicationStatusBody,
  auditQuery,
  inboxQuery,
  messageStatusBody,
} from '../validators/public.js';
import { actorOf } from './helpers.js';

const mediaQuery = paginationQuery.extend({ type: z.enum(MEDIA_TYPES).optional() });
const altBody = z.object({ alt: z.string().trim().max(200) });
const uploadFields = z.object({ alt: z.string().trim().max(200).default('') });

export const mediaController = {
  list: ah(async (req, res) => {
    res.json(await mediaService.list(mediaQuery.parse(req.query)));
  }),
  upload: ah(async (req, res) => {
    const { alt } = uploadFields.parse(req.body ?? {});
    res.status(201).json({ data: await mediaService.upload(req.file, alt, actorOf(req)) });
  }),
  updateAlt: ah(async (req, res) => {
    const { id } = idParams.parse(req.params);
    const { alt } = altBody.parse(req.body);
    res.json({ data: await mediaService.updateAlt(id, alt, actorOf(req)) });
  }),
  remove: ah(async (req, res) => {
    const { id } = idParams.parse(req.params);
    await mediaService.remove(id, actorOf(req));
    res.status(204).end();
  }),
};

export const inboxController = {
  listMessages: ah(async (req, res) => {
    res.json(await contactService.list(inboxQuery.parse(req.query)));
  }),
  setMessageStatus: ah(async (req, res) => {
    const { id } = idParams.parse(req.params);
    const { status } = messageStatusBody.parse(req.body);
    res.json({ data: await contactService.setStatus(id, status, actorOf(req)) });
  }),
  listApplications: ah(async (req, res) => {
    res.json(await applicationService.list(inboxQuery.parse(req.query)));
  }),
  getApplication: ah(async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await applicationService.get(id) });
  }),
  setApplicationStatus: ah(async (req, res) => {
    const { id } = idParams.parse(req.params);
    const { status } = applicationStatusBody.parse(req.body);
    res.json({ data: await applicationService.setStatus(id, status, actorOf(req)) });
  }),
};

export const userController = {
  list: ah(async (req, res) => {
    const { page, limit } = paginationQuery.parse(req.query);
    res.json(await userService.list(page, limit));
  }),
  create: ah(async (req, res) => {
    const input = userCreateBody.parse(req.body);
    res.status(201).json({ data: await userService.create(input, actorOf(req)) });
  }),
  update: ah(async (req, res) => {
    const { id } = idParams.parse(req.params);
    const input = userUpdateBody.parse(req.body);
    res.json({ data: await userService.update(id, input, actorOf(req)) });
  }),
  deactivate: ah(async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json({ data: await userService.deactivate(id, actorOf(req)) });
  }),
};

export const auditController = {
  list: ah(async (req, res) => {
    res.json(await auditService.list(auditQuery.parse(req.query)));
  }),
};

export const rebuildController = {
  trigger: ah(async (_req, res) => {
    const triggered = await rebuild.now('manual');
    res.status(202).json({ data: { triggered } });
  }),
};
