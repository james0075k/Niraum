import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MailCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { AuthCard } from '../components/AuthCard';

const schema = z.object({ email: z.string().trim().email('Enter a valid email address.') });
type Values = z.infer<typeof schema>;

/** Same text whatever happens, so the form can't be used to discover accounts. */
const SENT =
  'If that email belongs to an account, a reset link is on its way. The link works for 30 minutes.';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  async function onSubmit(values: Values) {
    try {
      await api.post('/auth/forgot', values);
    } catch {
      // Deliberately ignored: the response must not reveal whether the account exists.
    }
    setSent(true);
  }

  return (
    <AuthCard
      title="Reset your password"
      description={sent ? undefined : 'Enter the email you sign in with.'}
    >
      {sent ? (
        <div className="space-y-6 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-copper" aria-hidden="true" />
          <p role="status" className="text-sm">
            {SENT}
          </p>
          <Link
            to="/admin/login"
            className="inline-block text-sm font-medium text-link underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              Send reset link
            </Button>
            <p className="text-center">
              <Link
                to="/admin/login"
                className="text-sm font-medium text-link underline-offset-4 hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </form>
        </Form>
      )}
    </AuthCard>
  );
}
