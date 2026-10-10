import { escapeRegex } from '../utils/pagination.js';
import { Deposit } from '../models/Deposit.js';
import { Job } from '../models/Job.js';
import { Post } from '../models/Post.js';
import { Project } from '../models/Project.js';
import { Product } from '../models/Product.js';
import { Service } from '../models/Service.js';
import { TeamMember } from '../models/TeamMember.js';
import { createContentService } from './content.service.js';

type Plain = Record<string, unknown>;

/** Copies the defined keys of `query` into a filter. */
const pick =
  (...keys: string[]) =>
  (query: Plain): Plain => {
    const out: Plain = {};
    for (const k of keys) if (query[k] !== undefined) out[k] = query[k];
    return out;
  };

export const projectService = createContentService({
  entity: 'Project',
  model: Project,
  slugFrom: 'title',
  visibleField: 'published',
  filters: pick('status', 'mineral', 'featured'),
  sortable: ['createdAt', 'updatedAt', 'publishedAt', 'title'],
  publicSort: { featured: -1, publishedAt: -1, createdAt: -1 },
  adminSort: { updatedAt: -1 },
  richText: ['body'],
  localized: ['title', 'summary', 'body'],
});

export const postService = createContentService({
  entity: 'Post',
  model: Post,
  slugFrom: 'title',
  visibleField: 'published',
  filters: (q) => (q.tag ? { tags: q.tag } : {}),
  sortable: ['createdAt', 'updatedAt', 'publishedAt', 'title'],
  publicSort: { publishedAt: -1 },
  adminSort: { updatedAt: -1 },
  richText: ['body'],
  localized: ['title', 'excerpt', 'body'],
});

export const jobService = createContentService({
  entity: 'Job',
  model: Job,
  slugFrom: 'title',
  visibleField: 'isOpen',
  // Past-deadline jobs disappear from the site without anyone unpublishing them.
  publicExtra: () => ({
    $or: [{ deadline: null }, { deadline: { $gte: new Date() } }],
  }),
  filters: (q) => {
    const out: Plain = {};
    if (typeof q.department === 'string') {
      out.department = new RegExp(`^${escapeRegex(q.department)}$`, 'i');
    }
    if (q.type) out.type = q.type;
    return out;
  },
  sortable: ['createdAt', 'updatedAt', 'deadline', 'title'],
  publicSort: { createdAt: -1 },
  adminSort: { updatedAt: -1 },
  richText: ['description'],
  localized: ['title', 'description'],
});

export const teamService = createContentService({
  entity: 'TeamMember',
  model: TeamMember,
  visibleField: 'published',
  sortable: ['order', 'name', 'createdAt'],
  publicSort: { order: 1, name: 1 },
  adminSort: { order: 1, name: 1 },
  localized: ['role', 'bio', 'otherVentures'],
});

export const serviceService = createContentService({
  entity: 'Service',
  model: Service,
  slugFrom: 'title',
  visibleField: 'published',
  sortable: ['order', 'title', 'createdAt'],
  publicSort: { order: 1 },
  adminSort: { order: 1 },
  richText: ['body'],
  localized: ['title', 'summary', 'body'],
});

// ── Phase 4.5 ───────────────────────────────────────────────────────────────
export const productService = createContentService({
  entity: 'Product',
  model: Product,
  slugFrom: 'name',
  visibleField: 'published',
  sortable: ['order', 'createdAt', 'updatedAt'],
  publicSort: { order: 1, createdAt: 1 },
  adminSort: { order: 1, updatedAt: -1 },
  localized: ['name', 'summary', 'applications', 'typicalChemistry'],
});

export const depositService = createContentService({
  entity: 'Deposit',
  model: Deposit,
  slugFrom: 'name',
  visibleField: 'published',
  sortable: ['createdAt', 'updatedAt'],
  publicSort: { createdAt: 1 },
  adminSort: { updatedAt: -1 },
  localized: ['name', 'summary', 'location', 'areas', 'geologySummary', 'statusText'],
});
