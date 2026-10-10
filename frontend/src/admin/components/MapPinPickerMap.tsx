import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

/** Same copper hexagon pin as the public map (components/sections/LeafletMap.tsx). */
const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="40" height="46" viewBox="0 0 40 46" aria-hidden="true">
    <defs><linearGradient id="admin-mk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8A5236"/><stop offset=".5" stop-color="#DDA27C"/><stop offset="1" stop-color="#A9663F"/></linearGradient></defs>
    <path d="M20 2 37 11.5v19L20 40 3 30.5v-19Z" fill="url(#admin-mk)" stroke="#14171C" stroke-width="2"/>
    <circle cx="20" cy="21" r="5" fill="#14171C"/>
    <path d="M17 40h6l-3 5z" fill="#8A5236"/></svg>`,
  iconSize: [40, 46],
  iconAnchor: [20, 45],
});

/** Whole-country view when there is no pin yet. */
const NEPAL: [number, number] = [28.3949, 84.124];

export interface PinMapProps {
  lat: number | null;
  lng: number | null;
  zoom: number;
  onChange(p: { lat: number; lng: number }): void;
}

/** Follows the pin and zoom when they change from outside (geocode preview, zoom slider). */
function Follow({ lat, lng, zoom }: { lat: number | null; lng: number | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat === null || lng === null) return;
    map.setView([lat, lng], zoom);
  }, [map, lat, lng, zoom]);
  return null;
}

function ClickToPlace({ onChange }: Pick<PinMapProps, 'onChange'>) {
  useMapEvents({
    click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

export default function MapPinPickerMap({ lat, lng, zoom, onChange }: PinMapProps) {
  const hasPin = lat !== null && lng !== null;
  const handlers = useMemo(
    () => ({
      dragend: (e: L.LeafletEvent) => {
        const p = (e.target as L.Marker).getLatLng();
        onChange({ lat: p.lat, lng: p.lng });
      },
    }),
    [onChange],
  );

  return (
    <MapContainer
      center={hasPin ? [lat, lng] : NEPAL}
      zoom={hasPin ? zoom : 7}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        url={import.meta.env.VITE_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'}
        attribution={import.meta.env.VITE_MAP_ATTRIBUTION ?? '&copy; OpenStreetMap contributors'}
      />
      {hasPin && (
        <Marker
          position={[lat, lng]}
          icon={pinIcon}
          draggable
          eventHandlers={handlers}
          title="Office pin — drag to move"
          alt="Office pin"
        />
      )}
      <ClickToPlace onChange={onChange} />
      <Follow lat={lat} lng={lng} zoom={zoom} />
    </MapContainer>
  );
}
