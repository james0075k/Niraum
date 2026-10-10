import { Schema, model, type Types } from 'mongoose';
import { toJSONOptions } from './shared.js';

export const APPLICATION_STATUSES = [
  'new',
  'reviewing',
  'shortlisted',
  'rejected',
  'hired',
] as const;

export interface IApplication {
  /** Null for a general (speculative) application. */
  job: Types.ObjectId | null;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  /** Private Cloudinary raw file — admins get a signed URL on read. */
  cvPublicId: string;
  cvBytes: number;
  status: (typeof APPLICATION_STATUSES)[number];
  ip: string;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', default: null },
    jobTitle: { type: String, default: 'General application' },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    message: { type: String, default: '' },
    cvPublicId: { type: String, required: true },
    cvBytes: { type: Number, default: 0 },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'new' },
    ip: { type: String, default: '' },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

applicationSchema.index({ job: 1, createdAt: -1 });
applicationSchema.index({ status: 1, createdAt: -1 });

export const Application = model<IApplication>('Application', applicationSchema);
