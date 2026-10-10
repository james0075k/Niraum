import type { Post } from '@/lib/types';
import { images } from './images';

/**
 * SAMPLE articles — general explainers, not company announcements. Replace or remove
 * once real news is published through the admin panel.
 */
export const posts: Post[] = [
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
    publishedAt: '2026-10-01',
    isSample: true,
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
    publishedAt: '2026-09-22',
    isSample: true,
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
    publishedAt: '2026-09-10',
    isSample: true,
  },
];
