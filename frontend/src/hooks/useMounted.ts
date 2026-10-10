import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * False on the server and during hydration, true afterwards — gate browser-only UI
 * to avoid SSR mismatches.
 */
export function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
