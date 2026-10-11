import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Leaflet stays in the `map` chunk and only loads when a picker is on screen.
const PinMap = lazy(() => import('./MapPinPickerMap'));

/**
 * Map with a draggable pin: drag the marker or click the map to place it. Shows the pin as
 * "lat, lng" (6 dp). Used by Settings (office) and the deposit editor.
 */
export function MapPinPicker(props: {
  lat: number | null;
  lng: number | null;
  zoom?: number;
  onChange(p: { lat: number; lng: number }): void;
  height?: number;
  /** Marker title, e.g. "Deposit pin" (default "Office pin"). */
  pinLabel?: string;
}): JSX.Element {
  const { lat, lng, zoom = 15, onChange, height = 360, pinLabel } = props;
  const hasPin = lat !== null && lng !== null;
  return (
    <div className="space-y-2">
      <div
        role="region"
        aria-label="Map — drag the pin or click to place it"
        className="overflow-hidden rounded-lg border"
        style={{ height }}
      >
        <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
          <PinMap lat={lat} lng={lng} zoom={zoom} onChange={onChange} pinLabel={pinLabel} />
        </Suspense>
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {hasPin ? (
          <>
            Pin:{' '}
            <span className="font-mono tabular-nums">{`${lat.toFixed(6)}, ${lng.toFixed(6)}`}</span>
          </>
        ) : (
          'No pin yet — click the map to place it.'
        )}
      </p>
    </div>
  );
}
