import { env } from '../config/env.js';
import { mailer } from '../config/mailer.js';
import { INQUIRY_STATUSES, Inquiry, type IInquiry } from '../models/Inquiry.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex, listMeta } from '../utils/pagination.js';
import type { InquiryBody } from '../validators/public.js';
import { auditService, type Actor } from './audit.service.js';
import { captchaService } from './captcha.service.js';
import type { VisitorMeta } from './contact.service.js';
import { settingsService } from './settings.service.js';

const BUYER_LABEL: Record<IInquiry['buyerType'], string> = {
  cement: 'Cement plant',
  steel_foundry: 'Steel or foundry',
  trader: 'Mineral trader',
  investor: 'Investor',
  other: 'Other',
};
const TOPIC_LABEL: Record<IInquiry['topic'], string> = {
  supply: 'Bulk supply',
  technical_report: 'Full assay report',
  investor_deck: 'Investor deck',
};
const UNIT_LABEL = { tpm: 'tonnes per month', one_off_t: 'tonnes (one-off)' } as const;

/** Auto-reply in the visitor's language. Nepali text: native-speaker review pending. */
function autoReply(i: IInquiry, company: string, motto: string) {
  if (i.lang === 'ne') {
    return {
      subject: `तपाईंको सोधपुछ प्राप्त भयो — ${company}`,
      text:
        `नमस्ते ${i.contactName} ज्यू,\n\n${company} मा सोधपुछ पठाउनुभएकोमा धन्यवाद। ` +
        `हामीले तपाईंको अनुरोध प्राप्त गरेका छौँ र छिट्टै सम्पर्क गर्नेछौँ।\n\n` +
        `— ${company}\n${motto}\n\nयो स्वचालित जवाफ हो।\n`,
    };
  }
  return {
    subject: `We received your inquiry — ${company}`,
    text:
      `Hello ${i.contactName},\n\nThank you for your inquiry to ${company}. ` +
      `We have received your request (${TOPIC_LABEL[i.topic].toLowerCase()}) and will reply ` +
      `as soon as we can.\n\n— ${company}\n${motto}\n\n` +
      `This is an automatic reply; you don't need to answer it.\n`,
  };
}

const csvCell = (v: unknown) => {
  const s = v instanceof Date ? v.toISOString() : v == null ? '' : String(v);
  // Quote everything; neutralise spreadsheet formulas (CSV injection).
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

const CSV_COLUMNS: (keyof IInquiry | 'id')[] = [
  'id',
  'createdAt',
  'status',
  'topic',
  'buyerType',
  'companyName',
  'contactName',
  'email',
  'phone',
  'quantity',
  'quantityUnit',
  'deliveryLocation',
  'specRequirement',
  'message',
  'lang',
  'sourcePage',
];

interface InquiryFilter {
  status?: string | undefined;
  buyerType?: string | undefined;
  q?: string | undefined;
}

/** Filter shared by list, counts and CSV (everything except `status`). */
function baseFilter(query: InquiryFilter): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (query.buyerType) filter.buyerType = query.buyerType;
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ companyName: rx }, { contactName: rx }, { email: rx }];
  }
  return filter;
}

export const inquiryService = {
  /**
   * Stores the inquiry, emails CONTACT_INBOX (+ INQUIRY_CC) and auto-replies in the visitor's
   * language. Honeypot hits are stored as spam with the same 201 and no email.
   */
  async submit(input: InquiryBody, visitor: VisitorMeta): Promise<{ id: string }> {
    const isSpam = !!input.website;
    if (!isSpam) await captchaService.verify(input.captchaToken, visitor.ip);

    const doc = await Inquiry.create({
      companyName: input.companyName,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      buyerType: input.buyerType,
      topic: input.topic,
      quantity: input.quantity ?? null,
      quantityUnit: input.quantity !== undefined ? (input.quantityUnit ?? null) : null,
      deliveryLocation: input.deliveryLocation ?? '',
      specRequirement: input.specRequirement ?? '',
      message: input.message ?? '',
      lang: input.lang,
      sourcePage: input.sourcePage ?? '',
      ip: visitor.ip,
      userAgent: visitor.userAgent.slice(0, 300),
      status: isSpam ? 'spam' : 'new',
    });
    if (isSpam) return { id: String(doc._id) };

    const { body: site } = await settingsService.getPublic(input.lang);
    const qty =
      doc.quantity !== null
        ? `${doc.quantity} ${doc.quantityUnit ? UNIT_LABEL[doc.quantityUnit] : ''}`
        : '—';
    mailer.sendInBackground({
      to: env.CONTACT_INBOX,
      ...(env.INQUIRY_CC && { cc: env.INQUIRY_CC }),
      replyTo: doc.email,
      subject: `[Inquiry] ${TOPIC_LABEL[doc.topic]} — ${doc.companyName} (${BUYER_LABEL[doc.buyerType]})`,
      text:
        `New ${TOPIC_LABEL[doc.topic].toLowerCase()} inquiry from the website (${doc.lang})\n\n` +
        `Company: ${doc.companyName}\nContact: ${doc.contactName}\nEmail: ${doc.email}\n` +
        `Phone: ${doc.phone}\nBuyer type: ${BUYER_LABEL[doc.buyerType]}\nQuantity: ${qty}\n` +
        `Delivery: ${doc.deliveryLocation || '—'}\nSpecification: ${doc.specRequirement || '—'}\n` +
        `Page: ${doc.sourcePage || '—'}\n\n${doc.message}\n`,
    });
    mailer.sendInBackground({ to: doc.email, ...autoReply(doc, site.companyName, site.motto) });
    return { id: String(doc._id) };
  },

  /**
   * Newest first. `q` matches company, contact name or email (case-insensitive, literal);
   * `meta.counts` gives the number per status for the same `q`/`buyerType` but ignoring the
   * status filter, so the admin pipeline header can show every stage at once.
   */
  async list(query: InquiryFilter & { page: number; limit: number }) {
    const base = baseFilter(query);
    const filter = query.status ? { ...base, status: query.status } : base;
    const [docs, total, grouped] = await Promise.all([
      Inquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Inquiry.countDocuments(filter),
      Inquiry.aggregate<{ _id: IInquiry['status']; n: number }>([
        { $match: base },
        { $group: { _id: '$status', n: { $sum: 1 } } },
      ]),
    ]);
    const counts = Object.fromEntries(INQUIRY_STATUSES.map((st) => [st, 0])) as Record<
      IInquiry['status'],
      number
    >;
    for (const g of grouped) counts[g._id] = g.n;
    return {
      data: docs.map((d) => d.toJSON()),
      meta: { ...listMeta(query.page, query.limit, total), counts },
    };
  },

  async get(id: string) {
    const doc = await Inquiry.findById(id);
    if (!doc) throw AppError.notFound('Inquiry');
    return doc.toJSON();
  },

  async setStatus(id: string, status: IInquiry['status'], actor: Actor) {
    const doc = await Inquiry.findById(id);
    if (!doc) throw AppError.notFound('Inquiry');
    const from = doc.status;
    doc.status = status;
    await doc.save();
    await auditService.record(actor, {
      action: 'update',
      entity: 'Inquiry',
      entityId: id,
      diff: { status: { from, to: status } },
    });
    return doc.toJSON();
  },

  /** CSV for follow-up in a spreadsheet (UTF-8 BOM so Excel shows Nepali correctly). */
  async exportCsv(query: InquiryFilter) {
    const base = baseFilter(query);
    const filter = query.status ? { ...base, status: query.status } : base;
    const docs = await Inquiry.find(filter).sort({ createdAt: -1 }).limit(10_000).lean();
    const lines = docs.map((d) =>
      CSV_COLUMNS.map((c) => csvCell(c === 'id' ? String(d._id) : d[c])).join(','),
    );
    return `\uFEFF${CSV_COLUMNS.join(',')}\r\n${lines.join('\r\n')}\r\n`;
  },
};
