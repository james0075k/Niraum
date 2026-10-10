import { KeyRound, LogOut, Menu, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMounted } from '@/hooks/useMounted';
import { useLogout, type AdminUser } from '../auth/useMe';
import { Breadcrumbs } from './Breadcrumbs';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/** Menu button (mobile), breadcrumbs, palette search, theme toggle and the account menu. */
export function Topbar({
  user,
  crumb,
  onOpenMenu,
  onOpenSearch,
}: {
  user: AdminUser | null;
  crumb: string | null;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
}) {
  const navigate = useNavigate();
  const logout = useLogout();
  const mounted = useMounted();
  const shortcut = mounted && isMac() ? '⌘K' : 'Ctrl K';

  // Signed out locally even if the request fails; the shell may unmount before it settles,
  // so navigate from the promise rather than a mutate() callback.
  const signOut = () => {
    void logout
      .mutateAsync()
      .catch(() => undefined)
      .finally(() => navigate('/admin/login', { replace: true }));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">
        <Breadcrumbs page={crumb} />
      </div>
      <button
        type="button"
        onClick={onOpenSearch}
        aria-label={`Search admin (${shortcut})`}
        className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden lg:inline">Search…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[0.7rem] sm:inline">
          {shortcut}
        </kbd>
      </button>
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials(user?.name ?? '')}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="space-y-1 font-normal">
            <span className="block truncate font-medium">{user?.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
            {user && (
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/admin/change-password')}>
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Change password
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={signOut} disabled={logout.isPending}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
