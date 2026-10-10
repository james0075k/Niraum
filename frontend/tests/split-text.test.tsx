import { screen } from '@testing-library/react';
import { AxiosError } from 'axios';
import { vi } from 'vitest';
import { SplitText } from '@/components/motion/SplitText';
import { Hero } from '@/components/sections/Hero';
import { renderWithProviders } from './utils';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn().mockRejectedValue(new AxiosError('Network Error')), post: vi.fn() },
}));

/**
 * Browsers drop a space that is the last thing inside an inline-block, so "Strength Forged"
 * rendered as "StrengthForged". jsdom has no layout, so check the structure: every inter-word
 * space must be a text node whose parent is NOT an inline-block, and no inline-block may hold
 * leading/trailing whitespace.
 */
function expectRealSpaces(heading: HTMLElement, sentence: string) {
  expect(heading.textContent).toBe(sentence);
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  let spaces = 0;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.textContent === ' ') {
      spaces += 1;
      expect((n.parentElement as HTMLElement).className).not.toMatch(/\binline-block\b/);
    }
  }
  expect(spaces).toBe(sentence.split(' ').length - 1);
  heading.querySelectorAll<HTMLElement>('.inline-block').forEach((el) => {
    expect(el.textContent).toBe(el.textContent?.trim());
  });
}

const reducedMotion = (on: boolean) =>
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: on && query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );

afterEach(() => reducedMotion(false));

describe('SplitText word spacing', () => {
  it('hero H1 reads "Strength Forged For Generations" with real spaces (/en)', () => {
    renderWithProviders(<Hero />, { route: '/en' });
    expectRealSpaces(screen.getByRole('heading', { level: 1 }), 'Strength Forged For Generations');
  });

  it('keeps spaces in the Nepali hero (/ne)', () => {
    renderWithProviders(<Hero />, { route: '/ne' });
    expectRealSpaces(screen.getByRole('heading', { level: 1 }), 'पुस्तौँसम्म टिक्ने बल');
  });

  it('keeps spaces in the scroll-triggered variant', () => {
    renderWithProviders(<SplitText as="h2" text="From field to supply." />);
    expectRealSpaces(screen.getByRole('heading', { level: 2 }), 'From field to supply.');
  });

  it('keeps spaces with reduced motion on', () => {
    reducedMotion(true);
    renderWithProviders(<SplitText as="h1" immediate text="Strength Forged For Generations" />);
    expectRealSpaces(screen.getByRole('heading', { level: 1 }), 'Strength Forged For Generations');
  });
});
