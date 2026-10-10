import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageSpinner } from '../components/PageSpinner';
import { ReauthDialog } from '../components/ReauthDialog';
import { lastSignedInId, ME_KEY, useMe, type AdminUser } from './useMe';

const AUTH_EXPIRED_EVENT = 'niraum:auth-expired';
const CHANGE_PASSWORD = '/admin/change-password';

interface Expired {
  email?: string | undefined;
  id?: string | undefined;
}

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
  const navigate = useNavigate();
  // Set while the session expired under an open page; holds who was signed in.
  const [expired, setExpired] = useState<Expired | null>(null);

  useEffect(() => {
    const onExpired = () => {
      const previous = qc.getQueryData<AdminUser | null>(ME_KEY);
      // Every request waiting on the same failed refresh fires this; keep the first snapshot.
      setExpired((current) => current ?? { email: previous?.email, id: lastSignedInId(qc) });
      qc.setQueryData(ME_KEY, null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [qc]);

  const user = me.data;
  // Signed in again by other means (another tab's login refetched ME, …) → no dialog.
  // Adjusted during render (React's "state from props" pattern) rather than in an effect.
  if (user && expired) setExpired(null);

  const path = location.pathname + location.search;

  if (me.isPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <PageSpinner />
      </div>
    );
  }

  // Only when there is nothing to show: a failed background refetch keeps the open page
  // (and its unsaved input) on screen with the cached user.
  if (me.isError && me.data === undefined) {
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
          onSignedIn={(signedIn) => {
            const sameUser = !expired.id || expired.id === signedIn.id;
            setExpired(null);
            if (!sameUser) {
              // Another account: the draft belonged to the previous user (its cached data was
              // already dropped by useLogin), so start over on the dashboard.
              navigate('/admin', { replace: true });
              return;
            }
            // Requests that failed while signed out can try again now.
            void qc.invalidateQueries({ predicate: (q) => q.state.status === 'error' });
          }}
        />
      )}
    </>
  );
}
