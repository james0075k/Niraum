import { Schema, model } from 'mongoose';
import {
  contentBaseFields,
  imageSchema,
  seoSchema,
  toJSONOptions,
  type ContentBase,
  type ImageRef,
  type Seo,
} from './shared.js';

export const MINERALS = ['iron-ore', 'metal-minerals', 'stone-aggregates'] as const;
export const PROJECT_STATUSES = ['exploration', 'development', 'operating', 'completed'] as const;

export interface IProject extends ContentBase {
  title: string;
  slug: string;
  mineral: (typeof MINERALS)[number];
  status: (typeof PROJECT_STATUSES)[number];
  location: { name: string; district: string; lat?: number; lng?: number };
  summary: string;
  body: string;
  facts: { label: string; value: string }[];
  coverImage: ImageRef | null;
  gallery: ImageRef[];
  featured: boolean;
  published: boolean;
  publishedAt: Date | null;
  isSample: boolean;
  seo?: Seo;
}

const projectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mineral: { type: String, enum: MINERALS, required: true },
    status: { type: String, enum: PROJECT_STATUSES, default: 'exploration' },
    location: {
      name: { type: String, default: '' },
      district: { type: String, default: '' },
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
    summary: { type: String, default: '', maxlength: 300 },
    body: { type: String, default: '' },
    facts: {
      type: [new Schema({ label: String, value: String }, { _id: false })],
      default: [],
    },
    coverImage: { type: imageSchema, default: null },
    gallery: { type: [imageSchema], default: [] },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    isSample: { type: Boolean, default: false },
    seo: seoSchema,
    ...contentBaseFields,
  },
  { timestamps: true, toJSON: toJSONOptions },
);

projectSchema.index({ title: 'text', summary: 'text' }, { weights: { title: 5, summary: 1 } });
projectSchema.index({ published: 1, featured: 1, createdAt: -1 });
projectSchema.index({ publishedAt: -1 });

export const Project = model<IProject>('Project', projectSchema);
