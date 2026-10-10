import { useCallback, useSyncExternalStore } from 'react';

/** SSR-safe media query hook (false on the server and during hydration). */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Desktop mouse/trackpad — hover-only effects (tilt, magnetic, glow) use this. */
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)');

/**
 * Reduced-motion preference. Unlike framer's useReducedMotion it is false during
 * hydration, so prerendered markup always matches the first client render.
 */
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
