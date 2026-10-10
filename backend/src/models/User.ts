import { Schema, model, type HydratedDocument } from 'mongoose';
import { toJSONOptions } from './shared.js';

export const ROLES = ['superadmin', 'admin', 'editor'] as const;
export type Role = (typeof ROLES)[number];

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: Date | null;
  failedLoginCount: number;
  lockUntil: Date | null;
  refreshTokenVersion: number;
  mustChangePassword: boolean;
  passwordChangedAt: Date | null;
  resetTokenHash: string | null;
  resetTokenExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'editor' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    failedLoginCount: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    refreshTokenVersion: { type: Number, default: 0 },
    mustChangePassword: { type: Boolean, default: false },
    passwordChangedAt: { type: Date, default: null },
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpires: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      ...toJSONOptions,
      transform(_doc: unknown, ret: Record<string, unknown>) {
        delete ret._id;
        delete ret.passwordHash;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpires;
        delete ret.refreshTokenVersion;
        return ret;
      },
    },
  },
);

export type UserDoc = HydratedDocument<IUser>;
export const User = model<IUser>('User', userSchema);
