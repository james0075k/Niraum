import { Schema, model } from 'mongoose';
import { localizedPath, type LocalizedString } from './schemas/LocalizedString.js';
import {
  contentBaseFields,
  imageSchema,
  toJSONOptions,
  type ContentBase,
  type ImageRef,
} from './shared.js';

/** Other companies a founder or director is involved in (About → founder profile). */
export interface Venture {
  company: string;
  role: string;
  sector: string;
  since: number | null;
}

export interface ITeamMember extends ContentBase {
  name: string;
  role: LocalizedString;
  bio: LocalizedString;
  photo: ImageRef | null;
  order: number;
  linkedin: string | null;
  published: boolean;
  isSample: boolean;
  /** Phase 4.5: the founder card on About / Investors. */
  isFounder: boolean;
  otherVentures: Venture[];
}

const teamSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    role: localizedPath({ maxlength: 100 }),
    bio: localizedPath({ maxlength: 2000 }),
    photo: { type: imageSchema, default: null },
    order: { type: Number, default: 0 },
    linkedin: { type: String, default: null },
    published: { type: Boolean, default: true },
    isSample: { type: Boolean, default: false },
    isFounder: { type: Boolean, default: false },
    otherVentures: {
      type: [
        new Schema<Venture>(
          {
            company: { type: String, required: true, trim: true, maxlength: 150 },
            role: { type: String, default: '', trim: true, maxlength: 100 },
            sector: { type: String, default: '', trim: true, maxlength: 100 },
            since: { type: Number, default: null, min: 1900, max: 2100 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    ...contentBaseFields,
  },
  { timestamps: true, toJSON: toJSONOptions },
);

teamSchema.index({ published: 1, order: 1 });
teamSchema.index({ name: 'text', 'role.en': 'text', 'role.ne': 'text' });

export const TeamMember = model<ITeamMember>('TeamMember', teamSchema);
