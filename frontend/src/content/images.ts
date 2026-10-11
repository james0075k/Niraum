/**
 * Local field photography supplied by Niraum Metals (originals in /Assets).
 * `?picture` → vite-imagetools emits AVIF/WebP/JPEG at several widths.
 * Alt text lives here so every use shares it (admin Media.alt replaces it later).
 */
import type { ImageSource, Picture } from '@/lib/types';
import fieldGeologist from '@/assets/images/field-geologist-outcrop.jpg?picture';
import sampleCh8 from '@/assets/images/outcrop-sample-ch8.jpg?picture';
import sampleChd5 from '@/assets/images/outcrop-sample-chd5.jpg?picture';
import sampleChd10 from '@/assets/images/outcrop-sample-chd10.jpg?picture';
import chd10Closeup from '@/assets/images/outcrop-chd10-closeup.jpg?picture';
import channelMarksWide from '@/assets/images/rock-face-channel-marks.jpg?picture';
import channelMarks from '@/assets/images/channel-sampling-marks.jpg?picture';
import mossyOutcrop from '@/assets/images/mossy-outcrop.jpg?picture';
import hillside from '@/assets/images/hillside-outcrop.jpg?picture';
// Founder portrait (912 px wide): `?photo` never upscales.
import founderPortrait from '@/assets/images/shivahari.jpeg?photo';
// Website developer (Developer page), cropped from the CV photo (308 px).
import developerPortrait from '@/assets/images/developer-james-portrait.jpg?photo';

const img = (picture: Picture, alt: string): ImageSource => ({
  src: picture.img.src,
  width: picture.img.w,
  height: picture.img.h,
  alt,
  picture,
});

export const images = {
  fieldGeologist: img(
    fieldGeologist,
    'Field geologist inspecting a steep rock outcrop during an exploration survey',
  ),
  sampleCh8: img(
    sampleCh8,
    'Iron-stained outcrop marked CH-8 in yellow paint with a field notebook for scale',
  ),
  sampleChd5: img(sampleChd5, 'Dark mineralised rock face labelled CHD-5 with a reddish ore band'),
  sampleChd10: img(
    sampleChd10,
    'Fractured dark ore-bearing rock marked CHD-10 with a geological hammer for scale',
  ),
  chd10Closeup: img(chd10Closeup, 'Close-up of sample point CHD-10 on a dark metallic outcrop'),
  channelMarksWide: img(
    channelMarksWide,
    'Rock face with orange channel-sampling marks beneath green vegetation',
  ),
  channelMarks: img(
    channelMarks,
    'Orange channel-sampling lines painted across a weathered outcrop',
  ),
  mossyOutcrop: img(mossyOutcrop, 'Moss-covered outcrop with ferns and exposed mineralised rock'),
  hillside: img(hillside, 'Green hillside with boulders of exposed bedrock at a survey site'),
  founder: img(founderPortrait, 'Portrait of Shivahari Pudasaini, founder of Niraum Metals'),
  developer: img(developerPortrait, 'Portrait of Janak (James) Rokaya, website developer'),
} satisfies Record<string, ImageSource>;

/**
 * Seeded API content (backend/src/seed/content.ts) refers to these photos by site path.
 * `withLocalImages` swaps those refs back to the optimised local pictures.
 */
const localImages: Record<string, ImageSource> = {
  '/images/field-geologist-outcrop.jpg': images.fieldGeologist,
  '/images/outcrop-sample-ch8.jpg': images.sampleCh8,
  '/images/outcrop-sample-chd5.jpg': images.sampleChd5,
  '/images/outcrop-sample-chd10.jpg': images.sampleChd10,
  '/images/outcrop-chd10-closeup.jpg': images.chd10Closeup,
  '/images/rock-face-channel-marks.jpg': images.channelMarksWide,
  '/images/channel-sampling-marks.jpg': images.channelMarks,
  '/images/mossy-outcrop.jpg': images.mossyOutcrop,
  '/images/hillside-outcrop.jpg': images.hillside,
  '/images/shivahari.jpeg': images.founder,
};

/** Deep-replaces `{ src: '/images/<file>.jpg' }` refs in API data; the API's alt text wins. */
export function withLocalImages<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withLocalImages) as T;
  if (!value || typeof value !== 'object') return value;
  const obj = value as Record<string, unknown>;
  const local = typeof obj.src === 'string' ? localImages[obj.src] : undefined;
  if (local) {
    return { ...local, alt: typeof obj.alt === 'string' && obj.alt ? obj.alt : local.alt } as T;
  }
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, withLocalImages(v)])) as T;
}
