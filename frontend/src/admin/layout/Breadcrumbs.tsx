import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { navItemFor } from '../nav';

const EXTRA: Record<string, string> = { '/admin/change-password': 'Change password' };

interface Crumb {
  label: string;
  to?: string | undefined;
}

/** Dashboard › section (from NAV) › page crumb (set with `useBreadcrumb`). Last one is current. */
export function Breadcrumbs({ page }: { page: string | null }) {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, '');
  const section = navItemFor(path);
  const crumbs: Crumb[] = [{ label: 'Dashboard', to: '/admin' }];
  if (EXTRA[path]) crumbs.push({ label: EXTRA[path] });
  else if (section && section.to !== '/admin')
    crumbs.push({ label: section.label, to: section.to });
  if (page) crumbs.push({ label: page });

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={`${i}-${c.label}`}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className="min-w-0">
                {last || !c.to ? (
                  <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={c.to}>{c.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
