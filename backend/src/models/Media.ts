import { Schema, model, type Types } from 'mongoose';
import { toJSONOptions } from './shared.js';

export const MEDIA_TYPES = ['image', 'video', 'document'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export interface IMedia {
  url: string;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
  type: MediaType;
  mime: string;
  alt: string;
  size: number;
  width?: number;
  height?: number;
  uploadedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true, unique: true },
    resourceType: { type: String, enum: ['image', 'video', 'raw'], required: true },
    type: { type: String, enum: MEDIA_TYPES, required: true },
    mime: { type: String, required: true },
    alt: { type: String, default: '', maxlength: 200 },
    size: { type: Number, required: true },
    width: Number,
    height: Number,
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

mediaSchema.index({ type: 1, createdAt: -1 });

export const Media = model<IMedia>('Media', mediaSchema);
