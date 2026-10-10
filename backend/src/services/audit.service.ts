import { Types } from 'mongoose';
import { logger } from '../config/logger.js';
import { AuditLog, type AuditAction } from '../models/AuditLog.js';
import { listMeta, type ListMeta } from '../utils/pagination.js';

/** Who did it and from where — passed from controllers into services. */
export interface Actor {
  userId: string | null;
  ip: string;
}

export interface AuditEntry {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  diff?: Record<string, unknown>;
}

export const auditService = {
  /** Never throws: a failed audit write is logged loudly but must not break the request. */
  async record(actor: Actor, entry: AuditEntry): Promise<void> {
    try {
      await AuditLog.create({
        user: actor.userId && Types.ObjectId.isValid(actor.userId) ? actor.userId : null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        diff: entry.diff ?? {},
        ip: actor.ip,
      });
    } catch (err) {
      logger.error({ err, entry }, 'Audit log write failed');
    }
  },

  async list(query: {
    page: number;
    limit: number;
    entity?: string | undefined;
    entityId?: string | undefined;
    user?: string | undefined;
  }): Promise<{ data: unknown[]; meta: ListMeta }> {
    const filter: Record<string, unknown> = {};
    if (query.entity) filter.entity = query.entity;
    if (query.entityId) filter.entityId = query.entityId;
    if (query.user) filter.user = query.user;
    const [docs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ at: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate('user', 'name email role'),
      AuditLog.countDocuments(filter),
    ]);
    return { data: docs.map((d) => d.toJSON()), meta: listMeta(query.page, query.limit, total) };
  },
};
