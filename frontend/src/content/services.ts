import type { Service } from '@/lib/types';
import { images } from './images';
import { tbc } from './placeholders';

/** The four operations named in the Brand Brief. Figures are TBC until supplied. */
export const services: Service[] = [
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
