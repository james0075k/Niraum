import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Captcha, captchaEnabled, type CaptchaHandle } from '@/components/common/Captcha';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ApiErrorBody } from '@/lib/api';
import { useLogin, type AdminUser } from '../auth/useMe';
import { PasswordInput } from './PasswordInput';

/** Only the email is remembered — never a token or password (the session is cookie-only). */
const REMEMBER_KEY = 'niraum-admin-email';

function readRemembered(): string {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeRemembered(email: string | null) {
  try {
    if (email) localStorage.setItem(REMEMBER_KEY, email);
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // Storage blocked (private mode, policy) — remembering is a convenience only.
  }
}

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.').max(128),
});
type Values = z.infer<typeof schema>;

function formatTime(iso: unknown): string | null {
  if (typeof iso !== 'string') return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Maps a failed login to the message shown in the alert area. */
function loginErrorMessage(err: unknown): string {
  if (!isAxiosError<ApiErrorBody>(err) || !err.response) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  const { code, details } = err.response.data?.error ?? {};
  switch (code) {
    case 'UNAUTHENTICATED':
      return 'Email or password is incorrect';
    case 'ACCOUNT_LOCKED': {
      const at = formatTime((details as { retryAt?: unknown } | undefined)?.retryAt);
      return at
        ? `Too many attempts. Try again after ${at}`
        : 'Too many attempts. Your account is locked for a few minutes.';
    }
    case 'CAPTCHA_REQUIRED':
    case 'CAPTCHA_FAILED':
      return 'Please complete the verification';
    case 'RATE_LIMITED':
      return 'Too many attempts from this network — wait a few minutes';
    case 'VALIDATION_ERROR':
      return 'Check the email and password and try again.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

/** True when the API asks for the Turnstile check before the next attempt. */
function needsCaptcha(err: unknown): boolean {
  if (!isAxiosError<ApiErrorBody>(err)) return false;
  const body = err.response?.data?.error;
  if (!body) return false;
  if (body.code === 'CAPTCHA_REQUIRED' || body.code === 'CAPTCHA_FAILED') return true;
  return (body.details as { captcha?: unknown } | undefined)?.captcha === true;
}

/**
 * Email + password form used by the sign-in page and the session-expired dialog. The Turnstile
 * widget appears only after the API reports repeated failures, and only when this build has a
 * site key (without one the dev API skips verification).
 */
export function LoginForm({
  onSuccess,
  defaultEmail,
  showExtras = true,
}: {
  onSuccess: (user: AdminUser) => void;
  defaultEmail?: string;
  /** "Remember this device" + "Forgot password?" (hidden in the re-auth dialog). */
  showExtras?: boolean;
}) {
  const [remembered] = useState(readRemembered);
  const [remember, setRemember] = useState(Boolean(remembered));
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail ?? remembered, password: '' },
  });
  const login = useLogin();
  const [error, setError] = useState<string | null>(null);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captcha = useRef<CaptchaHandle>(null);

  const showCaptcha = captchaEnabled && captchaRequired;

  async function onSubmit(values: Values) {
    setError(null);
    try {
      const user = await login.mutateAsync(
        showCaptcha && captchaToken ? { ...values, captchaToken } : values,
      );
      if (showExtras) writeRemembered(remember ? values.email : null);
      onSuccess(user);
    } catch (err) {
      setError(loginErrorMessage(err));
      if (needsCaptcha(err)) setCaptchaRequired(true);
    } finally {
      // Turnstile tokens are single-use.
      captcha.current?.reset();
    }
  }

  const submitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" inputMode="email" autoComplete="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                {showExtras && (
                  <Link
                    to="/admin/forgot-password"
                    className="text-xs font-medium text-link underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {showExtras && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-device"
              checked={remember}
              onCheckedChange={(v) => setRemember(v === true)}
            />
            <Label htmlFor="remember-device" className="text-sm font-normal">
              Remember this device
            </Label>
          </div>
        )}
        {showCaptcha && <Captcha ref={captcha} onToken={setCaptchaToken} />}
        <Button
          type="submit"
          className="w-full"
          disabled={submitting || (showCaptcha && !captchaToken)}
        >
          {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          Sign in
        </Button>
      </form>
    </Form>
  );
}
