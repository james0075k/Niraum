import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { api, type ApiErrorBody } from '@/lib/api';
import { newPasswordSchema, type NewPasswordValues } from '../auth/passwordRules';
import { AuthCard } from '../components/AuthCard';
import { PasswordInput } from '../components/PasswordInput';
import { PasswordStrength } from '../components/PasswordStrength';

const schema = newPasswordSchema(false);

type ResetError = 'invalid-link' | 'rate-limited' | 'failed';

const MESSAGES: Record<ResetError, string> = {
  'invalid-link': 'This reset link is invalid or has expired. Request a new one.',
  'rate-limited': 'Too many attempts — wait a few minutes.',
  failed: 'Could not reset the password. Please try again.',
};

/** Backend password rule messages (Zod `flatten()` → details.fieldErrors.password). */
function passwordFieldError(details: unknown): string | undefined {
  const fieldErrors = (details as { fieldErrors?: Record<string, unknown> } | undefined)
    ?.fieldErrors;
  const list = fieldErrors?.password;
  return Array.isArray(list) && typeof list[0] === 'string' ? list[0] : undefined;
}

const linkClass = 'text-sm font-medium text-link underline-offset-4 hover:underline';

/** Reset from the emailed link (`?token=`): new password + confirmation → `/auth/reset`. */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [error, setError] = useState<ResetError | null>(null);
  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });
  const newPassword = useWatch({ control: form.control, name: 'newPassword' });

  async function onSubmit(values: NewPasswordValues) {
    setError(null);
    try {
      await api.post('/auth/reset', { token, password: values.newPassword });
      toast.success('Password updated', { description: 'Sign in with your new password.' });
      navigate('/admin/login', { replace: true });
    } catch (err) {
      const response = isAxiosError<ApiErrorBody>(err) ? err.response : undefined;
      const body = response?.data?.error;
      const fieldMessage = passwordFieldError(body?.details);
      if (body?.code === 'VALIDATION_ERROR' && fieldMessage) {
        form.setError('newPassword', { message: fieldMessage });
      } else if (response?.status === 400) {
        // Unknown, used or expired token (VALIDATION_ERROR "Reset link is invalid or has expired").
        setError('invalid-link');
      } else if (response?.status === 429) {
        setError('rate-limited');
      } else {
        setError('failed');
      }
    }
  }

  if (!token) {
    return (
      <AuthCard title="Reset your password" description="This page needs the link from the email.">
        <p className="text-center">
          <Link to="/admin/forgot-password" className={linkClass}>
            Request a new link
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" description="Use at least 12 characters.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <p>{MESSAGES[error]}</p>
              {error === 'invalid-link' && (
                <Link to="/admin/forgot-password" className={linkClass}>
                  Request a new link
                </Link>
              )}
            </div>
          )}
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <PasswordStrength password={newPassword} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            Set new password
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
