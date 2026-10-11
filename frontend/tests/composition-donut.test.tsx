import { screen } from '@testing-library/react';
import { CompositionDonut } from '@/components/sections/CompositionDonut';
import { compositionSlices } from '@/lib/composition';
import type { AssaySection } from '@/lib/types';
import { renderWithProviders } from './utils';

// Table 14 deposit weighted average (docs/content/data/assay_data.json summary).
const overall: AssaySection = {
  section: 'Weighted average',
  thicknessM: 62.55,
  SiO2: 53.05,
  Fe: 23.48,
  Fe2O3: 33.59,
  Al2O3: 3.22,
};

describe('compositionSlices', () => {
  it('splits the deposit average into oxides plus the remainder, largest first', () => {
    expect(compositionSlices(overall)).toEqual([
      { key: 'sio2', value: 53.05 },
      { key: 'fe2o3', value: 33.59 },
      { key: 'other', value: 10.14 },
      { key: 'al2o3', value: 3.22 },
    ]);
  });

  it('never makes Fe a slice (it is contained in Fe₂O₃) and sums to 100', () => {
    const slices = compositionSlices(overall);
    expect(slices.map((s) => s.key)).not.toContain('fe');
    expect(slices.reduce((n, s) => n + s.value, 0)).toBeCloseTo(100, 6);
  });

  it('drops the remainder when the oxides already reach 100', () => {
    const full = { ...overall, SiO2: 63.19 };
    expect(compositionSlices(full).map((s) => s.key)).toEqual(['sio2', 'fe2o3', 'al2o3']);
  });
});

describe('CompositionDonut', () => {
  it('shows a legend with each value and Fe as the centre label', () => {
    renderWithProviders(<CompositionDonut overall={overall} />, { route: '/en' });
    const fig = screen.getByRole('figure', { name: /composition/i });
    expect(fig).toHaveTextContent('53.05%');
    expect(fig).toHaveTextContent('33.59%');
    expect(fig).toHaveTextContent('3.22%');
    expect(fig).toHaveTextContent('10.14%');
    expect(fig).toHaveTextContent(/Fe\s*23\.48%/);
  });

  it('renders nothing without a deposit average', () => {
    const { container } = renderWithProviders(<CompositionDonut overall={null} />, {
      route: '/en',
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('labels the chart in Nepali on /ne', () => {
    renderWithProviders(<CompositionDonut overall={overall} />, { route: '/ne' });
    expect(screen.getByRole('figure', { name: /संरचना/ })).toBeInTheDocument();
  });
});
