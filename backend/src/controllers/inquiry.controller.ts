import { inquiryService } from '../services/inquiry.service.js';
import { ah } from '../utils/asyncHandler.js';
import { idParams } from '../validators/common.js';
import { inquiryBody, inquiryListQuery, inquiryStatusBody } from '../validators/public.js';
import { actorOf, visitorOf } from './helpers.js';

export const inquiryController = {
  submit: ah(async (req, res) => {
    const input = inquiryBody.parse(req.body);
    res.status(201).json({ data: await inquiryService.submit(input, visitorOf(req)) });
  }),

  list: ah(async (req, res) => {
    res.json(await inquiryService.list(inquiryListQuery.parse(req.query)));
  }),

  get: ah(async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json({ data: await inquiryService.get(id) });
  }),

  setStatus: ah(async (req, res) => {
    const { id } = idParams.parse(req.params);
    const { status } = inquiryStatusBody.parse(req.body);
    res.json({ data: await inquiryService.setStatus(id, status, actorOf(req)) });
  }),

  exportCsv: ah(async (req, res) => {
    const { status, buyerType } = inquiryListQuery.parse(req.query);
    const csv = await inquiryService.exportCsv({ status, buyerType });
    const day = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="inquiries-${day}.csv"`);
    res.send(csv);
  }),
};
