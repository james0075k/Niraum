import { applicationService } from '../services/application.service.js';
import { contactService } from '../services/contact.service.js';
import { newsletterService } from '../services/newsletter.service.js';
import { seoService } from '../services/seo.service.js';
import { ah } from '../utils/asyncHandler.js';
import { applicationBody, contactBody, newsletterBody, tokenQuery } from '../validators/public.js';
import { visitorOf } from './helpers.js';

export const publicController = {
  contact: ah(async (req, res) => {
    const input = contactBody.parse(req.body);
    res.status(201).json({ data: await contactService.submit(input, visitorOf(req)) });
  }),

  apply: ah(async (req, res) => {
    const input = applicationBody.parse(req.body);
    res
      .status(201)
      .json({ data: await applicationService.submit(input, req.file, visitorOf(req)) });
  }),

  subscribe: ah(async (req, res) => {
    const { email, source, website } = newsletterBody.parse(req.body);
    if (!website) await newsletterService.subscribe(email, source);
    res.status(202).json({ data: { message: 'Check your inbox to confirm your subscription.' } });
  }),

  confirmNewsletter: ah(async (req, res) => {
    const parsed = tokenQuery.safeParse(req.query);
    const to = parsed.success
      ? await newsletterService.confirm(parsed.data.token)
      : await newsletterService.confirm('0'.repeat(64));
    res.redirect(303, to);
  }),

  unsubscribeNewsletter: ah(async (req, res) => {
    const parsed = tokenQuery.safeParse(req.query);
    const to = await newsletterService.unsubscribe(
      parsed.success ? parsed.data.token : '0'.repeat(64),
    );
    res.redirect(303, to);
  }),

  sitemapData: ah(async (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({ data: await seoService.sitemapData() });
  }),
};
