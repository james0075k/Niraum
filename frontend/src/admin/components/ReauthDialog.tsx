import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AdminUser } from '../auth/useMe';
import { LoginForm } from './LoginForm';

/**
 * Shown over the open page when the session can't be refreshed. The page underneath stays
 * mounted, so unsaved form input survives; signing in here restores the session in place.
 * It can't be dismissed — the only ways out are signing in or leaving for the sign-in page.
 */
export function ReauthDialog({
  email,
  next,
  onSignedIn,
}: {
  email?: string | undefined;
  next: string;
  onSignedIn: (user: AdminUser) => void;
}) {
  const block = (e: Event) => e.preventDefault();
  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        className="max-w-md [&>button]:hidden"
        onEscapeKeyDown={block}
        onPointerDownOutside={block}
        onInteractOutside={block}
      >
        <DialogHeader>
          <DialogTitle>Session expired — sign in again</DialogTitle>
          <DialogDescription>
            Your changes on this page are kept. Sign in to carry on where you left off.
          </DialogDescription>
        </DialogHeader>
        <LoginForm onSuccess={onSignedIn} defaultEmail={email} showExtras={false} />
        <p className="text-center text-xs text-muted-foreground">
          Not you?{' '}
          <Link
            to={`/admin/login?next=${encodeURIComponent(next)}`}
            reloadDocument
            className="font-medium text-link underline-offset-4 hover:underline"
          >
            Go to the sign-in page
          </Link>{' '}
          (unsaved changes will be lost)
        </p>
      </DialogContent>
    </Dialog>
  );
}
