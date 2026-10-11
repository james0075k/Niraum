import express from 'express';
import { assayService } from '../services/assay.service.js';
import { AppError } from '../utils/AppError.js';
import { ah } from '../utils/asyncHandler.js';
import {
  assayImportQuery,
  assaySampleBody,
  assaySampleUpdate,
  assaySamplesQuery,
  assaySummaryUpdate,
} from '../validators/assay.js';
import { idParams } from '../validators/common.js';
import { actorOf } from './helpers.js';

/** Content types accepted by the CSV import (browsers send .csv as any of these). */
export const CSV_TYPES = ['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel'];

/** Route-scoped body parser for the import: raw text, at most 1 MB. */
export const csvBody = express.text({ type: CSV_TYPES, limit: '1mb' });

export const assayController = {
  summary: ah(async (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ data: await assayService.summary() });
  }),

  /** Public: 403 unless SiteSettings.publicAssayDetail is on. */
  samplesPublic: ah(async (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(await assayService.samples(assaySamplesQuery.parse(req.query), { admin: false }));
  }),

  samplesAdmin: ah(async (req, res) => {
    res.json(await assayService.samples(assaySamplesQuery.parse(req.query), { admin: true }));
  }),

  createSample: ah(async (req, res) => {
    const input = assaySampleBody.parse(req.body);
    res.status(201).json({ data: await assayService.createSample(input, actorOf(req)) });
  }),

  updateSample: ah(async (req, res) => {
    const { id } = idParams.parse(req.params);
    const input = assaySampleUpdate.parse(req.body);
    res.json({ data: await assayService.updateSample(id, input, actorOf(req)) });
  }),

  removeSample: ah(async (req, res) => {
    const { id } = idParams.parse(req.params);
    await assayService.removeSample(id, actorOf(req));
    res.status(204).end();
  }),

  summaryAdmin: ah(async (_req, res) => {
    res.json({ data: await assayService.summaryAdmin() });
  }),

  updateSummary: ah(async (req, res) => {
    const { id } = idParams.parse(req.params);
    const input = assaySummaryUpdate.parse(req.body);
    res.json({ data: await assayService.updateSummary(id, input, actorOf(req)) });
  }),

  /** `text/csv` body (parsed by `csvBody`) → all-or-nothing import into one dataset. */
  importCsv: ah(async (req, res) => {
    const query = assayImportQuery.parse(req.query);
    if (typeof req.body !== 'string') {
      throw new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send the file as text/csv');
    }
    res.json({ data: await assayService.importCsv(req.body, query, actorOf(req)) });
  }),
};
