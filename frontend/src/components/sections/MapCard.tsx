import { Navigation } from 'lucide-react';
import { useT } from '@/hooks/useLang';
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMounted } from '@/hooks/useMounted';
import { directionsUrl } from '@/lib/format';
import { cn } from '@/lib/utils';

// Leaflet touches `window` on import — load it only in the browser.
const LeafletMap = lazy(() => import('./LeafletMap'));

interface MapCardProps {
  lat: number;
  lng: number;
  zoom?: number;
  title: string;
  address: string;
  /** Shows a note that the pin is not the exact location yet. */
  approximate?: boolean;
  className?: string;
}

/** Glass map card: OpenStreetMap + copper hexagon pin + popup + "Get directions". */
export function MapCard({
  lat,
  lng,
  zoom = 14,
  title,
  address,
  approximate,
  className,
}: MapCardProps) {
  const mounted = useMounted();
  const { t } = useT();
  const directions = directionsUrl(lat, lng);

  return (
    <figure className={cn('glass overflow-hidden', className)}>
      <div className="relative h-72 sm:h-96" aria-label={t('map.region', { title })} role="region">
        {mounted ? (
          <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
            <LeafletMap
              lat={lat}
              lng={lng}
              zoom={zoom}
              title={title}
              address={address}
              directionsUrl={directions}
            />
          </Suspense>
        ) : (
          <Skeleton className="h-full w-full rounded-none" />
        )}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{address}</p>
          {approximate && <p className="mt-1 text-xs text-copper-ink">{t('map.approx')}</p>}
        </div>
        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-foreground/20 px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" /> {t('map.directions')}
        </a>
      </figcaption>
    </figure>
  );
}
