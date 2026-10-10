import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MapCard } from '@/components/sections/MapCard';
import type { LeafletMapProps } from '@/components/sections/LeafletMap';
import { renderWithProviders } from './utils';

// Leaflet needs a real layout engine; stand in a probe that exposes the props it gets.
vi.mock('@/components/sections/LeafletMap', () => ({
  default: (p: LeafletMapProps) => (
    <div data-testid="leaflet" data-lat={p.lat} data-lng={p.lng} data-zoom={p.zoom}>
      {p.address}
    </div>
  ),
}));

const props = {
  lat: 27.6644,
  lng: 85.3188,
  zoom: 14,
  title: 'Niraum Metals Pvt. Ltd.',
  address: 'Lalitpur-13, Lalitpur, Bagmati Province, Nepal',
};

describe('MapCard', () => {
  it('renders the map at the settings location with a Google Maps directions link', async () => {
    renderWithProviders(<MapCard {...props} />);
    const map = await screen.findByTestId('leaflet');
    expect(map).toHaveAttribute('data-lat', '27.6644');
    expect(map).toHaveAttribute('data-lng', '85.3188');
    expect(screen.getByRole('link', { name: /Get directions/ })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=27.6644,85.3188',
    );
    expect(screen.getByText(props.address, { selector: 'p' })).toBeInTheDocument();
  });

  it('follows the admin when the address (and so the pin) changes', async () => {
    const { rerender } = renderWithProviders(<MapCard {...props} />);
    await screen.findByTestId('leaflet');
    rerender(<MapCard {...props} lat={27.7172} lng={85.324} />);
    const map = await screen.findByTestId('leaflet');
    expect(map).toHaveAttribute('data-lat', '27.7172');
    expect(screen.getByRole('link', { name: /Get directions/ })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=27.7172,85.324',
    );
  });

  it('says when the pin is approximate', () => {
    renderWithProviders(<MapCard {...props} approximate />);
    expect(screen.getByText(/exact office location to be confirmed/)).toBeInTheDocument();
  });
});
