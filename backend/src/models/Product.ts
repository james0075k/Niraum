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

/** One use of the product, e.g. "Cement industry — iron corrective" (blueprint §4). */
export interface ProductApplication {
  title: LocalizedString;
  body: LocalizedString;
}

/** Typical chemistry row, e.g. Fe₂O₃ 33.59 % (deposit weighted average, Table 14). */
export interface ChemistryRow {
  oxide: string;
  value: number;
  unit: string;
  basis: LocalizedString;
}

export interface IProduct extends ContentBase {
  name: LocalizedString;
  slug: string;
  chemicalFormula: string;
  summary: LocalizedString;
  applications: ProductApplication[];
  typicalChemistry: ChemistryRow[];
  /** [CONFIRM] lump/fines sizes — empty until the founder confirms. */
  sizes: string[];
  /** [CONFIRM] e.g. "500 t per order" — empty until confirmed. */
  minOrder: string;
  /** [CONFIRM] packing / delivery notes — empty until confirmed. */
  packing: string;
  image: ImageRef | null;
  order: number;
  published: boolean;
  seo?: Seo;
}

const applicationSchema = new Schema<ProductApplication>(
  { title: localizedPath({ maxlength: 150 }), body: localizedPath({ maxlength: 2000 }) },
  { _id: false },
);

const chemistrySchema = new Schema<ChemistryRow>(
  {
    oxide: { type: String, required: true, trim: true, maxlength: 20 },
    value: { type: Number, required: true },
    unit: { type: String, default: '%', maxlength: 10 },
    basis: localizedPath({ maxlength: 200 }),
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    name: localizedPath({ required: true, maxlength: 150 }),
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    chemicalFormula: { type: String, default: '', trim: true, maxlength: 40 },
    summary: localizedPath({ maxlength: 600 }),
    applications: { type: [applicationSchema], default: [] },
    typicalChemistry: { type: [chemistrySchema], default: [] },
    sizes: { type: [String], default: [] },
    minOrder: { type: String, default: '', trim: true, maxlength: 150 },
    packing: { type: String, default: '', trim: true, maxlength: 300 },
    image: { type: imageSchema, default: null },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    seo: seoSchema,
    ...contentBaseFields,
  },
  { timestamps: true, toJSON: toJSONOptions },
);

productSchema.index({ published: 1, order: 1 });
productSchema.index({ 'name.en': 'text', 'name.ne': 'text', 'summary.en': 'text' });

export const Product = model<IProduct>('Product', productSchema);
