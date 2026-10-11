import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MediaPicker } from '@/admin/components/MediaPicker';
import { MediaLibrary } from '@/admin/pages/Media';
import { api } from '@/lib/api';
import { axiosError } from './utils';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const apiGet = vi.mocked(api.get);
const apiPost = vi.mocked(api.post);

const katujpani = {
  id: '6650a1b2c3d4e5f601234567',
  url: 'https://res.cloudinary.com/demo/image/upload/katujpani.jpg',
  publicId: 'niraum/images/katujpani',
  type: 'image',
  mime: 'image/jpeg',
  alt: 'Hematite outcrop at Katujpani',
  size: 120_000,
  width: 1600,
  height: 1067,
  createdAt: '2026-10-09T08:00:00.000Z',
};
const stockpile = {
  id: '6650a1b2c3d4e5f601234568',
  url: 'https://res.cloudinary.com/demo/image/upload/stockpile.jpg',
  publicId: 'niraum/images/stockpile',
  type: 'image',
  mime: 'image/jpeg',
  alt: 'Ore stockpile',
  size: 90_000,
  width: 1200,
  height: 800,
  createdAt: '2026-10-08T08:00:00.000Z',
};
const items = [katujpani, stockpile];

function wrap(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>);
}

const user = userEvent.setup();
const jpeg = () =>
  new File([new Uint8Array([0xff, 0xd8, 0xff])], 'ore.jpg', { type: 'image/jpeg' });

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  apiGet.mockResolvedValue({
    data: { data: items, meta: { page: 1, limit: 24, total: 2, pages: 1 } },
  });
});

describe('MediaPicker', () => {
  it('lists library images and returns the chosen one with its alt text', async () => {
    const onChange = vi.fn();
    wrap(<MediaPicker value={null} onChange={onChange} type="image" />);
    await user.click(screen.getByRole('button', { name: 'Choose from library' }));
    const dialog = await screen.findByRole('dialog');
    expect(apiGet).toHaveBeenCalledWith('/admin/media', {
      params: expect.objectContaining({ type: 'image' }),
    });
    await user.click(await within(dialog).findByRole('button', { name: /Ore stockpile/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Use image' }));
    expect(onChange).toHaveBeenCalledWith({
      url: stockpile.url,
      alt: 'Ore stockpile',
      publicId: 'niraum/images/stockpile',
      mediaId: stockpile.id,
      width: 1200,
      height: 800,
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('keeps Upload disabled until an image has alt text, then uploads it', async () => {
    const onChange = vi.fn();
    apiPost.mockResolvedValue({ data: { data: { ...katujpani, alt: 'Hand sample' } } });
    wrap(<MediaPicker value={null} onChange={onChange} type="image" />);
    await user.click(screen.getByRole('button', { name: 'Choose from library' }));
    const dialog = await screen.findByRole('dialog');
    await user.upload(within(dialog).getByLabelText('File'), jpeg());
    const upload = within(dialog).getByRole('button', { name: 'Upload' });
    expect(upload).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Alt text/), 'Hand sample');
    expect(upload).toBeEnabled();
    await user.click(upload);
    await waitFor(() => expect(apiPost).toHaveBeenCalled());
    const [path, body] = apiPost.mock.calls[0] as [string, FormData];
    expect(path).toBe('/admin/media');
    expect(body.get('alt')).toBe('Hand sample');
    expect((body.get('file') as File).name).toBe('ore.jpg');
    // A fresh upload is chosen straight away.
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ alt: 'Hand sample' })),
    );
  });

  it('shows the current image and can clear it', async () => {
    const onChange = vi.fn();
    wrap(<MediaPicker value={{ url: katujpani.url, alt: katujpani.alt }} onChange={onChange} />);
    expect(screen.getByRole('img', { name: katujpani.alt })).toHaveAttribute('src', katujpani.url);
    await user.click(screen.getByRole('button', { name: 'Remove image' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe('Media library page', () => {
  it('filters by type', async () => {
    wrap(<MediaLibrary />);
    expect(await screen.findByText('Ore stockpile')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Documents' }));
    await waitFor(() =>
      expect(apiGet).toHaveBeenLastCalledWith('/admin/media', {
        params: expect.objectContaining({ type: 'document' }),
      }),
    );
  });

  it('explains missing Cloudinary keys when upload returns STORAGE_UNAVAILABLE', async () => {
    apiPost.mockRejectedValue(axiosError(503, 'STORAGE_UNAVAILABLE'));
    wrap(<MediaLibrary />);
    await screen.findByText('Ore stockpile');
    await user.upload(screen.getByLabelText('File'), jpeg());
    await user.type(screen.getByLabelText(/Alt text/), 'Hand sample');
    await user.click(screen.getByRole('button', { name: 'Upload' }));
    expect(
      await screen.findByText("Media storage isn't configured (Cloudinary keys missing)"),
    ).toBeInTheDocument();
  });

  it('rejects a file over the size limit before uploading', async () => {
    wrap(<MediaLibrary />);
    await screen.findByText('Ore stockpile');
    const big = new File([new Uint8Array(1)], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(big, 'size', { value: 9 * 1024 * 1024 });
    await user.upload(screen.getByLabelText('File'), big);
    expect(screen.getByText('Images can be at most 8 MB.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });
});
