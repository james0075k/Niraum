import { Expand } from 'lucide-react';
import { Img } from '@/components/common/Img';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { siteImages } from '@/content/siteImages';
import { useT } from '@/hooks/useLang';
import type { ImageSource } from '@/lib/types';

interface MapTab {
  key: 'satellite' | 'topo' | 'lease' | 'geology';
  image: ImageSource;
  legend?: ImageSource;
}

const MAPS: MapTab[] = [
  { key: 'satellite', image: siteImages.mapSatellite },
  { key: 'topo', image: siteImages.mapTopo },
  { key: 'lease', image: siteImages.mapLease },
  { key: 'geology', image: siteImages.mapGeology, legend: siteImages.mapLegend },
];

/** Opens the full map in a dialog (keyboard + screen-reader friendly via Radix). */
function Zoomable({ image, label }: { image: ImageSource; label: string }) {
  const { t } = useT('project');
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative block w-full overflow-hidden rounded-[20px] bg-offwhite text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${t('maps.enlarge')}: ${label}`}
        >
          <Img image={image} className="!object-contain" sizes="(min-width: 1024px) 80vw, 100vw" />
          <span className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-graphite/80 text-offwhite transition-transform group-hover:scale-105">
            <Expand className="h-5 w-5" aria-hidden="true" />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[95svh] max-w-[95vw] overflow-auto bg-offwhite p-3 sm:p-4">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <DialogDescription className="sr-only">{image.alt}</DialogDescription>
        <Img image={image} className="!h-auto !object-contain" sizes="95vw" />
      </DialogContent>
    </Dialog>
  );
}

/** Our Project maps: satellite, topo sheet, lease areas A/B/C, regional geology + legend. */
export function MapGallery() {
  const { t } = useT('project');
  return (
    <Tabs defaultValue="satellite" className="w-full">
      <TabsList className="mb-6 flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
        {MAPS.map((m) => (
          <TabsTrigger
            key={m.key}
            value={m.key}
            className="min-h-11 rounded-full border border-foreground/15 px-4 data-[state=active]:border-transparent data-[state=active]:bg-copper-gradient data-[state=active]:text-graphite"
          >
            {t(`maps.${m.key}`)}
          </TabsTrigger>
        ))}
      </TabsList>
      {MAPS.map((m) => (
        <TabsContent key={m.key} value={m.key} className="mt-0">
          <Zoomable image={m.image} label={t(`maps.${m.key}`)} />
          {m.legend && (
            <div className="mt-4 max-w-xl">
              <Zoomable image={m.legend} label={`${t(`maps.${m.key}`)} — legend`} />
            </div>
          )}
        </TabsContent>
      ))}
      <p className="mt-4 text-xs text-muted-foreground">{t('maps.source')}</p>
    </Tabs>
  );
}
