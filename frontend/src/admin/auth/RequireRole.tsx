import type { ReactNode } from 'react';
import { NoAccess } from '../layout/NoAccess';
import { can, type Area } from './roles';
import { useMe } from './useMe';

/**
 * Renders `children` only for roles that may use `area`; others see "No access". With no user
 * (session expired under an open page, RequireAuth shows the sign-in dialog) the page stays
 * mounted so unsaved input survives. The API is the real authority.
 */
export function RequireRole({ area, children }: { area: Area; children: ReactNode }) {
  const me = useMe();
  if (me.data && !can(me.data.role, area)) return <NoAccess />;
  return <>{children}</>;
}
