import { settingsAdminView, settingsService } from '../services/settings.service.js';
import { ah } from '../utils/asyncHandler.js';
import { langQuery } from '../validators/common.js';
import { geocodeBody, settingsUpdateBody } from '../validators/settings.js';
import { actorOf } from './helpers.js';

export const settingsController = {
  /** ETag + short cache; `If-None-Match` → 304 so the site revalidates cheaply. */
  getPublic: ah(async (req, res) => {
    const { lang } = langQuery.parse(req.query);
    const { body, etag } = await settingsService.getPublic(lang);
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    if (req.get('if-none-match') === etag) {
      res.status(304).end();
      return;
    }
    res.json({ data: body });
  }),

  getAdmin: ah(async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: settingsAdminView(await settingsService.get()) });
  }),

  update: ah(async (req, res) => {
    const input = settingsUpdateBody.parse(req.body);
    const { settings, warnings } = await settingsService.update(input, actorOf(req));
    res.json({ data: settings, meta: { warnings } });
  }),

  geocode: ah(async (req, res) => {
    const { address } = geocodeBody.parse(req.body);
    const result = await settingsService.previewGeocode(address);
    res.json({ data: result });
  }),
};
