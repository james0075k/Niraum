import { Schema, model } from 'mongoose';

export interface IGeocodeCache {
  query: string;
  lat: number;
  lng: number;
  displayName: string;
  createdAt: Date;
}

const geocodeCacheSchema = new Schema<IGeocodeCache>(
  {
    query: { type: String, required: true, unique: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    displayName: { type: String, default: '' },
    // TTL index: MongoDB drops entries 30 days after they were cached.
    createdAt: { type: Date, default: () => new Date(), expires: 60 * 60 * 24 * 30 },
  },
  { versionKey: false },
);

export const GeocodeCache = model<IGeocodeCache>('GeocodeCache', geocodeCacheSchema);
