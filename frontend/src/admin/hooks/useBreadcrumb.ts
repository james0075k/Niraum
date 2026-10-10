import { useContext, useEffect } from 'react';
import { BreadcrumbContext } from '../layout/shellContext';

/** Sets the page's last breadcrumb (e.g. a product name) while the page is mounted. */
export function useBreadcrumb(label: string): void {
  const set = useContext(BreadcrumbContext);
  useEffect(() => {
    if (!set) return;
    set(label || null);
    return () => set(null);
  }, [set, label]);
}
