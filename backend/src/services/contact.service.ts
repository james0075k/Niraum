import { env } from '../config/env.js';
import { pickLang } from '../models/schemas/LocalizedString.js';
import { mailer } from '../config/mailer.js';
import { Message, type IMessage } from '../models/Message.js';
import { AppError } from '../utils/AppError.js';
import { listMeta } from '../utils/pagination.js';
import type { ContactBody } from '../validators/public.js';
import { auditService, type Actor } from './audit.service.js';
import { captchaService } from './captcha.service.js';
import { settingsService } from './settings.service.js';

export interface VisitorMeta {
  ip: string;
  userAgent: string;
}

export const contactService = {
  /**
   * Stores the message, notifies CONTACT_INBOX and sends the visitor an auto-reply.
   * Honeypot hits are stored as spam and get the same 201 (so bots learn nothing) but no email.
   */
  async submit(input: ContactBody, visitor: VisitorMeta): Promise<{ id: string }> {
    const isSpam = !!input.website;
    if (!isSpam) await captchaService.verify(input.captchaToken, visitor.ip);

    const msg = await Message.create({
      name: input.name,
      email: input.email,
      phone: input.phone ?? '',
      company: input.company ?? '',
      subject: input.subject,
      message: input.message,
      ip: visitor.ip,
      userAgent: visitor.userAgent.slice(0, 300),
      status: isSpam ? 'spam' : 'new',
    });
    if (isSpam) return { id: String(msg._id) };

    const { body: site } = await settingsService.getPublic();
    mailer.sendInBackground({
      to: env.CONTACT_INBOX,
      replyTo: input.email,
      subject: `[Website] ${input.subject}`,
      text:
        `New message from the website contact form\n\n` +
        `Name: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone || '—'}\n` +
        `Company: ${input.company || '—'}\n\n${input.message}\n`,
    });
    mailer.sendInBackground({
      to: input.email,
      subject: `We received your message — ${site.companyName}`,
      text:
        `Hello ${input.name},\n\nThank you for contacting ${site.companyName}. ` +
        `We have received your message "${input.subject}" and will reply as soon as we can.\n\n` +
        `— ${site.companyName}\n${pickLang(site.motto, 'en')}\n\n` +
        `This is an automatic reply; you don't need to answer it.\n`,
    });
    return { id: String(msg._id) };
  },

  async list(query: { page: number; limit: number; status?: string | undefined }) {
    const filter = query.status ? { status: query.status } : {};
    const [docs, total] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Message.countDocuments(filter),
    ]);
    return { data: docs.map((d) => d.toJSON()), meta: listMeta(query.page, query.limit, total) };
  },

  async setStatus(id: string, status: IMessage['status'], actor: Actor) {
    const msg = await Message.findById(id);
    if (!msg) throw AppError.notFound('Message');
    const from = msg.status;
    msg.status = status;
    await msg.save();
    await auditService.record(actor, {
      action: 'update',
      entity: 'Message',
      entityId: id,
      diff: { status: { from, to: status } },
    });
    return msg.toJSON();
  },
};
