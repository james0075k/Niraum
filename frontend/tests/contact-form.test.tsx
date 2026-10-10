import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ContactForm } from '@/components/sections/ContactForm';
import { api } from '@/lib/api';
import { renderWithProviders } from './utils';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const post = vi.mocked(api.post);

async function fillValid() {
  await userEvent.type(screen.getByLabelText('Full name *'), 'Sita Sharma');
  await userEvent.type(screen.getByLabelText('Email *'), 'sita@example.com');
  await userEvent.type(screen.getByLabelText('Phone'), '+977 1 5555555');
  await userEvent.type(screen.getByLabelText('Company'), 'Valley Builders');
  await userEvent.type(screen.getByLabelText('Subject *'), 'Aggregate supply');
  await userEvent.type(screen.getByLabelText('Message *'), 'We need 200 m³ of 20 mm aggregate.');
}

describe('ContactForm', () => {
  beforeEach(() => {
    post.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it('shows validation messages and does not submit an empty form', async () => {
    renderWithProviders(<ContactForm />);
    await userEvent.click(screen.getByRole('button', { name: /Send message/ }));
    expect(await screen.findByText('Please enter your name.')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Please write at least 10 characters.')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('prefills the subject from the quote link', () => {
    renderWithProviders(<ContactForm defaultSubject="Quote request" />);
    expect(screen.getByLabelText('Subject *')).toHaveValue('Quote request');
  });

  it('posts a valid message with an empty honeypot and confirms with a toast', async () => {
    post.mockResolvedValue({ data: { data: { ok: true } } });
    renderWithProviders(<ContactForm />);
    await fillValid();
    await userEvent.click(screen.getByRole('button', { name: /Send message/ }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/contact', {
      name: 'Sita Sharma',
      email: 'sita@example.com',
      phone: '+977 1 5555555',
      company: 'Valley Builders',
      subject: 'Aggregate supply',
      message: 'We need 200 m³ of 20 mm aggregate.',
      website: '',
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(screen.getByLabelText('Full name *')).toHaveValue('');
  });

  it('keeps the input and shows an error toast when sending fails', async () => {
    post.mockRejectedValue(new Error('500'));
    renderWithProviders(<ContactForm />);
    await fillValid();
    await userEvent.click(screen.getByRole('button', { name: /Send message/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByLabelText('Full name *')).toHaveValue('Sita Sharma');
  });
});
