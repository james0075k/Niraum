import { assayService } from '../services/assay.service.js';
import { ah } from '../utils/asyncHandler.js';
import { assaySamplesQuery } from '../validators/assay.js';

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
};
