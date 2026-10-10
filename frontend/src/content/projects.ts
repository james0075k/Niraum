import type { Mineral, Project, ProjectStatus } from '@/lib/types';
import { images } from './images';
import { tbc } from './placeholders';

export const mineralLabels: Record<Mineral, string> = {
  'iron-ore': 'Iron Ore',
  'metal-minerals': 'Metal Minerals',
  'stone-aggregates': 'Stone & Aggregates',
};

export const statusLabels: Record<ProjectStatus, string> = {
  exploration: 'Exploration',
  development: 'Development',
  operating: 'Operating',
  completed: 'Completed',
};

/**
 * SAMPLE projects built around the supplied field photographs. Names, locations,
 * statuses and figures are placeholders — replace via the admin panel (Phase 5).
 */
export const projects: Project[] = [
  {
    title: 'Iron Ore Outcrop Sampling',
    slug: 'iron-ore-outcrop-sampling',
    mineral: 'iron-ore',
    status: 'exploration',
    location: { name: tbc('Site name'), district: tbc('District') },
    summary:
      'Channel sampling across iron-stained outcrops to define grade and continuity before any extraction plan.',
    body: `<p>Exploration starts on foot. Our geologists map the exposed rock, mark sample lines and number each point — CH-8, CHD-5, CHD-10 — so every result can be traced back to the ground.</p>
<p>Samples go to an independent laboratory. The results decide whether the deposit moves to development, and how it should be mined.</p>`,
    facts: [
      { label: 'Mineral', value: 'Iron ore' },
      { label: 'Stage', value: 'Exploration' },
      { label: 'Method', value: 'Outcrop mapping and channel sampling' },
      { label: 'Licence', value: tbc('Licence number') },
      { label: 'Area', value: tbc('Area') },
      { label: 'Estimated resource', value: tbc('Resource estimate') },
    ],
    coverImage: images.sampleCh8,
    gallery: [images.sampleCh8, images.sampleChd5, images.sampleChd10, images.chd10Closeup],
    featured: true,
    isSample: true,
  },
  {
    title: 'Metal Minerals Prospect',
    slug: 'metal-minerals-prospect',
    mineral: 'metal-minerals',
    status: 'exploration',
    location: { name: tbc('Site name'), district: tbc('District') },
    summary:
      'Systematic prospecting of mineralised zones with orange channel marks guiding the sampling grid.',
    body: `<p>Metal-bearing zones are often hidden under moss and soil. We clear small windows, paint channel lines and sample across the structure so results reflect the whole zone, not a lucky handful.</p>`,
    facts: [
      { label: 'Mineral', value: 'Metal minerals' },
      { label: 'Stage', value: 'Exploration' },
      { label: 'Licence', value: tbc('Licence number') },
      { label: 'Samples taken', value: tbc('Sample count') },
    ],
    coverImage: images.channelMarksWide,
    gallery: [images.channelMarksWide, images.channelMarks, images.mossyOutcrop],
    featured: true,
    isSample: true,
  },
  {
    title: 'Hillside Aggregate Quarry',
    slug: 'hillside-aggregate-quarry',
    mineral: 'stone-aggregates',
    status: 'development',
    location: { name: tbc('Site name'), district: tbc('District') },
    summary:
      'A hillside bedrock source assessed for crushed stone and graded construction aggregates.',
    body: `<p>Good aggregate starts with sound rock. We test strength and cleanliness, plan safe benches and design drainage before the first tonne is produced.</p>`,
    facts: [
      { label: 'Mineral', value: 'Stone & aggregates' },
      { label: 'Stage', value: 'Development' },
      { label: 'Planned capacity', value: tbc('Capacity') },
      { label: 'Licence', value: tbc('Licence number') },
    ],
    coverImage: images.hillside,
    gallery: [images.hillside, images.mossyOutcrop],
    featured: true,
    isSample: true,
  },
  {
    title: 'Ridge Field Survey',
    slug: 'ridge-field-survey',
    mineral: 'iron-ore',
    status: 'completed',
    location: { name: tbc('Site name'), district: tbc('District') },
    summary:
      'A completed geological traverse along a steep ridge, logging rock types and sample points.',
    body: `<p>Steep ground needs careful planning, the right PPE and a clear plan for every traverse. The data from this survey feeds the sampling programme on neighbouring outcrops.</p>`,
    facts: [
      { label: 'Mineral', value: 'Iron ore' },
      { label: 'Stage', value: 'Completed survey' },
      { label: 'Duration', value: tbc('Duration') },
    ],
    coverImage: images.fieldGeologist,
    gallery: [images.fieldGeologist, images.sampleChd10],
    featured: true,
    isSample: true,
  },
];
