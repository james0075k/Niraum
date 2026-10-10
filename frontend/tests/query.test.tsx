import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { api } from '@/lib/api';
import { useContentList } from '@/lib/query';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));
const get = vi.mocked(api.get);

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useContentList', () => {
  it('starts with local content, then switches to API data when available', async () => {
    get.mockResolvedValue({ data: { data: ['from-api'], meta: {} } } as AxiosResponse);
    const { result } = renderHook(() => useContentList(['t1'], '/x', ['local']), { wrapper });
    expect(result.current.data).toEqual(['local']);
    await waitFor(() => expect(result.current.data).toEqual(['from-api']));
  });

  it('keeps local content when the API is unreachable', async () => {
    get.mockRejectedValue(new AxiosError('Network Error'));
    const { result } = renderHook(() => useContentList(['t2'], '/x', ['local']), { wrapper });
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(result.current.data).toEqual(['local']);
    expect(result.current.isError).toBe(false);
  });
});

describe('withLocalImages', () => {
  it('maps seeded /images refs to local pictures and keeps the API alt text', async () => {
    const { withLocalImages, images } = await import('@/content/images');
    const out = withLocalImages({
      title: 'X',
      coverImage: { src: '/images/hillside-outcrop.jpg', alt: 'Edited alt' },
      gallery: [
        { src: '/images/mossy-outcrop.jpg', alt: '' },
        { src: 'https://cdn/x.jpg', alt: 'a' },
      ],
    });
    expect(out.coverImage).toMatchObject({ picture: images.hillside.picture, alt: 'Edited alt' });
    expect(out.gallery[0]).toMatchObject({ alt: images.mossyOutcrop.alt });
    expect(out.gallery[0]).toHaveProperty('picture');
    expect(out.gallery[1]).toEqual({ src: 'https://cdn/x.jpg', alt: 'a' });
  });
});
