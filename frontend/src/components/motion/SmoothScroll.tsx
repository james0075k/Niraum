import { useEffect, useState, type ReactNode } from 'react';
import type Lenis from 'lenis';
import { LenisContext } from './lenis';

/**
 * Lenis smooth scroll synced with GSAP ScrollTrigger: Lenis drives the scroll, GSAP's
 * ticker drives Lenis, and every Lenis scroll updates ScrollTrigger. Both libraries
 * load after first paint so they never block LCP. Disabled for reduced motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    let cleanup = () => {};

    void Promise.all([import('lenis'), import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ default: LenisCtor }, { gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const instance = new LenisCtor({ lerp: 0.12, wheelMultiplier: 1 });
        instance.on('scroll', ScrollTrigger.update);
        const tick = (time: number) => instance.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        setLenis(instance);
        cleanup = () => {
          gsap.ticker.remove(tick);
          instance.destroy();
        };
      },
    );

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
