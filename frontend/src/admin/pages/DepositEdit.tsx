import { useCallback, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPinPicker } from '../components/MapPinPicker';
import { MediaPicker } from '../components/MediaPicker';
import { useAdminList } from '../hooks/useAdminList';
import { adminPathOf, getResource } from '../resources/config';
import type { PickedMedia } from '../media/useMedia';
import ResourceEdit from './ResourceEdit';
import ResourceList from './ResourceList';

/** Yellow [CONFIRM] note. */
const NOTE =
  'rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100';
const MAX_MAPS = 20;

type Coord = number | null | undefined;

/** 6 decimal places (~0.1 m), or empty. */
const formatCoord = (v: Coord) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(6) : '');
const parseCoord = (text: string): number | null => (text.trim() === '' ? null : Number(text));
/** A coordinate the map can show (in range), else null. */
const onMap = (v: Coord, limit: number) =>
  typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= limit ? v : null;

/**
 * Latitude or longitude input bound to `location.lat|lng`. Keeps the typed text while it
 * matches the form value, and shows the 6 dp value when the pin moves it.
 */
function CoordInput({ name, label }: { name: 'lat' | 'lng'; label: string }) {
  const path = `location.${name}`;
  const { control, setValue, getFieldState, formState } = useFormContext();
  const value = useWatch({ control, name: path }) as Coord;
  const [text, setText] = useState(() => formatCoord(value));
  const { error } = getFieldState(path, formState);
  const id = `deposit-${name}`;

  // The pin (or a reset after saving) changed the value: show it, unless it's what was typed.
  const [shown, setShown] = useState(value);
  if (!Object.is(shown, value)) {
    setShown(value);
    if (!Object.is(parseCoord(text), value ?? null)) setText(formatCoord(value));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step="any"
        inputMode="decimal"
        className="tabular-nums"
        value={text}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => {
          setText(e.target.value);
          setValue(path, parseCoord(e.target.value), { shouldDirty: true, shouldValidate: true });
        }}
      />
      {error?.message && (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {String(error.message)}
        </p>
      )}
    </div>
  );
}

/** WGS-84 pin: map + lat/lng inputs, in sync both ways. Empty until confirmed. */
function DepositPin() {
  const { control, setValue } = useFormContext();
  const [lat, lng] = useWatch({ control, name: ['location.lat', 'location.lng'] }) as [
    Coord,
    Coord,
  ];
  const pinLat = onMap(lat, 90);
  const pinLng = onMap(lng, 180);
  const unset = lat === null || lat === undefined || lng === null || lng === undefined;

  const onChange = useCallback(
    (p: { lat: number; lng: number }) => {
      const opts = { shouldDirty: true, shouldValidate: true } as const;
      setValue('location.lat', Number(p.lat.toFixed(6)), opts);
      setValue('location.lng', Number(p.lng.toFixed(6)), opts);
    },
    [setValue],
  );

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Map pin (WGS-84)</legend>
      <p className="text-xs text-muted-foreground">
        Click the map or drag the pin, or type the coordinates. Never convert the local grid
        Easting/Northing by guesswork.
      </p>
      {unset && <p className={NOTE}>WGS-84 pin not confirmed ([CONFIRM])</p>}
      <MapPinPicker
        lat={pinLat !== null && pinLng !== null ? pinLat : null}
        lng={pinLat !== null && pinLng !== null ? pinLng : null}
        zoom={13}
        onChange={onChange}
        pinLabel="Deposit pin"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <CoordInput name="lat" label="Latitude" />
        <CoordInput name="lng" label="Longitude" />
      </div>
    </fieldset>
  );
}

/** Yellow note while the Map No. 1 land figures are unconfirmed. */
function LandNote() {
  const confirmed = useWatch({ name: 'land.confirmed' }) as boolean | undefined;
  return confirmed ? null : (
    <p className={NOTE}>Land figures are hidden on the public site until confirmed ([CONFIRM])</p>
  );
}

/** "Add from library" for the maps list (scans of the mine-scheme maps). */
function AddMap() {
  const { control, getValues, setValue } = useFormContext();
  const maps = (useWatch({ control, name: 'maps' }) as unknown[] | undefined) ?? [];
  if (maps.length >= MAX_MAPS) return null;
  const add = (m: PickedMedia | null) => {
    if (!m) return;
    const current = (getValues('maps') as unknown[] | undefined) ?? [];
    setValue(
      'maps',
      [
        ...current,
        { src: m.url, alt: m.alt, width: m.width, height: m.height, mediaId: m.mediaId },
      ],
      { shouldDirty: true, shouldValidate: true },
    );
  };
  return (
    <div className="space-y-2 border-t pt-4">
      <p className="text-sm font-medium">Add a map from the library</p>
      <MediaPicker value={null} onChange={add} />
    </div>
  );
}

const EXTRAS = { Location: <DepositPin />, Land: <LandNote />, Maps: <AddMap /> };

/** Create (`/admin/deposit/new`) or edit (`/admin/deposit/:id`) a deposit. */
export default function DepositEdit() {
  const base = adminPathOf(getResource('deposits'));
  return <ResourceEdit resource="deposits" backTo={`${base}?all=1`} sectionExtras={EXTRAS} />;
}

/**
 * `/admin/deposit`: opens the deposit straight away when there is exactly one; otherwise
 * (none, several, or `?all=1`) shows the deposit list with "New deposit".
 */
export function DepositIndex() {
  const cfg = getResource('deposits');
  const [params] = useSearchParams();
  const showAll = params.has('all');
  const list = useAdminList(cfg, { page: 1, limit: 2, state: 'all' });

  if (showAll) return <ResourceList resource="deposits" />;
  if (list.isPending) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading deposit">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  const rows = (list.data?.data ?? []) as { id: string }[];
  const only = rows.length === 1 ? rows[0] : undefined;
  if (only) return <Navigate to={`${adminPathOf(cfg)}/${only.id}`} replace />;
  return <ResourceList resource="deposits" />;
}
