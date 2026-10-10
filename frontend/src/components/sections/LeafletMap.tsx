import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

/** Copper hexagon pin (matches the brand mark's silhouette, not the mark itself). */
const hexIcon = L.divIcon({
  className: '',
  html: `<svg width="40" height="46" viewBox="0 0 40 46" aria-hidden="true">
    <defs><linearGradient id="mk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8A5236"/><stop offset=".5" stop-color="#DDA27C"/><stop offset="1" stop-color="#A9663F"/></linearGradient></defs>
    <path d="M20 2 37 11.5v19L20 40 3 30.5v-19Z" fill="url(#mk)" stroke="#14171C" stroke-width="2"/>
    <circle cx="20" cy="21" r="5" fill="#14171C"/>
    <path d="M17 40h6l-3 5z" fill="#8A5236"/></svg>`,
  iconSize: [40, 46],
  iconAnchor: [20, 45],
  popupAnchor: [0, -42],
});

/** Re-centres when the admin changes the address (settings refetch → new lat/lng). */
function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [map, lat, lng, zoom]);
  return null;
}

export interface LeafletMapProps {
  lat: number;
  lng: number;
  zoom: number;
  title: string;
  address: string;
  directionsUrl: string;
}

export default function LeafletMap({
  lat,
  lng,
  zoom,
  title,
  address,
  directionsUrl,
}: LeafletMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        url={import.meta.env.VITE_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'}
        attribution={import.meta.env.VITE_MAP_ATTRIBUTION ?? '&copy; OpenStreetMap contributors'}
      />
      <Marker position={[lat, lng]} icon={hexIcon} title={title} alt={title}>
        <Popup>
          <strong>{title}</strong>
          <br />
          {address}
          <br />
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
            Get directions
          </a>
        </Popup>
      </Marker>
      <Recenter lat={lat} lng={lng} zoom={zoom} />
    </MapContainer>
  );
}
