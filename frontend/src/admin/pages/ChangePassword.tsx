import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
import type { ApiErrorBody } from '@/lib/api';
import { newPasswordSchema, type NewPasswordValues } from '../auth/passwordRules';
import { useChangePassword, useMe } from '../auth/useMe';
import { AuthCard } from '../components/AuthCard';
import { PasswordInput } from '../components/PasswordInput';
import { PasswordStrength } from '../components/PasswordStrength';

const schema = newPasswordSchema(true);

function changeErrorMessage(err: unknown): string {
  if (isAxiosError<ApiErrorBody>(err) && err.response) {
    const { status } = err.response;
    if (status === 400) return err.response.data?.error?.message ?? 'Check the passwords.';
    if (status === 401) return 'Your session has ended. Sign in again to change your password.';
    if (status === 429) return 'Too many attempts — wait a few minutes.';
  }
  return 'Could not update the password. Please try again.';
}

/**
 * Change password — forced after the first sign-in or an admin reset (`mustChangePassword`),
 * or voluntary. Success refreshes the cached user, so RequireAuth lets the user through.
 */
export default function ChangePassword() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const change = useChangePassword();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const newPassword = useWatch({ control: form.control, name: 'newPassword' });

  async function onSubmit(values: NewPasswordValues) {
    setError(null);
    try {
      await change.mutateAsync({
        currentPassword: values.currentPassword ?? '',
        newPassword: values.newPassword,
      });
      toast.success('Password updated');
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(changeErrorMessage(err));
    }
  }

  return (
    <AuthCard
      title="Choose a new password"
      description={
        me?.mustChangePassword
          ? 'Before you continue, replace the temporary password with one only you know.'
          : 'Use at least 12 characters. A few unrelated words make a strong, memorable password.'
      }
    >
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
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            Update password
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
