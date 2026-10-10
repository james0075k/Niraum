import { Schema, model } from 'mongoose';
import { toJSONOptions } from './shared.js';

export interface ISubscriber {
  email: string;
  status: 'pending' | 'subscribed' | 'unsubscribed';
  /** sha256 of the emailed confirm/unsubscribe token. */
  tokenHash: string;
  tokenExpires: Date | null;
  source: string;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const subscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ['pending', 'subscribed', 'unsubscribed'], default: 'pending' },
    tokenHash: { type: String, required: true, index: true, select: false },
    tokenExpires: { type: Date, default: null },
    source: { type: String, default: 'website' },
    confirmedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

export const Subscriber = model<ISubscriber>('Subscriber', subscriberSchema);
