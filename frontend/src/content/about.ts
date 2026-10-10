import type { TeamMember } from '@/lib/types';
import { tbc } from './placeholders';

/** Leadership is unknown — four clearly marked placeholder cards. */
export const team: TeamMember[] = [1, 2, 3, 4].map((order) => ({
  name: tbc('Name'),
  role: tbc('Leadership role'),
  bio: tbc('Short biography'),
  photo: null,
  order,
  linkedin: null,
  isSample: true,
}));

export const values = [
  {
    title: 'Mission',
    body: 'Supply the minerals Nepal builds with — iron ore, metal minerals and aggregates — safely, responsibly and to specification.',
  },
  {
    title: 'Vision',
    body: 'Be the mining partner South Asian builders and industries trust for generations.',
  },
  {
    title: 'Values',
    body: 'Safety without exception. Honest data. Respect for land and communities. Engineering discipline in every decision.',
  },
];

export const milestones = [
  { year: tbc('Year'), title: 'Company founded', body: tbc('Founding story') },
  { year: tbc('Year'), title: 'First exploration licence', body: tbc('Licence details') },
  { year: tbc('Year'), title: 'First supply contract', body: tbc('Contract details') },
  { year: '2026', title: 'Website launched', body: 'Niraum Metals goes online.' },
];

export const certifications = [
  { title: tbc('Mining licence'), body: 'Issued by the Department of Mines and Geology, Nepal.' },
  { title: tbc('Company registration'), body: 'Office of the Company Registrar, Nepal.' },
  { title: tbc('PAN / VAT registration'), body: 'Inland Revenue Department, Nepal.' },
];

export const esgPillars = [
  {
    title: 'Environment',
    body: 'Plan for closure from day one: topsoil saved, drainage controlled, land rehabilitated.',
  },
  {
    title: 'Community',
    body: 'Hire locally, consult early and keep roads, water and neighbours safe from our work.',
  },
  {
    title: 'Safety',
    body: 'PPE, training and the right to stop unsafe work. Every person goes home every day.',
  },
  {
    title: 'Governance',
    body: 'Licensed operations, honest reporting and clear accountability at every level.',
  },
];

export const safetyStats = [
  { label: 'Lost-time injuries', value: null, placeholder: tbc('LTI figure') },
  { label: 'Safety training hours', value: null, placeholder: tbc('Training hours') },
  { label: 'Land rehabilitated', value: null, placeholder: tbc('Hectares') },
];
