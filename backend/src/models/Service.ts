import { Schema, model } from 'mongoose';
import { localizedPath, type LocalizedString } from './schemas/LocalizedString.js';
import {
  contentBaseFields,
  imageSchema,
  toJSONOptions,
  type ContentBase,
  type ImageRef,
} from './shared.js';

export const SERVICE_ICONS = ['pickaxe', 'gem', 'mountain', 'truck'] as const;

export interface ServiceStat {
  label: string;
  value: number | null;
  suffix?: string;
  placeholder?: string;
}

export interface IService extends ContentBase {
  title: LocalizedString;
  slug: string;
  icon: (typeof SERVICE_ICONS)[number];
  summary: LocalizedString;
  body: LocalizedString;
  image: ImageRef | null;
  highlights: string[];
  stats: ServiceStat[];
  gallery: ImageRef[];
  order: number;
  published: boolean;
}

const serviceSchema = new Schema<IService>(
  {
    title: localizedPath({ required: true, maxlength: 150 }),
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon: { type: String, enum: SERVICE_ICONS, default: 'pickaxe' },
    summary: localizedPath({ maxlength: 300 }),
    body: localizedPath(),
    image: { type: imageSchema, default: null },
    highlights: { type: [String], default: [] },
    stats: {
      type: [
        new Schema<ServiceStat>(
          {
            label: String,
            value: { type: Number, default: null },
            suffix: String,
            placeholder: String,
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    gallery: { type: [imageSchema], default: [] },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
    ...contentBaseFields,
  },
  { timestamps: true, toJSON: toJSONOptions },
);

serviceSchema.index({ published: 1, order: 1 });
serviceSchema.index({
  'title.en': 'text',
  'title.ne': 'text',
  'summary.en': 'text',
  'summary.ne': 'text',
});

export const Service = model<IService>('Service', serviceSchema);
