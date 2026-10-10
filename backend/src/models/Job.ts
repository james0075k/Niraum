import { Schema, model } from 'mongoose';
import { localizedPath, type LocalizedString } from './schemas/LocalizedString.js';
import {
  contentBaseFields,
  seoSchema,
  toJSONOptions,
  type ContentBase,
  type Seo,
} from './shared.js';

export const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship'] as const;

export interface IJob extends ContentBase {
  title: LocalizedString;
  slug: string;
  department: string;
  location: string;
  type: (typeof JOB_TYPES)[number];
  description: LocalizedString;
  requirements: string[];
  deadline: Date | null;
  /** Public visibility flag for jobs (this model's "published"). */
  isOpen: boolean;
  publishedAt: Date | null;
  seo?: Seo;
}

const jobSchema = new Schema<IJob>(
  {
    title: localizedPath({ required: true, maxlength: 150 }),
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    department: { type: String, default: '' },
    location: { type: String, default: '' },
    type: { type: String, enum: JOB_TYPES, default: 'full-time' },
    description: localizedPath(),
    requirements: { type: [String], default: [] },
    deadline: { type: Date, default: null },
    isOpen: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    seo: seoSchema,
    ...contentBaseFields,
  },
  { timestamps: true, toJSON: toJSONOptions },
);

jobSchema.index({ isOpen: 1, deadline: 1 });
jobSchema.index({
  'title.en': 'text',
  'title.ne': 'text',
  'description.en': 'text',
  'description.ne': 'text',
});
jobSchema.index({ publishedAt: -1 });

export const Job = model<IJob>('Job', jobSchema);
