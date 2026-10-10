import { Schema, model } from 'mongoose';
import {
  contentBaseFields,
  imageSchema,
  toJSONOptions,
  type ContentBase,
  type ImageRef,
} from './shared.js';

export interface ITeamMember extends ContentBase {
  name: string;
  role: string;
  bio: string;
  photo: ImageRef | null;
  order: number;
  linkedin: string | null;
  published: boolean;
  isSample: boolean;
}

const teamSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    role: { type: String, default: '', maxlength: 100 },
    bio: { type: String, default: '', maxlength: 2000 },
    photo: { type: imageSchema, default: null },
    order: { type: Number, default: 0 },
    linkedin: { type: String, default: null },
    published: { type: Boolean, default: true },
    isSample: { type: Boolean, default: false },
    ...contentBaseFields,
  },
  { timestamps: true, toJSON: toJSONOptions },
);

teamSchema.index({ published: 1, order: 1 });
teamSchema.index({ name: 'text', role: 'text' });

export const TeamMember = model<ITeamMember>('TeamMember', teamSchema);
