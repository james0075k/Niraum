/**
 * Public content shapes — mirror the Mongoose models in docs/ARCHITECTURE.md §4
 * (public projections only). Phase 4 serves these from /api/v1.
 */

/** vite-imagetools `as=picture` output (local images). */
export interface Picture {
  sources: Record<string, string>;
  img: { src: string; w: number; h: number };
}

/** An image from the API (Cloudinary URL) or a local, pre-optimised picture. */
export interface ImageSource {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  picture?: Picture;
}

export type SocialPlatform =
  'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'x' | 'tiktok' | 'whatsapp' | 'viber';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  isActive: boolean;
  order: number;
}

export interface SiteSettings {
  companyName: string;
  legalName: string;
  motto: string;
  logo: { light: string | null; dark: string | null };
  contact: { phone: string[]; email: string[]; whatsapp: string | null };
  address: {
    line1: string;
    city: string;
    district: string;
    province: string;
    country: string;
    postalCode: string;
  };
  /** `approximate` is set while the exact office pin is unconfirmed. */
  location: { lat: number; lng: number; zoom: number; approximate?: boolean };
  officeHours: string;
  social: SocialLink[];
  seo: { defaultTitle: string; defaultDescription: string; ogImage: string; keywords: string[] };
  footer: { about: string };
  theme: { defaultMode: 'light' | 'dark' | 'system' };
  /** Phase 4.5: sample-level assay rows are public only when on. */
  publicAssayDetail?: boolean;
  defaultLanguage?: 'en' | 'ne';
}

export type Mineral = 'iron-ore' | 'metal-minerals' | 'stone-aggregates';
export type ProjectStatus = 'exploration' | 'development' | 'operating' | 'completed';

export interface Fact {
  label: string;
  value: string;
}

export interface Project {
  title: string;
  slug: string;
  mineral: Mineral;
  status: ProjectStatus;
  location: { name: string; district: string; lat?: number; lng?: number };
  summary: string;
  /** Trusted HTML (sanitised server-side on save — Phase 4). */
  body: string;
  facts: Fact[];
  coverImage: ImageSource;
  gallery: ImageSource[];
  featured: boolean;
  /** True for demo content shipped with the frontend; shows a "Sample" badge. */
  isSample?: boolean;
}

export interface Post {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: ImageSource;
  tags: string[];
  author: string;
  publishedAt: string;
  isSample?: boolean;
}

export interface Job {
  title: string;
  slug: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  deadline: string | null;
  isOpen: boolean;
  /** Mongoose timestamp — used as JobPosting.datePosted. */
  createdAt?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  photo: ImageSource | null;
  order: number;
  linkedin: string | null;
  isSample?: boolean;
  /** Phase 4.5 founder card. */
  isFounder?: boolean;
  otherVentures?: Venture[];
}

export interface Venture {
  company: string;
  role: string;
  sector: string;
  since: number | null;
}

export interface Stat {
  label: string;
  value: number | null;
  suffix?: string;
  /** Decimal places (assay percentages use 2). */
  decimals?: number;
  /** Shown instead of a number while the real figure is unknown. */
  placeholder?: string;
}

export interface Service {
  title: string;
  slug: string;
  icon: 'pickaxe' | 'gem' | 'mountain' | 'truck';
  summary: string;
  body: string;
  image: ImageSource;
  highlights: string[];
  stats: Stat[];
  gallery: ImageSource[];
  order: number;
}

// ── Phase 4.5 ───────────────────────────────────────────────────────────────

export interface ChemistryRow {
  oxide: string;
  value: number;
  unit: string;
  basis: string;
}

export interface Product {
  name: string;
  slug: string;
  chemicalFormula: string;
  summary: string;
  applications: { title: string; body: string }[];
  typicalChemistry: ChemistryRow[];
  /** Empty until confirmed ([CONFIRM]). */
  sizes: string[];
  minOrder: string;
  packing: string;
  image: ImageSource | null;
}

export interface Deposit {
  name: string;
  slug: string;
  summary: string;
  location: {
    district: string;
    municipality: string;
    ward: string;
    province: string;
    topoSheet: string;
    easting: number | null;
    northing: number | null;
    spotHeightM: number | null;
    /** WGS-84 only — null until confirmed. */
    lat: number | null;
    lng: number | null;
  };
  areas: { code: string; label: string }[];
  land: {
    surveyHa: number | null;
    quarryHa: number | null;
    topsoilYardHa: number | null;
    wasteYardHa: number | null;
    officeHa: number | null;
    approachRoadHa: number | null;
    totalLandUseHa: number | null;
    landType: string;
    confirmed: boolean;
  };
  geologySummary: string;
  consultant: { name: string; address: string };
  status: 'studies' | 'development' | 'operating';
  statusText: string;
}

export interface AssaySection {
  section: string;
  thicknessM: number;
  SiO2: number;
  Fe: number;
  Fe2O3: number;
  Al2O3: number;
}

export type AssayDataset = 'grab_B_C' | 'grab_A' | 'channel_B' | 'channel_C' | 'channel_KXY';

export interface AssaySummaryData {
  sections: AssaySection[];
  overall: AssaySection | null;
  highlights: {
    highestSample: { sample: string; dataset: AssayDataset; Fe: number; Fe2O3: number } | null;
    grabBC: { n: number; Fe2O3: number } | null;
  };
  sampleCount: number;
}

export interface AssaySampleRow {
  sample: string;
  dataset: AssayDataset;
  SiO2: number;
  LOI: number | null;
  Fe: number;
  Fe2O3: number;
  Al2O3: number;
  CaO: number | null;
  MgO: number | null;
  lengthM: number | null;
  note: string;
}
