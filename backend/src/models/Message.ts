import { Schema, model } from 'mongoose';
import { toJSONOptions } from './shared.js';

export const MESSAGE_STATUSES = ['new', 'read', 'replied', 'spam'] as const;

export interface IMessage {
  name: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
  ip: string;
  userAgent: string;
  status: (typeof MESSAGE_STATUSES)[number];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, default: '' },
    company: { type: String, default: '' },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    status: { type: String, enum: MESSAGE_STATUSES, default: 'new' },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

messageSchema.index({ status: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', messageSchema);
