/**
 * SAMPLE content — mirrors frontend/src/content (services, projects, posts) so a fresh
 * database serves the same site the frontend's local fallback shows. Keep the two in step.
 *
 * Images are site-relative `/images/<file>.jpg` paths. The frontend maps these back to its
 * optimised local pictures (frontend/src/content/images.ts → `localImages`); admins replace
 * them with Cloudinary uploads in the admin panel.
 */
import type { IPost } from '../models/Post.js';
import type { IProject } from '../models/Project.js';
import type { IService } from '../models/Service.js';
import type { LocalizedString } from '../models/schemas/LocalizedString.js';
import type { ImageRef } from '../models/shared.js';

const tbc = (label: string) => `[PLACEHOLDER: ${label}]`;

const img = (file: string, alt: string): ImageRef => ({ src: `/images/${file}.jpg`, alt });

const images = {
  fieldGeologist: img(
    'field-geologist-outcrop',
    'Field geologist inspecting a steep rock outcrop during an exploration survey',
  ),
  sampleCh8: img(
    'outcrop-sample-ch8',
    'Iron-stained outcrop marked CH-8 in yellow paint with a field notebook for scale',
  ),
  sampleChd5: img(
    'outcrop-sample-chd5',
    'Dark mineralised rock face labelled CHD-5 with a reddish ore band',
  ),
  sampleChd10: img(
    'outcrop-sample-chd10',
    'Fractured dark ore-bearing rock marked CHD-10 with a geological hammer for scale',
  ),
  chd10Closeup: img(
    'outcrop-chd10-closeup',
    'Close-up of sample point CHD-10 on a dark metallic outcrop',
  ),
  channelMarksWide: img(
    'rock-face-channel-marks',
    'Rock face with orange channel-sampling marks beneath green vegetation',
  ),
  channelMarks: img(
    'channel-sampling-marks',
    'Orange channel-sampling lines painted across a weathered outcrop',
  ),
  mossyOutcrop: img(
    'mossy-outcrop',
    'Moss-covered outcrop with ferns and exposed mineralised rock',
  ),
  hillside: img(
    'hillside-outcrop',
    'Green hillside with boulders of exposed bedrock at a survey site',
  ),
};

/** Sample rows may give LocalizedString fields as plain English strings (the model wraps them). */
type Seed<T, K extends keyof T> = {
  [P in K]: T[P] extends LocalizedString ? string | LocalizedString : T[P];
};

export const sampleServices: Seed<
  IService,
  | 'title'
  | 'slug'
  | 'icon'
  | 'summary'
  | 'body'
  | 'image'
  | 'highlights'
  | 'stats'
  | 'gallery'
  | 'order'
>[] = [
  {
    title: 'Iron Ore',
    slug: 'iron-ore',
    icon: 'pickaxe',
    summary:
      'Exploration and extraction of iron ore for steel and cement producers in Nepal and the region.',
    body: 'As an iron ore supplier in Nepal, we work from the outcrop up: mapping, channel sampling and assays first, then planned extraction. Steel and cement plants get ore with a known grade and a reliable schedule.',
    image: images.sampleChd10,
    highlights: [
      'Outcrop mapping and channel sampling',
      'Grade control from pit to stockpile',
      'Lump and fines to buyer specification',
    ],
    stats: [
      { label: 'Annual output', value: null, placeholder: tbc('Tonnage') },
      { label: 'Average Fe grade', value: null, placeholder: tbc('Grade') },
      { label: 'Licensed area', value: null, placeholder: tbc('Licence area') },
    ],
    gallery: [images.sampleCh8, images.chd10Closeup, images.fieldGeologist],
    order: 1,
  },
  {
    title: 'Metal Minerals',
    slug: 'metal-minerals',
    icon: 'gem',
    summary:
      'Prospecting and supply of metal-bearing minerals from the hills around Lalitpur and beyond.',
    body: 'Our metal minerals programme in Lalitpur and wider Nepal starts with careful geology. We sample, test and document every prospect before any decision to develop it.',
    image: images.sampleChd5,
    highlights: [
      'Systematic prospecting and sampling',
      'Independent laboratory testing',
      'Documented, licence-led development',
    ],
    stats: [
      { label: 'Prospects under study', value: null, placeholder: tbc('Prospect count') },
      { label: 'Samples assayed', value: null, placeholder: tbc('Sample count') },
      { label: 'Licences held', value: null, placeholder: tbc('Licences') },
    ],
    gallery: [images.channelMarks, images.channelMarksWide, images.mossyOutcrop],
    order: 2,
  },
  {
    title: 'Stone & Aggregates',
    slug: 'stone-aggregates',
    icon: 'mountain',
    summary: 'Crushed stone, sand and graded aggregates for roads, buildings and infrastructure.',
    body: 'We are a stone and aggregate supplier for the Kathmandu Valley and beyond. Construction aggregates in Nepal must be clean, graded and on time — so we crush, screen and test to specification.',
    image: images.hillside,
    highlights: [
      'Crushed and graded aggregate sizes',
      'Consistent gradation and cleanliness',
      'Bulk supply for road and building projects',
    ],
    stats: [
      { label: 'Crushing capacity', value: null, placeholder: tbc('Capacity') },
      { label: 'Product sizes', value: null, placeholder: tbc('Size range') },
      { label: 'Projects supplied', value: null, placeholder: tbc('Project count') },
    ],
    gallery: [images.hillside, images.mossyOutcrop, images.sampleCh8],
    order: 3,
  },
  {
    title: 'Logistics & Supply',
    slug: 'logistics-supply',
    icon: 'truck',
    summary: 'Haulage, stockpiling and scheduled delivery from site to plant or project.',
    body: 'Material is only useful when it arrives. We plan haulage around mountain roads and monsoon seasons, keep stockpiles ready and give buyers clear delivery schedules.',
    image: images.fieldGeologist,
    highlights: [
      'Planned haulage routes and schedules',
      'Stockpile management',
      'Weighbridge records and clear paperwork',
    ],
    stats: [
      { label: 'Fleet size', value: null, placeholder: tbc('Fleet size') },
      { label: 'Delivery regions', value: null, placeholder: tbc('Regions served') },
      { label: 'On-time rate', value: null, placeholder: tbc('On-time rate') },
    ],
    gallery: [images.fieldGeologist, images.hillside, images.channelMarksWide],
    order: 4,
  },
];

export const sampleProjects: Seed<
  IProject,
  | 'title'
  | 'slug'
  | 'mineral'
  | 'status'
  | 'location'
  | 'summary'
  | 'body'
  | 'facts'
  | 'coverImage'
  | 'gallery'
  | 'featured'
>[] = [
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
  },
];

export const samplePosts: Seed<
  IPost,
  'title' | 'slug' | 'excerpt' | 'body' | 'coverImage' | 'tags' | 'author' | 'publishedAt'
>[] = [
  {
    title: 'From Outcrop to Assay: How Iron Ore Exploration Starts',
    slug: 'how-iron-ore-exploration-starts',
    excerpt:
      'Before any machine arrives, geologists walk the ground, mark sample lines and send rock to the lab. Here is what that work looks like.',
    body: `<p>Every mine begins as a question: is there enough ore, of good enough grade, to justify the work? Answering it takes patient fieldwork.</p>
<h2>Mapping the ground</h2>
<p>Geologists walk the outcrops, record rock types and note where iron staining or metallic minerals appear. Each observation gets a location.</p>
<h2>Channel sampling</h2>
<p>A channel sample is a continuous strip cut across the rock. The line is painted, numbered and photographed — CH-8 or CHD-10, for example — so anyone can find it again.</p>
<h2>Laboratory results</h2>
<p>Samples go to an independent laboratory. Grades, combined with the mapped geometry, give a first estimate of the deposit. Only then does development planning start.</p>`,
    coverImage: images.sampleChd10,
    tags: ['Exploration', 'Iron ore'],
    author: 'Niraum Metals',
    publishedAt: new Date('2026-10-01'),
  },
  {
    title: 'What Makes a Good Construction Aggregate?',
    slug: 'what-makes-a-good-construction-aggregate',
    excerpt:
      'Strength, shape, cleanliness and grading. Four properties decide whether stone is ready for concrete, asphalt or road base.',
    body: `<p>Construction aggregates in Nepal carry roads, bridges and buildings. Poor aggregate shows up later as cracks, potholes and repairs.</p>
<h2>Four properties that matter</h2>
<ul><li><strong>Strength</strong> — the rock must resist crushing and wear.</li>
<li><strong>Shape</strong> — cubical particles lock together better than flat ones.</li>
<li><strong>Cleanliness</strong> — clay and dust weaken the bond with cement or bitumen.</li>
<li><strong>Grading</strong> — the right mix of sizes fills voids and saves binder.</li></ul>
<p>Testing each batch keeps every load consistent with the specification.</p>`,
    coverImage: images.hillside,
    tags: ['Aggregates', 'Construction'],
    author: 'Niraum Metals',
    publishedAt: new Date('2026-09-22'),
  },
  {
    title: 'Safety First: PPE Basics on a Mine or Quarry Site',
    slug: 'ppe-basics-on-mine-and-quarry-sites',
    excerpt:
      'Helmets, boots, eye and ear protection, high-visibility clothing. Simple rules, applied every day, keep people safe.',
    body: `<p>Mining and quarrying involve heavy equipment, loose rock and loud machinery. Personal protective equipment is the last line of defence — and it only works if it is worn correctly, every shift.</p>
<h2>The essentials</h2>
<ul><li>Hard hat and safety boots on every site.</li>
<li>Eye protection near crushing, drilling and sampling.</li>
<li>Hearing protection around crushers and generators.</li>
<li>High-visibility clothing wherever vehicles move.</li></ul>
<p>Good PPE sits inside a wider system: site induction, toolbox talks and the right to stop unsafe work.</p>`,
    coverImage: images.fieldGeologist,
    tags: ['Safety'],
    author: 'Niraum Metals',
    publishedAt: new Date('2026-09-10'),
  },
];
