import { Application } from '../models/Application.js';
import { AssaySample } from '../models/AssaySample.js';
import { AssaySummary } from '../models/AssaySummary.js';
import { Deposit } from '../models/Deposit.js';
import { Inquiry } from '../models/Inquiry.js';
import { Message } from '../models/Message.js';
import { Product } from '../models/Product.js';
import { Service } from '../models/Service.js';
import { SETTINGS_ID, SiteSettings } from '../models/SiteSettings.js';
import { TeamMember } from '../models/TeamMember.js';
import { auditService } from '../services/audit.service.js';
import { ah } from '../utils/asyncHandler.js';

interface PublishCounts {
  published: number;
  draft: number;
}

/** Live (not soft-deleted) published / draft counts for a content model. */
async function publishCounts(model: {
  countDocuments(filter: Record<string, unknown>): PromiseLike<number>;
}): Promise<PublishCounts> {
  const live = { isDeleted: { $ne: true } };
  const [published, draft] = await Promise.all([
    model.countDocuments({ ...live, published: true }),
    model.countDocuments({ ...live, published: { $ne: true } }),
  ]);
  return { published, draft };
}

/** Everyone with admin access sees content counts; admin+ also gets inbox + activity. */
export const dashboardController = {
  stats: ah(async (req, res) => {
    const isAdminPlus = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    const [products, deposits, team, services, samples, summaries, settings] = await Promise.all([
      publishCounts(Product),
      publishCounts(Deposit),
      publishCounts(TeamMember),
      publishCounts(Service),
      AssaySample.countDocuments({}),
      AssaySummary.countDocuments({}),
      SiteSettings.findById(SETTINGS_ID).select('publicAssayDetail').lean(),
    ]);

    const data: Record<string, unknown> = {
      content: { products, deposits, team, services },
      assay: { samples, summaries, publicDetail: settings?.publicAssayDetail === true },
    };

    if (isAdminPlus) {
      const [inquiriesNew, messagesNew, applicationsNew, recent] = await Promise.all([
        Inquiry.countDocuments({ status: 'new' }),
        Message.countDocuments({ status: 'new' }),
        Application.countDocuments({ status: 'new' }),
        auditService.list({ page: 1, limit: 10 }),
      ]);
      data.inbox = { inquiriesNew, messagesNew, applicationsNew };
      data.recent = recent.data;
    }

    res.json({ data });
  }),
};
