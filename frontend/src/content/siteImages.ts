/**
 * Report imagery from the Katujpani mine scheme (docs/content/manifest.json says where each one
 * goes). `?site` → vite-imagetools AVIF + WebP at 480/768/1200 px. The originals are small
 * (≈340–560 px, upscaled 2×), so use them for cards, galleries and darkened heroes only.
 * Alt text lives here so every use shares it.
 */
import type { ImageSource, Picture } from '@/lib/types';
import heroSlope from '@/assets/site/photos/Hero_Banner_Hematite_Slope_Katujpani.webp?site';
import oreCloseup from '@/assets/site/photos/Product_Hematite_Ore_Closeup.webp?site';
import boulderSwSlope from '@/assets/site/photos/Gallery_Hematite_Boulder_SW_Slope.webp?site';
import specimenDetail from '@/assets/site/photos/Gallery_Hematite_Specimen_Detail.webp?site';
import boulderForest from '@/assets/site/photos/Gallery_Hematite_Boulder_Forest.webp?site';
import texture from '@/assets/site/photos/Texture_Weathered_Hematite.webp?site';
import labAssay from '@/assets/site/photos/Lab_Assay_Channel_Chip_Samples.webp?site';
import bedMeasurement from '@/assets/site/photos/Field_Survey_Bed_Measurement.webp?site';
import benchmark from '@/assets/site/photos/Field_Survey_Benchmark_Marker.webp?site';
import samplingTeam from '@/assets/site/photos/Field_Sampling_Team.webp?site';
import channelSafety from '@/assets/site/photos/Field_Sampling_Channel_Safety.webp?site';
import channelLine from '@/assets/site/photos/Channel_Sample_Line.webp?site';
import channelChB1 from '@/assets/site/photos/Channel_Sample_CH-B-1.webp?site';
import southernSlope from '@/assets/site/photos/Sustainability_Southern_Slope_Vegetation.webp?site';
import topsoil from '@/assets/site/photos/Sustainability_Topsoil_Vegetation.webp?site';
import mapSatellite from '@/assets/site/maps/Location_Map_Katujpani_Satellite.webp?site';
import mapTopo from '@/assets/site/maps/Location_Map_Katujpani_Topo_Sheet.webp?site';
import mapLease from '@/assets/site/maps/Lease_Map_Deposit_Areas_A_B_C.webp?site';
import mapGeology from '@/assets/site/maps/Geology_Map_Regional_Lease_Area.webp?site';
import mapLegend from '@/assets/site/maps/Geology_Map_Legend.webp?site';
// Niraum's own field photographs (originals in design-assets/originals) — sharper than the
// report crops, so they take the large slots. Location not stated in alt text: the sample
// codes (CH-8, CHD-5, CHD-10) are not Katujpani assay samples.
import cliffGeologist from '@/assets/site/photos/iron-ore-outcrop-cliff-field-geologist.webp?photo';
import sampleCh8 from '@/assets/site/photos/iron-ore-outcrop-sample-ch8-notebook.webp?photo';
import sampleChd5 from '@/assets/site/photos/iron-ore-outcrop-sample-chd5-reddish-band.webp?photo';
import sampleChd10 from '@/assets/site/photos/iron-ore-outcrop-sample-chd10-fractured-face.webp?photo';
import channelWide from '@/assets/site/photos/iron-ore-rock-face-channel-sampling-wide.webp?photo';
import channelMarks from '@/assets/site/photos/iron-ore-rock-face-channel-sampling-marks.webp?photo';
import mossFerns from '@/assets/site/photos/iron-ore-outcrop-moss-ferns.webp?photo';
import hillsideBoulders from '@/assets/site/photos/bedrock-boulders-hillside-vegetation.webp?photo';
// Banner photos chosen by Niraum (11 Oct 2026). Not taken at Katujpani, so the alt text stays
// generic; source and licence are [CONFIRM] in assets/CREDITS.md.
import stockpileCrane from '@/assets/images/crane.jpg?photo';
import crushingPlant from '@/assets/images/worksites.jpg?photo';

const img = (picture: Picture, alt: string): ImageSource => ({
  src: picture.img.src,
  width: picture.img.w,
  height: picture.img.h,
  alt,
  picture,
});

export const siteImages = {
  heroSlope: img(
    heroSlope,
    'Dark hematite outcrop on an open forested slope at the Katujpani deposit, Makawanpur',
  ),
  oreCloseup: img(oreCloseup, 'Close-up of dark hematite ore at Katujpani with a pen for scale'),
  boulderSwSlope: img(
    boulderSwSlope,
    'Hematite boulder on the south-west slope, with a pen for scale',
  ),
  specimenDetail: img(specimenDetail, 'Hematite specimen surface beside a scale bar'),
  boulderForest: img(boulderForest, 'Dark hematite boulders among trees, with a survey pole'),
  texture: img(texture, ''),
  labAssay: img(
    labAssay,
    'Bagged and labelled channel and chip samples ready for laboratory assay',
  ),
  bedMeasurement: img(bedMeasurement, 'Surveyor climbing a large outcrop during the field survey'),
  benchmark: img(benchmark, 'Survey marker on a rock among leaf litter'),
  samplingTeam: img(samplingTeam, 'Two field workers bagging rock samples'),
  channelSafety: img(channelSafety, 'Gloved worker cutting a channel sample on a rock face'),
  channelLine: img(channelLine, 'Red-painted channel sampling line across a dark ore face'),
  channelChB1: img(
    channelChB1,
    'Sample point CH-B-1 painted on the outcrop, with a notebook for scale',
  ),
  southernSlope: img(
    southernSlope,
    'Open forest with scattered rock on the southern slope of the lease area',
  ),
  topsoil: img(topsoil, 'Vegetation and topsoil over a rock outcrop in the lease area'),
  mapSatellite: img(
    mapSatellite,
    'Satellite location map of the Katujpani iron deposit, Bakaiya-09, Makawanpur',
  ),
  mapTopo: img(mapTopo, 'Topographic sheet 2785 10A showing the Katujpani deposit location'),
  mapLease: img(mapLease, 'Lease map showing deposit areas A, B and C'),
  mapGeology: img(mapGeology, 'Regional geology map around the lease area (after DMG)'),
  mapLegend: img(mapLegend, 'Legend for the regional geology map'),
} satisfies Record<string, ImageSource>;

/** Real site photography (© Niraum Metals Pvt. Ltd.) — preferred over report crops. */
export const photos = {
  cliffGeologist: img(
    cliffGeologist,
    'Field geologist sampling a tall, dark ore-bearing rock face during an exploration survey',
  ),
  sampleCh8: img(
    sampleCh8,
    'Iron-stained outcrop marked CH-8 in yellow paint, with a notebook for scale',
  ),
  sampleChd5: img(
    sampleChd5,
    'Dark outcrop marked CHD-5 with a reddish ore band and a notebook for scale',
  ),
  sampleChd10: img(
    sampleChd10,
    'Fractured dark ore face marked CHD-10 in yellow paint, with a tool for scale',
  ),
  channelWide: img(
    channelWide,
    'Wet rock face with orange channel-sampling lines under green plants',
  ),
  channelMarks: img(
    channelMarks,
    'Orange channel-sampling lines painted across a weathered rock face',
  ),
  mossFerns: img(mossFerns, 'Outcrop covered with moss and ferns'),
  hillsideBoulders: img(
    hillsideBoulders,
    'Boulders of exposed bedrock among green grass and shrubs',
  ),
} satisfies Record<string, ImageSource>;

/** Banner photos (illustrative, not of the Katujpani site): Home hero and page heroes. */
export const banners = {
  stockpile: img(
    stockpileCrane,
    'Large ore stockpile with orange stacker-reclaimer machines against a blue sky',
  ),
  crushingPlant: img(
    crushingPlant,
    'Crushing and screening plant with conveyors, stockpiles and wheel loaders below a forested hill',
  ),
} satisfies Record<string, ImageSource>;
