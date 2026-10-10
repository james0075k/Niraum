import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageSpinner } from '../components/PageSpinner';
import { ReauthDialog } from '../components/ReauthDialog';
import { ME_KEY, useMe, type AdminUser } from './useMe';

const AUTH_EXPIRED_EVENT = 'niraum:auth-expired';
const CHANGE_PASSWORD = '/admin/change-password';

/**
 * Gate for every signed-in admin route.
 * - checking the session → full-page spinner
 * - no session → `/admin/login?next=<this path>`
 * - `mustChangePassword` → `/admin/change-password` (the only page allowed)
 * - session lost mid-page (`niraum:auth-expired` from the api interceptor) → the page stays
 *   mounted under a sign-in dialog, so unsaved form input survives re-authentication.
 */
export function RequireAuth() {
  const qc = useQueryClient();
  const me = useMe();
  const location = useLocation();
  // Set while the session expired under an open page; holds the last user's email.
  const [expired, setExpired] = useState<{ email?: string | undefined } | null>(null);

  useEffect(() => {
    const onExpired = () => {
      const previous = qc.getQueryData<AdminUser | null>(ME_KEY);
      setExpired({ email: previous?.email });
      qc.setQueryData(ME_KEY, null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [qc]);

  const path = location.pathname + location.search;

  if (me.isPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <PageSpinner />
      </div>
    );
  }

  if (me.isError) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div className="space-y-4">
          <p role="alert">Could not reach the server to check your session.</p>
          <Button variant="outline" onClick={() => void me.refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const user = me.data;
  if (!user && !expired) {
    return <Navigate to={`/admin/login?next=${encodeURIComponent(path)}`} replace />;
  }
  if (user?.mustChangePassword && location.pathname !== CHANGE_PASSWORD) {
    return <Navigate to={CHANGE_PASSWORD} replace />;
  }

  // Same element tree with or without the dialog, so the page underneath never remounts.
  return (
    <>
      <Outlet />
      {!user && expired && (
        <ReauthDialog
          email={expired.email}
          next={path}
          onSignedIn={() => {
            setExpired(null);
            // Requests that failed while signed out can try again now.
            void qc.invalidateQueries({ predicate: (q) => q.state.status === 'error' });
          }}
        />
      )}
    </>
  );
}
