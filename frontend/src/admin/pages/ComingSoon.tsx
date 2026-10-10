import { useLocation } from 'react-router-dom';
import { navItemFor } from '../nav';

/** Placeholder for a section whose page lands in a later Phase 5 task. */
export default function ComingSoon() {
  const { pathname } = useLocation();
  const item = navItemFor(pathname);
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">{item?.label ?? 'Coming soon'}</h1>
      <p className="text-muted-foreground">This section is coming soon.</p>
    </div>
  );
}
