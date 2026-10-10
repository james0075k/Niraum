import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const post = vi.mocked(api.post);

describe('ContactForm with Turnstile', () => {
  const turnstile = {
    render: vi.fn((_el: HTMLElement, _options: Record<string, unknown>) => 'w1'),
    reset: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'site-key');
    window.turnstile = turnstile;
    post.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.turnstile;
    document.head.querySelectorAll('script[src*="turnstile"]').forEach((s) => s.remove());
  });

  it('waits for a token, sends it with the message, then resets the widget', async () => {
    // Re-import after resetModules so the form and the providers share one theme context.
    const { ContactForm } = await import('@/components/sections/ContactForm');
    const { renderWithProviders } = await import('./utils');
    post.mockResolvedValue({ data: { data: { ok: true } } });
    renderWithProviders(<ContactForm />);

    const submit = screen.getByRole('button', { name: /Send message/ });
    expect(submit).toBeDisabled();

    // The script loads lazily; simulate Cloudflare finishing, then solving the challenge.
    const script = document.head.querySelector<HTMLScriptElement>('script[src*="turnstile"]');
    expect(script?.src).toContain('render=explicit');
    fireEvent.load(script!);
    await waitFor(() => expect(turnstile.render).toHaveBeenCalled());
    const options = turnstile.render.mock.calls[0]![1] as {
      sitekey: string;
      callback: (t: string) => void;
    };
    expect(options.sitekey).toBe('site-key');
    act(() => options.callback('token-123'));
    expect(submit).toBeEnabled();

    await userEvent.type(screen.getByLabelText('Full name *'), 'Sita Sharma');
    await userEvent.type(screen.getByLabelText('Email *'), 'sita@example.com');
    await userEvent.type(screen.getByLabelText('Subject *'), 'Aggregate supply');
    await userEvent.type(screen.getByLabelText('Message *'), 'We need 200 m³ of aggregate.');
    await userEvent.click(submit);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0]![1]).toMatchObject({ captchaToken: 'token-123' });
    await waitFor(() => expect(turnstile.reset).toHaveBeenCalledWith('w1'));
    expect(submit).toBeDisabled(); // a used token cannot be replayed
  });
});
