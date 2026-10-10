/**
 * Katujpani Iron Deposit, Hematite product and Founder — facts from
 * docs/content/NIRAUM_MASTER_BLUEPRINT.md only. Created when missing; never overwrites what an
 * admin has edited. [CONFIRM] items stay empty or flagged (land.confirmed = false, lat/lng null,
 * product sizes / minimum order / packing empty).
 */
import { Deposit } from '../models/Deposit.js';
import { Product } from '../models/Product.js';
import { TeamMember } from '../models/TeamMember.js';

export const KATUJPANI_SLUG = 'katujpani-iron-deposit';
export const HEMATITE_SLUG = 'industrial-hematite-iron-ore';

const TABLE_14 = 'Deposit weighted average over 62.55 m (Table 14)';

export async function seedKatujpani(): Promise<'created' | 'exists'> {
  if (await Deposit.exists({ slug: KATUJPANI_SLUG })) return 'exists';
  await Deposit.create({
    name: 'Katujpani Iron Deposit',
    slug: KATUJPANI_SLUG,
    summary:
      'Hematite iron deposit at Bakaiya Gaupalika-09, Makawanpur District, Bagmati Province, ' +
      'mapped in three zones (Areas A, B and C) and sampled across 62.55 m in five sections.',
    location: {
      district: 'Makawanpur',
      municipality: 'Bakaiya Gaupalika',
      ward: '09',
      province: 'Bagmati Province',
      topoSheet: '2785 10A',
      easting: 627755.0,
      northing: 3033300.0,
      spotHeightM: 914,
      // Local grid only — WGS-84 lat/lng to be supplied by the consultant ([CONFIRM]).
      lat: null,
      lng: null,
    },
    areas: [
      { code: 'A', label: 'Area A' },
      { code: 'B', label: 'Area B' },
      { code: 'C', label: 'Area C' },
    ],
    land: {
      surveyHa: 20.68,
      quarryHa: 2.88,
      topsoilYardHa: 0.116,
      wasteYardHa: 0.135,
      officeHa: 0.032,
      approachRoadHa: 0.147,
      totalLandUseHa: 3.41,
      landType: 'Forest land',
      confirmed: false, // small print hard to read in the scan — [CONFIRM]
    },
    geologySummary: 'Middle Siwalik sandstone belt north of Shikharpur (regional map after DMG).',
    consultant: {
      name: 'Shubharambha Mining and Engineering Services Pvt. Ltd.',
      address: 'Tarkeshwor-07, Kathmandu',
    },
    status: 'development',
    statusText:
      'Government procedures and geological studies completed; development toward commercial mining in progress.',
    published: true,
  });
  return 'created';
}

export async function seedProduct(): Promise<'created' | 'exists'> {
  if (await Product.exists({ slug: HEMATITE_SLUG })) return 'exists';
  await Product.create({
    name: 'Industrial Hematite Iron Ore',
    slug: HEMATITE_SLUG,
    chemicalFormula: 'Fe₂O₃',
    summary:
      "Hematite iron ore from the Katujpani deposit, Makawanpur — supplied to Nepal's cement and metals industry.",
    applications: [
      {
        title: 'Cement industry — iron corrective',
        body:
          'Hematite ore adds Fe₂O₃ to the cement raw mix. Plants use it to adjust the iron and ' +
          'silica moduli and to act as a flux, which lowers the clinkering temperature and helps ' +
          'form the C₄AF phase.',
      },
      {
        title: 'Foundry and metallurgical buyers — on request',
        body:
          "Supplied for evaluation and blending. Suitability for direct furnace feed depends on the buyer's " +
          'grade requirements and may need beneficiation. Samples and full assay sheets are available on request.',
      },
    ],
    typicalChemistry: [
      { oxide: 'Fe₂O₃', value: 33.59, unit: '%', basis: TABLE_14 },
      { oxide: 'Fe', value: 23.48, unit: '%', basis: TABLE_14 },
      { oxide: 'SiO₂', value: 53.05, unit: '%', basis: TABLE_14 },
      { oxide: 'Al₂O₃', value: 3.22, unit: '%', basis: TABLE_14 },
    ],
    // [CONFIRM] sizes, minimum order, packing and delivery points.
    sizes: [],
    minOrder: '',
    packing: '',
    order: 0,
    published: true,
  });
  return 'created';
}

export async function seedFounder(): Promise<'created' | 'exists'> {
  if (await TeamMember.exists({ isFounder: true })) return 'exists';
  await TeamMember.create({
    name: 'Shivahari Pudasaini',
    role: 'Founder',
    bio:
      "Shivahari Pudasaini founded Niraum Metals to develop Nepal's iron ore resources responsibly. " +
      'He has led Nepal Souvenir Craft and Trade, an exporter of Nepali handicrafts to international ' +
      'and European markets, since 2010, and invests across mining, hydropower and securities. He works ' +
      'with engineers, geologists and technical specialists to take the Katujpani project from study to ' +
      'commercial operation.',
    // High-resolution portrait still to be supplied ([CONFIRM]) — grey placeholder on the site.
    photo: null,
    order: 0,
    published: true,
    isFounder: true,
    otherVentures: [
      {
        company: 'Nepal Souvenir Craft and Trade',
        role: 'President',
        sector: 'Handicrafts & export',
        since: 2010,
      },
      {
        company: 'Roadshow Securities Limited',
        role: 'Investor',
        sector: 'Securities',
        since: 2023,
      },
      { company: 'Malta Bagmati Hydropower', role: 'Investor', sector: 'Hydropower', since: 2024 },
      {
        company: 'Deshim Mines and Minerals Pvt. Ltd.',
        role: 'Investor',
        sector: 'Mining & minerals',
        since: 2026,
      },
      { company: 'Deshim Mineralium Energy', role: 'Investor', sector: 'Hydropower', since: 2026 },
    ],
  });
  return 'created';
}
