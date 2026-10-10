import { Schema, type Types } from 'mongoose';

/** Image reference embedded in content (Cloudinary URL + alt), shape = frontend `ImageSource`. */
export interface ImageRef {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  mediaId?: Types.ObjectId;
}

export const imageSchema = new Schema<ImageRef>(
  {
    src: { type: String, required: true, trim: true },
    alt: { type: String, default: '', trim: true, maxlength: 200 },
    width: Number,
    height: Number,
    mediaId: { type: Schema.Types.ObjectId, ref: 'Media' },
  },
  { _id: false },
);

export interface Seo {
  title?: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;
}

export const seoSchema = new Schema<Seo>(
  {
    title: { type: String, maxlength: 70 },
    description: { type: String, maxlength: 170 },
    ogImage: String,
    noindex: { type: Boolean, default: false },
  },
  { _id: false },
);

/** Fields shared by every CMS content model. */
export interface ContentBase {
  isDeleted: boolean;
  deletedAt: Date | null;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const contentBaseFields = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
} as const;

/** Drop Mongo internals from JSON output: `_id` → `id`, no `__v`. */
export const toJSONOptions = {
  virtuals: true,
  versionKey: false,
  transform(_doc: unknown, ret: Record<string, unknown>) {
    delete ret._id;
    return ret;
  },
};
