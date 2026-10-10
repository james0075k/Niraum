import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { api } from '@/lib/api';
import { axiosError, editor, ok, renderAdmin } from './utils';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@/components/common/Captcha', () => import('./captchaMock'));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast, Toaster: () => null }));

const apiGet = vi.mocked(api.get);
const apiPost = vi.mocked(api.post);
const user = userEvent.setup();

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  toast.success.mockReset();
});

async function signIn(email = 'a@b.co', password = 'whatever-password') {
  await user.type(await screen.findByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('Login', () => {
  it('shows the lockout message with the retry time on 423', async () => {
    apiPost.mockRejectedValueOnce(
      axiosError(423, 'ACCOUNT_LOCKED', { retryAt: '2026-10-10T10:15:00.000Z' }),
    );
    renderAdmin('/admin/login');
    await signIn();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/locked|too many attempts/i);
    expect(alert).toHaveTextContent(
      new Date('2026-10-10T10:15:00.000Z').toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    );
  });

  it('says the email or password is incorrect on 401', async () => {
    apiPost.mockRejectedValueOnce(axiosError(401, 'UNAUTHENTICATED', { captcha: false }));
    renderAdmin('/admin/login');
    await signIn();
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect');
    expect(screen.queryByTestId('captcha')).not.toBeInTheDocument();
  });

  it('renders the captcha after the API says captcha: true and sends its token', async () => {
    apiPost.mockRejectedValueOnce(axiosError(401, 'UNAUTHENTICATED', { captcha: true }));
    renderAdmin('/admin/login');
    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(screen.queryByTestId('captcha')).not.toBeInTheDocument();
    await signIn();
    expect(await screen.findByTestId('captcha')).toBeInTheDocument();

    apiPost.mockResolvedValueOnce(ok(editor));
    await user.click(screen.getByTestId('captcha'));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() =>
      expect(apiPost).toHaveBeenLastCalledWith('/auth/login', {
        email: 'a@b.co',
        password: 'whatever-password',
        captchaToken: 'captcha-token',
      }),
    );
  });

  it('asks for verification on CAPTCHA_REQUIRED', async () => {
    apiPost.mockRejectedValueOnce(axiosError(400, 'CAPTCHA_REQUIRED', { captcha: true }));
    renderAdmin('/admin/login');
    await signIn();
    expect(await screen.findByRole('alert')).toHaveTextContent('Please complete the verification');
    expect(screen.getByTestId('captcha')).toBeInTheDocument();
  });

  it('explains network rate limiting', async () => {
    apiPost.mockRejectedValueOnce(axiosError(429, 'RATE_LIMITED'));
    renderAdmin('/admin/login');
    await signIn();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts from this network — wait a few minutes',
    );
  });

  it('toggles password visibility', async () => {
    renderAdmin('/admin/login');
    const input = await screen.findByLabelText('Password');
    await user.type(input, 'secret-value');
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('signs in and goes to a safe ?next= path', async () => {
    apiPost.mockResolvedValueOnce(ok(editor));
    const { router } = renderAdmin('/admin/login?next=%2Fadmin%2Fchange-password%3Ffrom%3Dlogin');
    await signIn();
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/change-password'));
    expect(router.state.location.search).toBe('?from=login');
    expect(apiPost).toHaveBeenCalledWith('/auth/login', {
      email: 'a@b.co',
      password: 'whatever-password',
    });
  });

  it.each(['//evil.example/admin', 'https://evil.example/admin', '/en/about', '/administrator'])(
    'ignores an unsafe next=%s and goes to /admin',
    async (next) => {
      apiPost.mockResolvedValueOnce(ok(editor));
      const { router } = renderAdmin(`/admin/login?next=${encodeURIComponent(next)}`);
      await signIn();
      expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/admin');
    },
  );

  it('remembers only the email when "Remember this device" is ticked', async () => {
    apiPost.mockResolvedValueOnce(ok(editor));
    renderAdmin('/admin/login');
    await user.click(await screen.findByRole('checkbox', { name: 'Remember this device' }));
    await signIn('editor@niraum.test', 'a-long-password-1');
    await screen.findByRole('heading', { name: 'Dashboard' });
    expect(localStorage.getItem('niraum-admin-email')).toBe('editor@niraum.test');
    expect(Object.keys(localStorage)).toEqual(['niraum-admin-email']);
    expect(JSON.stringify(localStorage)).not.toContain('a-long-password-1');
  });

  it('prefills a remembered email', async () => {
    localStorage.setItem('niraum-admin-email', 'editor@niraum.test');
    renderAdmin('/admin/login');
    expect(await screen.findByLabelText('Email')).toHaveValue('editor@niraum.test');
    expect(screen.getByRole('checkbox', { name: 'Remember this device' })).toBeChecked();
  });

  it('links to the forgot-password page', async () => {
    renderAdmin('/admin/login');
    expect(await screen.findByRole('link', { name: 'Forgot password?' })).toHaveAttribute(
      'href',
      '/admin/forgot-password',
    );
  });
});

describe('forced password change', () => {
  it('redirects to change-password when mustChangePassword', async () => {
    apiGet.mockResolvedValueOnce(ok({ ...editor, mustChangePassword: true }));
    renderAdmin('/admin');
    expect(
      await screen.findByRole('heading', { name: 'Choose a new password' }),
    ).toBeInTheDocument();
  });

  it('change-password blocks < 12 chars and mismatched confirmation', async () => {
    apiGet.mockResolvedValueOnce(ok({ ...editor, mustChangePassword: true }));
    renderAdmin('/admin/change-password');
    await user.type(await screen.findByLabelText('Current password'), 'old-password-1');
    await user.type(screen.getByLabelText('New password'), 'short');
    await user.type(screen.getByLabelText('Confirm new password'), 'different');
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText('Use at least 12 characters.')).toBeInTheDocument();
    expect(screen.getByText('The passwords do not match.')).toBeInTheDocument();
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('blocks reusing the current password', async () => {
    apiGet.mockResolvedValueOnce(ok({ ...editor, mustChangePassword: true }));
    renderAdmin('/admin/change-password');
    await user.type(await screen.findByLabelText('Current password'), 'same-password-123');
    await user.type(screen.getByLabelText('New password'), 'same-password-123');
    await user.type(screen.getByLabelText('Confirm new password'), 'same-password-123');
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    expect(
      await screen.findByText('Choose a password different from the current one.'),
    ).toBeInTheDocument();
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('shows the strength meter and updates the password', async () => {
    apiGet.mockResolvedValueOnce(ok({ ...editor, mustChangePassword: true }));
    apiPost.mockResolvedValueOnce(ok(editor));
    const { router } = renderAdmin('/admin/change-password');
    await user.type(await screen.findByLabelText('Current password'), 'old-password-1');
    await user.type(screen.getByLabelText('New password'), 'copper ridge lantern 42');
    expect(screen.getByText('Strong')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Confirm new password'), 'copper ridge lantern 42');
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'old-password-1',
        newPassword: 'copper ridge lantern 42',
      }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Password updated'));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'));
  });
});

describe('forgot / reset password', () => {
  const sent = /If that email belongs to an account/;

  it('shows the same message whether or not the request succeeds', async () => {
    apiPost.mockResolvedValueOnce({ data: { data: { message: 'x' } } });
    renderAdmin('/admin/forgot-password');
    await user.type(await screen.findByLabelText('Email'), 'a@b.co');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText(sent)).toBeInTheDocument();
    expect(apiPost).toHaveBeenCalledWith('/auth/forgot', { email: 'a@b.co' });
  });

  it('does not reveal a failure for unknown accounts', async () => {
    apiPost.mockRejectedValueOnce(axiosError(404, 'NOT_FOUND'));
    renderAdmin('/admin/forgot-password');
    await user.type(await screen.findByLabelText('Email'), 'nobody@b.co');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText(sent)).toBeInTheDocument();
  });

  it('resets with the token from the link and returns to sign-in', async () => {
    const token = 'a'.repeat(64);
    apiPost.mockResolvedValueOnce({ data: { data: { message: 'ok' } } });
    const { router } = renderAdmin(`/admin/reset-password?token=${token}`);
    await user.type(await screen.findByLabelText('New password'), 'copper ridge lantern 42');
    await user.type(screen.getByLabelText('Confirm new password'), 'copper ridge lantern 42');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));
    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/auth/reset', {
        token,
        password: 'copper ridge lantern 42',
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/login'));
    expect(toast.success).toHaveBeenCalled();
  });

  it('explains an expired reset link', async () => {
    apiPost.mockRejectedValueOnce(axiosError(400, 'INVALID_TOKEN'));
    renderAdmin(`/admin/reset-password?token=${'b'.repeat(64)}`);
    await user.type(await screen.findByLabelText('New password'), 'copper ridge lantern 42');
    await user.type(screen.getByLabelText('Confirm new password'), 'copper ridge lantern 42');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(/link is invalid or has expired/i)).toBeInTheDocument();
  });

  it('asks for a new link when the token is missing', async () => {
    renderAdmin('/admin/reset-password');
    expect(await screen.findByRole('link', { name: 'Request a new link' })).toHaveAttribute(
      'href',
      '/admin/forgot-password',
    );
  });
});
