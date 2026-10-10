import { useContext, useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { UnsavedContext } from '../layout/shellContext';

/**
 * While `dirty`, leaving the page asks first: closing/reloading the tab triggers the browser's
 * own prompt (`beforeunload`); in-app navigation is held by `useBlocker` and AdminLayout shows
 * "Discard unsaved changes?". Needs the data router (createBrowserRouter via vite-react-ssg;
 * createMemoryRouter in tests). Use it once per page.
 */
export function useUnsavedGuard(dirty: boolean): void {
  const report = useContext(UnsavedContext);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Older browsers need returnValue set to show the prompt.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // Saved (no longer dirty) while a navigation waits → let it go without asking.
  useEffect(() => {
    if (blocker.state === 'blocked' && !dirty) blocker.proceed();
  }, [blocker, dirty]);

  useEffect(() => {
    if (!report) return;
    report(blocker.state === 'blocked' && dirty ? blocker : null);
  }, [report, blocker, dirty]);

  useEffect(() => () => report?.(null), [report]);
}
