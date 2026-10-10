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

export interface IPost extends ContentBase {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: ImageRef | null;
  tags: string[];
  /** Display name shown on the article. */
  author: string;
  published: boolean;
  publishedAt: Date | null;
  isSample: boolean;
  seo?: Seo;
}

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: '', maxlength: 300 },
    body: { type: String, default: '' },
    coverImage: { type: imageSchema, default: null },
    tags: { type: [String], default: [], index: true },
    author: { type: String, default: 'Niraum Metals' },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    isSample: { type: Boolean, default: false },
    seo: seoSchema,
    ...contentBaseFields,
  },
  { timestamps: true, toJSON: toJSONOptions },
);

// A post's "summary" is its excerpt.
postSchema.index({ title: 'text', excerpt: 'text' }, { weights: { title: 5, excerpt: 1 } });
postSchema.index({ published: 1, publishedAt: -1 });
postSchema.index({ publishedAt: -1 });

export const Post = model<IPost>('Post', postSchema);
