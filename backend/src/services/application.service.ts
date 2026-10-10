import { env } from '../config/env.js';
import { pickLang, type LocalizedString } from '../models/schemas/LocalizedString.js';
import { mailer } from '../config/mailer.js';
import { storage } from '../config/cloudinary.js';
import { Application, type IApplication } from '../models/Application.js';
import { Job } from '../models/Job.js';
import { checkFile } from '../middlewares/upload.js';
import { AppError } from '../utils/AppError.js';
import { listMeta } from '../utils/pagination.js';
import type { ApplicationBody } from '../validators/public.js';
import { auditService, type Actor } from './audit.service.js';
import { captchaService } from './captcha.service.js';
import type { VisitorMeta } from './contact.service.js';

export const applicationService = {
  /** Validates the CV (PDF, magic bytes, ≤ 5 MB), stores it privately and emails HR. */
  async submit(
    input: ApplicationBody,
    file: Express.Multer.File | undefined,
    visitor: VisitorMeta,
  ): Promise<{ id: string | null }> {
    // Honeypot: pretend success, store nothing.
    if (input.website) return { id: null };
    const { file: cvFile } = checkFile(file, ['application/pdf']);
    await captchaService.verify(input.captchaToken, visitor.ip);

    let job: { _id: unknown; title: LocalizedString } | null = null;
    if (input.job) {
      job = await Job.findOne({
        slug: input.job,
        isOpen: true,
        isDeleted: false,
        $or: [{ deadline: null }, { deadline: { $gte: new Date() } }],
      })
        .select('title')
        .lean<{ _id: unknown; title: LocalizedString }>();
      if (!job) throw AppError.badRequest('This position is no longer open');
    }

    const cv = await storage.upload(cvFile.buffer, {
      subfolder: 'applications',
      resourceType: 'raw',
      private: true,
    });
    const app = await Application.create({
      job: job?._id ?? null,
      jobTitle: job ? pickLang(job.title, 'en') : 'General application',
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message ?? '',
      cvPublicId: cv.publicId,
      cvBytes: cv.bytes,
      ip: visitor.ip,
    });

    mailer.sendInBackground({
      to: env.HR_INBOX ?? env.CONTACT_INBOX,
      replyTo: input.email,
      subject: `[Careers] ${app.jobTitle} — ${input.name}`,
      text:
        `New job application\n\nPosition: ${app.jobTitle}\nName: ${input.name}\n` +
        `Email: ${input.email}\nPhone: ${input.phone}\n\n${input.message || ''}\n\n` +
        `Open the admin panel to download the CV.\n`,
    });
    mailer.sendInBackground({
      to: input.email,
      subject: 'We received your application — Niraum Metals',
      text:
        `Hello ${input.name},\n\nThank you for applying (${app.jobTitle}). ` +
        `Our team will review your CV and contact you if your profile matches.\n\n— Niraum Metals\n`,
    });
    return { id: String(app._id) };
  },

  async list(query: { page: number; limit: number; status?: string | undefined }) {
    const filter = query.status ? { status: query.status } : {};
    const [docs, total] = await Promise.all([
      Application.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Application.countDocuments(filter),
    ]);
    return { data: docs.map((d) => d.toJSON()), meta: listMeta(query.page, query.limit, total) };
  },

  /** Single application with a short-lived signed CV link. */
  async get(id: string) {
    const doc = await Application.findById(id);
    if (!doc) throw AppError.notFound('Application');
    let cvUrl: string | null;
    try {
      cvUrl = storage.signedUrl(doc.cvPublicId, 'raw');
    } catch {
      cvUrl = null; // storage not configured (development)
    }
    return { ...doc.toJSON(), cvUrl };
  },

  async setStatus(id: string, status: IApplication['status'], actor: Actor) {
    const doc = await Application.findById(id);
    if (!doc) throw AppError.notFound('Application');
    const from = doc.status;
    doc.status = status;
    await doc.save();
    await auditService.record(actor, {
      action: 'update',
      entity: 'Application',
      entityId: id,
      diff: { status: { from, to: status } },
    });
    return doc.toJSON();
  },
};
