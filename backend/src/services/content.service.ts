import type { FilterQuery, Model, SortOrder } from 'mongoose';
import { rebuild } from '../jobs/rebuild.js';
import {
  adminLocalized,
  isLocalized,
  mergeLocalized,
  resolveLocalized,
  type Lang,
} from '../models/schemas/LocalizedString.js';
import type { ContentBase } from '../models/shared.js';
import { AppError } from '../utils/AppError.js';
import { diffFields } from '../utils/diff.js';
import { listMeta, parseSort, type ListMeta } from '../utils/pagination.js';
import { cleanHtml } from '../utils/sanitize.js';
import { uniqueSlug } from '../utils/slug.js';
import { auditService, type Actor } from './audit.service.js';

type Plain = Record<string, unknown>;
type Sort = Record<string, SortOrder>;

/** How one content type behaves. Everything else is shared. */
export interface ContentConfig<T extends ContentBase> {
  entity: string;
  model: Model<T>;
  /** Field the slug is generated from; omitted for models without slugs (team). */
  slugFrom?: string;
  /** Boolean field that makes a document public (`published`, or `isOpen` for jobs). */
  visibleField: 'published' | 'isOpen';
  /** Extra public conditions, e.g. jobs past their deadline are hidden. */
  publicExtra?: () => Plain;
  /** Converts validated filter params (`status`, `tag`…) to a Mongo filter. */
  filters?: (query: Plain) => Plain;
  sortable: readonly string[];
  publicSort: Sort;
  adminSort: Sort;
  /** Rich-text fields sanitised on every write. */
  richText?: readonly string[];
  /**
   * LocalizedString fields `{ en, ne? }` (Phase 4.5). Public reads resolve them to the
   * requested language; admin reads return English plus `translations`; updates merge.
   */
  localized?: readonly string[];
}

export interface ListInput extends Plain {
  page: number;
  limit: number;
  sort?: string | undefined;
  q?: string | undefined;
  /** Public reads only; defaults to English. */
  lang?: Lang | undefined;
}

export interface AdminListInput extends ListInput {
  state: 'all' | 'draft' | 'published';
  trash?: boolean | undefined;
}

/** Fields never exposed on public endpoints. */
const PUBLIC_EXCLUDE = '-isDeleted -deletedAt -createdBy -updatedBy -__v';

const toPlain = (doc: { toObject(): unknown }): Plain => doc.toObject() as Plain;

/** Lean doc → API shape: `_id` → `id`, no `__v`. */
export function serialize(doc: Plain): Plain {
  const { _id, __v: _v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export function createContentService<T extends ContentBase>(cfg: ContentConfig<T>) {
  const { model, entity, visibleField } = cfg;

  const isVisible = (doc: Plain | null) => !!doc && doc[visibleField] === true && !doc.isDeleted;

  const publicFilter = (): Plain => ({
    isDeleted: false,
    [visibleField]: true,
    ...(cfg.publicExtra?.() ?? {}),
  });

  async function slugFor(source: string, excludeId?: string): Promise<string> {
    return uniqueSlug(source, async (slug) => {
      const filter: Plain = { slug };
      if (excludeId) filter._id = { $ne: excludeId };
      return !!(await model.exists(filter as FilterQuery<T>));
    });
  }

  function cleanInput(input: Plain): Plain {
    const out = { ...input };
    for (const field of cfg.richText ?? []) {
      const value = out[field];
      if (typeof value === 'string') out[field] = cleanHtml(value);
      else if (isLocalized(value)) {
        out[field] = {
          en: cleanHtml(value.en),
          ...(value.ne !== undefined && { ne: cleanHtml(value.ne) }),
        };
      }
    }
    return out;
  }

  const localizedFields = cfg.localized ?? [];
  /** Admin shape: English strings as before + `translations` (only for localized models). */
  const adminView = (doc: Plain): Plain =>
    localizedFields.length ? adminLocalized(doc, localizedFields) : doc;
  const publicView = (doc: Plain, lang: Lang = 'en'): Plain =>
    localizedFields.length ? resolveLocalized(doc, lang) : doc;

  async function list(
    filter: Plain,
    input: ListInput,
    sort: Sort,
    view: (doc: Plain) => Plain,
    projection?: string,
  ) {
    const query: Plain = { ...filter, ...(cfg.filters?.(input) ?? {}) };
    let order = parseSort(input.sort, cfg.sortable, {}) as Sort;
    let score: Plain | undefined;
    if (input.q) {
      query.$text = { $search: input.q };
      score = { score: { $meta: 'textScore' } };
      if (!input.sort) order = { score: { $meta: 'textScore' } } as unknown as Sort;
    }
    if (Object.keys(order).length === 0) order = sort;

    const [docs, total] = await Promise.all([
      model
        .find(query as FilterQuery<T>, score)
        .select(projection ?? '')
        .sort(order)
        .skip((input.page - 1) * input.limit)
        .limit(input.limit)
        .lean<Plain[]>(),
      model.countDocuments(query as FilterQuery<T>),
    ]);
    return {
      data: docs.map((d) => {
        const { score: _s, ...rest } = serialize(d);
        return view(rest);
      }),
      meta: listMeta(input.page, input.limit, total),
    };
  }

  async function findAdmin(id: string) {
    const doc = await model.findById(id);
    if (!doc) throw AppError.notFound(entity);
    return doc;
  }

  return {
    entity,

    listPublic(input: ListInput): Promise<{ data: Plain[]; meta: ListMeta }> {
      return list(
        publicFilter(),
        input,
        cfg.publicSort,
        (d) => publicView(d, input.lang),
        PUBLIC_EXCLUDE,
      );
    },

    async getPublic(slug: string, lang: Lang = 'en'): Promise<Plain> {
      const doc = await model
        .findOne({ ...publicFilter(), slug } as FilterQuery<T>)
        .select(PUBLIC_EXCLUDE)
        .lean<Plain>();
      if (!doc) throw AppError.notFound(entity);
      return publicView(serialize(doc), lang);
    },

    listAdmin(input: AdminListInput) {
      const filter: Plain = { isDeleted: input.trash === true };
      if (input.state === 'published') filter[visibleField] = true;
      if (input.state === 'draft') filter[visibleField] = false;
      return list(filter, input, cfg.adminSort, adminView);
    },

    async getAdmin(id: string): Promise<Plain> {
      const doc = await model.findById(id).lean<Plain>();
      if (!doc) throw AppError.notFound(entity);
      return adminView(serialize(doc));
    },

    async create(input: Plain, actor: Actor): Promise<Plain> {
      const data = cleanInput(input);
      if (cfg.slugFrom) {
        const from = data[cfg.slugFrom];
        const source =
          typeof data.slug === 'string' && data.slug
            ? data.slug
            : isLocalized(from)
              ? from.en
              : from;
        data.slug = await slugFor(String(source ?? ''));
      }
      if (data[visibleField] === true && 'publishedAt' in model.schema.paths && !data.publishedAt) {
        data.publishedAt = new Date();
      }
      if (actor.userId) data.createdBy = data.updatedBy = actor.userId;

      const doc = await model.create(data);
      const created = adminView(serialize(toPlain(doc)));
      await auditService.record(actor, {
        action: 'create',
        entity,
        entityId: String(doc._id),
        diff: diffFields(null, created),
      });
      if (isVisible(created)) {
        await auditService.record(actor, { action: 'publish', entity, entityId: String(doc._id) });
        rebuild.schedule(`${entity} created`);
      }
      return created;
    },

    async update(id: string, input: Plain, actor: Actor): Promise<Plain> {
      const doc = await findAdmin(id);
      const before = toPlain(doc);
      const data = cleanInput(input);
      for (const field of localizedFields) {
        if (field in data) data[field] = mergeLocalized(before[field], data[field]);
      }

      if (cfg.slugFrom && typeof data.slug === 'string' && data.slug !== before.slug) {
        // Slugs only change on request — published URLs stay stable when a title is edited.
        data.slug = await slugFor(data.slug, id);
      }
      const becomesVisible = data[visibleField] === true && before[visibleField] !== true;
      if (becomesVisible && 'publishedAt' in model.schema.paths && !before.publishedAt) {
        data.publishedAt = new Date();
      }
      if (actor.userId) data.updatedBy = actor.userId;

      doc.set(data);
      await doc.save();
      const after = toPlain(doc);

      await auditService.record(actor, {
        action: 'update',
        entity,
        entityId: id,
        diff: diffFields(before, after),
      });
      if (isVisible(before) !== isVisible(after)) {
        await auditService.record(actor, {
          action: isVisible(after) ? 'publish' : 'unpublish',
          entity,
          entityId: id,
        });
      }
      if (isVisible(before) || isVisible(after)) rebuild.schedule(`${entity} updated`);
      return adminView(serialize(after));
    },

    /** Soft delete: hidden everywhere except the admin trash; slug stays reserved. */
    async remove(id: string, actor: Actor): Promise<void> {
      const doc = await findAdmin(id);
      if (doc.get('isDeleted') === true) return;
      const wasVisible = isVisible(toPlain(doc));
      doc.set({ isDeleted: true, deletedAt: new Date() });
      await doc.save();
      await auditService.record(actor, { action: 'delete', entity, entityId: id });
      if (wasVisible) rebuild.schedule(`${entity} deleted`);
    },

    async restore(id: string, actor: Actor): Promise<Plain> {
      const doc = await findAdmin(id);
      doc.set({ isDeleted: false, deletedAt: null });
      await doc.save();
      const after = toPlain(doc);
      await auditService.record(actor, { action: 'restore', entity, entityId: id });
      if (isVisible(after)) rebuild.schedule(`${entity} restored`);
      return adminView(serialize(after));
    },

    /** Slugs + updatedAt of every public document (sitemap generation). */
    async sitemapEntries(): Promise<{ slug: string; updatedAt: Date }[]> {
      return model
        .find(publicFilter() as FilterQuery<T>)
        .select('slug updatedAt -_id')
        .sort({ updatedAt: -1 })
        .limit(5000)
        .lean<{ slug: string; updatedAt: Date }[]>();
    },
  };
}

export type ContentService = ReturnType<typeof createContentService>;
