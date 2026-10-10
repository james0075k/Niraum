import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate, type Blocker } from 'react-router-dom';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { errorCode, useLogout, useMe, type AdminUser } from '../auth/useMe';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BreadcrumbContext, SIGN_IN_PATH, UnsavedContext, type UnsavedApi } from './shellContext';

const SIDEBAR_KEY = 'niraum-admin-sidebar';
const FORBIDDEN_TOAST = 'admin-forbidden';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

/**
 * The signed-in admin shell (inside RequireAuth): role-aware sidebar (desktop rail, mobile
 * sheet), topbar with breadcrumbs, Ctrl/Cmd+K palette, the unsaved-changes dialog and one
 * "no permission" toast for any 403 in the admin QueryClient. The Toaster lives in AdminRoot.
 */
export function AdminLayout() {
  const qc = useQueryClient();
  const me = useMe();
  const { pathname } = useLocation();

  // Keep the last signed-in user while the session-expired dialog is up (ME is null then),
  // so the nav and pages don't change under the dialog.
  const [lastUser, setLastUser] = useState<AdminUser | null>(me.data ?? null);
  if (me.data && me.data !== lastUser) setLastUser(me.data);
  const user = me.data ?? lastUser;

  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? 'collapsed' : 'expanded');
      } catch {
        // Storage blocked: the choice just isn't remembered.
      }
      return next;
    });

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [crumb, setCrumb] = useState<string | null>(null);
  const [blocker, setBlocker] = useState<Blocker | null>(null);

  // Close the mobile menu after any navigation (adjusted during render, not in an effect).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  // One toast per failed request with FORBIDDEN (the id also merges simultaneous ones).
  useEffect(() => {
    const notify = (error: unknown) => {
      if (errorCode(error) === 'FORBIDDEN') {
        toast.error("You don't have permission for that", { id: FORBIDDEN_TOAST });
      }
    };
    const offQueries = qc.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') notify(event.action.error);
    });
    const offMutations = qc.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') notify(event.action.error);
    });
    return () => {
      offQueries();
      offMutations();
    };
  }, [qc]);

  // Pages with unsaved changes (useUnsavedGuard) — sign-out asks before logging out.
  const dirtyPages = useRef(0);
  const unsavedApi = useMemo<UnsavedApi>(
    () => ({
      report: (b) => setBlocker(b),
      markDirty: () => {
        dirtyPages.current += 1;
        return () => {
          dirtyPages.current -= 1;
        };
      },
    }),
    [],
  );

  const navigate = useNavigate();
  const logout = useLogout();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const signOut = () => {
    setConfirmSignOut(false);
    // Signed out locally even if the request fails; the shell may unmount before it settles,
    // so navigate from the promise. The sign-in page is never held by the unsaved guard.
    void logout
      .mutateAsync()
      .catch(() => undefined)
      .finally(() => navigate(SIGN_IN_PATH, { replace: true }));
  };
  const requestSignOut = () => (dirtyPages.current > 0 ? setConfirmSignOut(true) : signOut());

  const setPageCrumb = useCallback((label: string | null) => setCrumb(label), []);

  return (
    <BreadcrumbContext.Provider value={setPageCrumb}>
      <UnsavedContext.Provider value={unsavedApi}>
        <TooltipProvider delayDuration={200}>
          <div className="flex min-h-screen bg-background text-foreground">
            <aside
              className={cn(
                'sticky top-0 hidden h-screen shrink-0 border-r bg-card transition-[width] duration-200 md:block',
                collapsed ? 'w-16' : 'w-60',
              )}
            >
              <Sidebar
                role={user?.role}
                collapsed={collapsed}
                onToggleCollapsed={toggleCollapsed}
              />
            </aside>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Admin menu</SheetTitle>
                <SheetDescription className="sr-only">Sections of the admin panel</SheetDescription>
                <Sidebar role={user?.role} onNavigate={() => setMenuOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar
                user={user}
                crumb={crumb}
                onOpenMenu={() => setMenuOpen(true)}
                onOpenSearch={() => setSearchOpen(true)}
                onSignOut={requestSignOut}
                signingOut={logout.isPending}
              />
              <main id="admin-main" className="flex-1 p-4 sm:p-6">
                <Outlet />
              </main>
            </div>
          </div>
          <CommandPalette role={user?.role} open={searchOpen} onOpenChange={setSearchOpen} />
          <ConfirmDialog
            open={blocker?.state === 'blocked'}
            title="Discard unsaved changes?"
            description="You have changes on this page that haven't been saved. If you leave now they will be lost."
            confirmLabel="Discard"
            cancelLabel="Cancel"
            destructive
            onConfirm={() => blocker?.proceed?.()}
            onCancel={() => blocker?.reset?.()}
          />
          <ConfirmDialog
            open={confirmSignOut}
            title="Discard unsaved changes?"
            description="You have changes on this page that haven't been saved. If you sign out now they will be lost."
            confirmLabel="Discard"
            cancelLabel="Cancel"
            destructive
            onConfirm={signOut}
            onCancel={() => setConfirmSignOut(false)}
          />
        </TooltipProvider>
      </UnsavedContext.Provider>
    </BreadcrumbContext.Provider>
  );
}
