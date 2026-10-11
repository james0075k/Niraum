/**
 * Katujpani Iron Deposit, Hematite product and Founder — text from
 * docs/content/data/site_content.json (derived from NIRAUM_MASTER_BLUEPRINT.md; the frontend
 * fallback reads the same file). Assay numbers come from assay_data.json.
 *
 * Idempotent: documents are created when missing; on existing ones only *missing Nepali* is
 * filled in, so English an admin has edited is never overwritten. [CONFIRM] items stay empty
 * or flagged (land.confirmed = false, lat/lng null, product sizes / minimum order / packing).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Document } from 'mongoose';
import { Deposit } from '../models/Deposit.js';
import { Product } from '../models/Product.js';
import { isLocalized, type LocalizedString } from '../models/schemas/LocalizedString.js';
import { SETTINGS_ID, SiteSettings } from '../models/SiteSettings.js';
import { TeamMember } from '../models/TeamMember.js';
import { loadAssayData } from './assay.seed.js';

type L = LocalizedString;
interface Venture {
  company: string;
  role: L;
  sector: L;
  since: number;
}
export interface SiteContent {
  deposit: {
    slug: string;
    name: L;
    summary: L;
    location: {
      district: L;
      municipality: L;
      ward: string;
      province: L;
      topoSheet: string;
      easting: number;
      northing: number;
      spotHeightM: number;
    };
    areas: { code: string; label: L }[];
    land: Record<string, number | string>;
    geologySummary: L;
    consultant: { name: string; address: string };
    statusText: L;
  };
  product: {
    slug: string;
    name: L;
    chemicalFormula: string;
    summary: L;
    applications: { title: L; body: L }[];
    chemistryBasis: L;
  };
  founder: { name: string; role: L; bio: L; otherVentures: Venture[] };
  /** phone + WhatsApp: the founder's number, also the company line (supplied 11 Oct 2026). */
  settings: { motto: L; email: string; phone: string; whatsapp: string };
}

export function loadSiteContent(path = process.env.SITE_CONTENT_PATH): SiteContent {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path,
    resolve(here, '../../../docs/content/data/site_content.json'),
    resolve(process.cwd(), '../docs/content/data/site_content.json'),
    resolve(process.cwd(), 'docs/content/data/site_content.json'),
  ].filter((p): p is string => !!p);
  const file = candidates.find((p) => existsSync(p));
  if (!file) throw new Error(`site_content.json not found (tried ${candidates.join(', ')})`);
  return JSON.parse(readFileSync(file, 'utf8')) as SiteContent;
}

export const KATUJPANI_SLUG = 'katujpani-iron-deposit';
export const HEMATITE_SLUG = 'industrial-hematite-iron-ore';

/** True when a stored LocalizedString (or every item of an array of them) lacks Nepali. */
function missingNe(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0 && value.every(missingNe);
  if (isLocalized(value)) return !value.ne?.trim();
  if (value && typeof value === 'object') {
    return Object.values(value).some((v) => isLocalized(v) && !v.ne?.trim());
  }
  return typeof value === 'string'; // pre-4.5 plain string
}

/**
 * Fills Nepali on an existing document: localized paths take `ne` from the content file
 * (keeping the stored English); arrays are replaced only when none of their items has Nepali.
 */
async function fillNe(doc: Document, paths: Record<string, unknown>): Promise<boolean> {
  let changed = false;
  // Plain copy: doc.get() returns Mongoose subdocuments, which don't look like { en, ne }.
  const plain = doc.toObject() as Record<string, unknown>;
  for (const [path, value] of Object.entries(paths)) {
    const current: unknown = path
      .split('.')
      .reduce<unknown>(
        (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
        plain,
      );
    if (!missingNe(current)) continue;
    if (isLocalized(value)) {
      const en = isLocalized(current) ? current.en : typeof current === 'string' ? current : '';
      doc.set(path, { en: en || value.en, ne: value.ne });
    } else {
      doc.set(path, value);
    }
    changed = true;
  }
  if (changed) await doc.save();
  return changed;
}

type SeedResult = 'created' | 'exists' | 'translated' | 'updated';

export async function seedKatujpani(content = loadSiteContent()): Promise<SeedResult> {
  const c = content.deposit;
  const existing = await Deposit.findOne({ slug: c.slug });
  if (!existing) {
    await Deposit.create({
      name: c.name,
      slug: c.slug,
      summary: c.summary,
      location: { ...c.location, lat: null, lng: null }, // WGS-84 not confirmed yet
      areas: c.areas,
      land: {
        surveyHa: c.land.surveyHa,
        quarryHa: c.land.quarryHa,
        topsoilYardHa: c.land.topsoilYardHa,
        wasteYardHa: c.land.wasteYardHa,
        officeHa: c.land.officeHa,
        approachRoadHa: c.land.approachRoadHa,
        totalLandUseHa: c.land.totalLandUseHa,
        landType: c.land.landType,
        confirmed: false, // Map No. 1 small print — [CONFIRM]
      },
      geologySummary: c.geologySummary,
      consultant: c.consultant,
      status: 'development',
      statusText: c.statusText,
      published: true,
    });
    return 'created';
  }
  const filled = await fillNe(existing, {
    name: c.name,
    summary: c.summary,
    'location.district': c.location.district,
    'location.municipality': c.location.municipality,
    'location.province': c.location.province,
    areas: c.areas,
    geologySummary: c.geologySummary,
    statusText: c.statusText,
  });
  return filled ? 'translated' : 'exists';
}

function chemistry(basis: L) {
  const o = loadAssayData().summary.deposit_weighted_average;
  return [
    { oxide: 'Fe₂O₃', value: o.Fe2O3, unit: '%', basis },
    { oxide: 'Fe', value: o.Fe, unit: '%', basis },
    { oxide: 'SiO₂', value: o.SiO2, unit: '%', basis },
    { oxide: 'Al₂O₃', value: o.Al2O3, unit: '%', basis },
  ];
}

export async function seedProduct(content = loadSiteContent()): Promise<SeedResult> {
  const c = content.product;
  const existing = await Product.findOne({ slug: c.slug });
  if (!existing) {
    await Product.create({
      name: c.name,
      slug: c.slug,
      chemicalFormula: c.chemicalFormula,
      summary: c.summary,
      applications: c.applications,
      typicalChemistry: chemistry(c.chemistryBasis),
      // [CONFIRM] sizes, minimum order, packing and delivery points.
      sizes: [],
      minOrder: '',
      packing: '',
      order: 0,
      published: true,
    });
    return 'created';
  }
  const filled = await fillNe(existing, {
    name: c.name,
    summary: c.summary,
    applications: c.applications,
    typicalChemistry: chemistry(c.chemistryBasis),
  });
  return filled ? 'translated' : 'exists';
}

/** Supplied portrait; the frontend maps this site path to its optimised local picture. */
const FOUNDER_PHOTO = {
  src: '/images/shivahari.jpeg',
  alt: 'Portrait of Shivahari Pudasaini, founder of Niraum Metals',
};

export async function seedFounder(content = loadSiteContent()): Promise<SeedResult> {
  const c = content.founder;
  const existing = await TeamMember.findOne({ isFounder: true });
  if (!existing) {
    await TeamMember.create({
      name: c.name,
      role: c.role,
      bio: c.bio,
      photo: FOUNDER_PHOTO,
      order: 0,
      published: true,
      isFounder: true,
      otherVentures: c.otherVentures,
    });
    return 'created';
  }
  // Add the portrait to a founder seeded before it was supplied; never replace an admin's photo.
  let photoAdded = false;
  if (!existing.photo?.src) {
    existing.set('photo', FOUNDER_PHOTO);
    await existing.save();
    photoAdded = true;
  }
  const filled = await fillNe(existing, {
    role: c.role,
    bio: c.bio,
    otherVentures: c.otherVentures,
  });
  return filled ? 'translated' : photoAdded ? 'updated' : 'exists';
}

/** Nepali motto, the blueprint business email and the company phone / WhatsApp. */
export async function seedSiteText(content = loadSiteContent()): Promise<string[]> {
  const done: string[] = [];
  const s = await SiteSettings.findById(SETTINGS_ID);
  if (!s) return done;
  const motto = (s.toObject() as { motto?: unknown }).motto;
  if (missingNe(motto)) {
    const en =
      (isLocalized(motto) ? motto.en : typeof motto === 'string' ? motto : '') ||
      content.settings.motto.en;
    s.set('motto', { en, ne: content.settings.motto.ne });
    done.push('motto.ne');
  }
  const emails = (s.get('contact.email') as string[] | undefined) ?? [];
  if (!emails.length || emails.every((e) => e.includes('PLACEHOLDER'))) {
    s.set('contact.email', [content.settings.email]);
    done.push('contact.email');
  }
  const phones = (s.get('contact.phone') as string[] | undefined) ?? [];
  if (!phones.length || phones.every((p) => p.includes('PLACEHOLDER'))) {
    s.set('contact.phone', [content.settings.phone]);
    done.push('contact.phone');
  }
  const whatsapp = s.get('contact.whatsapp') as string | null | undefined;
  if (!whatsapp || whatsapp.includes('PLACEHOLDER')) {
    s.set('contact.whatsapp', content.settings.whatsapp);
    done.push('contact.whatsapp');
  }
  if (done.length) await s.save();
  return done;
}
