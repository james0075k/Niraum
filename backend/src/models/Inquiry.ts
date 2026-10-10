import { Schema, model } from 'mongoose';
import { LANGS, type Lang } from './schemas/LocalizedString.js';
import { toJSONOptions } from './shared.js';

export const BUYER_TYPES = ['cement', 'steel_foundry', 'trader', 'investor', 'other'] as const;
export const QUANTITY_UNITS = ['tpm', 'one_off_t'] as const;
export const INQUIRY_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost', 'spam'] as const;
/** What the visitor asked for — `technical_report` = "Request full assay report". */
export const INQUIRY_TOPICS = ['supply', 'technical_report', 'investor_deck'] as const;

/** Bulk-supply / investor inquiry (Phase 4.5 — the site's primary conversion). */
export interface IInquiry {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  buyerType: (typeof BUYER_TYPES)[number];
  topic: (typeof INQUIRY_TOPICS)[number];
  quantity: number | null;
  quantityUnit: (typeof QUANTITY_UNITS)[number] | null;
  deliveryLocation: string;
  specRequirement: string;
  message: string;
  lang: Lang;
  status: (typeof INQUIRY_STATUSES)[number];
  sourcePage: string;
  ip: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

const inquirySchema = new Schema<IInquiry>(
  {
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    buyerType: { type: String, enum: BUYER_TYPES, required: true },
    topic: { type: String, enum: INQUIRY_TOPICS, default: 'supply' },
    quantity: { type: Number, default: null, min: 0 },
    quantityUnit: { type: String, enum: [...QUANTITY_UNITS, null], default: null },
    deliveryLocation: { type: String, default: '' },
    specRequirement: { type: String, default: '' },
    message: { type: String, default: '' },
    lang: { type: String, enum: LANGS, default: 'en' },
    status: { type: String, enum: INQUIRY_STATUSES, default: 'new' },
    sourcePage: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ buyerType: 1, createdAt: -1 });

export const Inquiry = model<IInquiry>('Inquiry', inquirySchema);
