import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { can, type Role } from '../auth/roles';
import { ARCHIVED_ICON, ARCHIVED_NOTE, NAV, NAV_GROUPS, navItemFor, type NavItem } from '../nav';

/** Wraps a collapsed-sidebar control in a tooltip naming it. */
function Tip({ show, label, children }: { show: boolean; label: string; children: ReactNode }) {
  if (!show) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function Item({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Tip show={collapsed} label={item.label}>
        <NavLink
          to={item.to}
          end={item.to === '/admin'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              collapsed && 'justify-center px-0',
              isActive && 'bg-primary/10 text-foreground',
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
        </NavLink>
      </Tip>
    </li>
  );
}

/**
 * Role-aware admin navigation: only sections the role can open are listed. Projects, Posts and
 * Jobs sit in a collapsed "Archived sections" group. Used by the desktop rail (collapsible to
 * icons) and inside the mobile sheet.
 */
export function Sidebar({
  role,
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
}: {
  role: Role | undefined;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const visible = NAV.filter((n) => can(role, n.area));
  const archived = visible.filter((n) => n.archived);
  // Open by default when the current page is an archived one.
  const [showArchived, setShowArchived] = useState(() => !!navItemFor(pathname)?.archived);
  const ArchivedIcon = ARCHIVED_ICON;

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex h-16 items-center border-b px-3',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!collapsed && <Logo className="origin-left scale-[0.8]" />}
        {onToggleCollapsed && (
          <Tip show={collapsed} label="Expand sidebar">
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </Tip>
        )}
      </div>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto p-2">
        {NAV_GROUPS.map((group) => {
          const items = visible.filter((n) => n.group === group && !n.archived);
          if (items.length === 0) return null;
          return (
            <div key={group} className="mb-3">
              <p
                className={cn(
                  'px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground',
                  collapsed && 'sr-only',
                )}
              >
                {group}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <Item key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
                ))}
              </ul>
            </div>
          );
        })}
        {archived.length > 0 && (
          <div className="mt-2 border-t pt-2">
            <Tip show={collapsed} label="Archived sections">
              <button
                type="button"
                aria-expanded={showArchived}
                aria-controls="admin-archived-sections"
                onClick={() => setShowArchived((v) => !v)}
                className={cn(
                  'flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  collapsed && 'justify-center px-0',
                )}
              >
                <ArchivedIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className={cn('flex-1 text-left', collapsed && 'sr-only')}>
                  Archived sections
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', showArchived && 'rotate-180')}
                    aria-hidden="true"
                  />
                )}
              </button>
            </Tip>
            {showArchived && (
              <div id="admin-archived-sections">
                <p
                  className={cn('px-3 py-1 text-xs text-muted-foreground', collapsed && 'sr-only')}
                >
                  {ARCHIVED_NOTE}
                </p>
                <ul className="space-y-0.5">
                  {archived.map((item) => (
                    <Item key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
