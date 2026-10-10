import { Schema, model } from 'mongoose';
import { localizedPath, type LocalizedString } from './schemas/LocalizedString.js';
import {
  contentBaseFields,
  imageSchema,
  seoSchema,
  toJSONOptions,
  type ContentBase,
  type ImageRef,
  type Seo,
} from './shared.js';

export const DEPOSIT_STATUSES = ['studies', 'development', 'operating'] as const;

/**
 * Location from the mine scheme. Easting/Northing are the report's local grid on the Nepal
 * topo sheet — NOT latitude/longitude. lat/lng stay empty until WGS-84 coordinates are
 * confirmed (never converted by guesswork).
 */
export interface DepositLocation {
  district: LocalizedString;
  municipality: LocalizedString;
  ward: string;
  province: LocalizedString;
  topoSheet: string;
  easting: number | null;
  northing: number | null;
  spotHeightM: number | null;
  lat: number | null;
  lng: number | null;
}

/** Map No. 1 land figures — `confirmed: false` until the scan is checked ([CONFIRM]). */
export interface DepositLand {
  surveyHa: number | null;
  quarryHa: number | null;
  topsoilYardHa: number | null;
  wasteYardHa: number | null;
  officeHa: number | null;
  approachRoadHa: number | null;
  totalLandUseHa: number | null;
  landType: string;
  confirmed: boolean;
}

export interface DepositArea {
  code: string;
  label: LocalizedString;
}

export interface IDeposit extends ContentBase {
  name: LocalizedString;
  slug: string;
  summary: LocalizedString;
  location: DepositLocation;
  areas: DepositArea[];
  land: DepositLand;
  geologySummary: LocalizedString;
  consultant: { name: string; address: string };
  status: (typeof DEPOSIT_STATUSES)[number];
  statusText: LocalizedString;
  maps: ImageRef[];
  published: boolean;
  seo?: Seo;
}

const num = { type: Number, default: null };

const depositSchema = new Schema<IDeposit>(
  {
    name: localizedPath({ required: true, maxlength: 150 }),
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    summary: localizedPath({ maxlength: 1000 }),
    location: {
      district: localizedPath({ maxlength: 100 }),
      municipality: localizedPath({ maxlength: 100 }),
      ward: { type: String, default: '' },
      province: localizedPath({ maxlength: 100 }),
      topoSheet: { type: String, default: '' },
      easting: num,
      northing: num,
      spotHeightM: num,
      lat: { type: Number, default: null, min: -90, max: 90 },
      lng: { type: Number, default: null, min: -180, max: 180 },
    },
    areas: {
      type: [
        new Schema<DepositArea>(
          { code: { type: String, required: true }, label: localizedPath({ maxlength: 150 }) },
          { _id: false },
        ),
      ],
      default: [],
    },
    land: {
      surveyHa: num,
      quarryHa: num,
      topsoilYardHa: num,
      wasteYardHa: num,
      officeHa: num,
      approachRoadHa: num,
      totalLandUseHa: num,
      landType: { type: String, default: '' },
      confirmed: { type: Boolean, default: false },
    },
    geologySummary: localizedPath({ maxlength: 2000 }),
    consultant: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    status: { type: String, enum: DEPOSIT_STATUSES, default: 'studies' },
    statusText: localizedPath({ maxlength: 300 }),
    maps: { type: [imageSchema], default: [] },
    published: { type: Boolean, default: false },
    seo: seoSchema,
    ...contentBaseFields,
  },
  { timestamps: true, toJSON: toJSONOptions },
);

depositSchema.index({ published: 1 });
depositSchema.index({ 'name.en': 'text', 'name.ne': 'text', 'summary.en': 'text' });

export const Deposit = model<IDeposit>('Deposit', depositSchema);
