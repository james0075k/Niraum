import { Schema, model, type Types } from 'mongoose';
import { toJSONOptions } from './shared.js';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'publish'
  | 'unpublish'
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'password_change'
  | 'password_reset'
  | 'upload';

export interface IAuditLog {
  user: Types.ObjectId | null;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  diff: Record<string, unknown>;
  ip: string;
  at: Date;
}

const auditSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, default: null },
    diff: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    at: { type: Date, default: () => new Date() },
  },
  { versionKey: false, toJSON: toJSONOptions, minimize: false },
);

auditSchema.index({ entity: 1, entityId: 1 });
auditSchema.index({ at: -1 });

// Append-only: refuse updates and deletes through Mongoose.
const blocked = [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
] as const;
for (const op of blocked) {
  auditSchema.pre(op, () => {
    throw new Error('AuditLog is append-only');
  });
}

export const AuditLog = model<IAuditLog>('AuditLog', auditSchema);
