import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { ease, pageTransition } from '@/lib/motion';
import { useLenis } from './lenis';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

/**
 * Route transition: old page fades out, a copper panel wipes across, the new page
 * fades up (0.5 s, ease [0.22,1,0.36,1]). Scrolls to top — or to the #hash target —
 * once the old page has left. First load does not animate (the preloader covers it).
 */
export function PageTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduce = usePrefersReducedMotion();
  const lenis = useLenis();

  /** Scrolls to the #hash target if present; otherwise to top when `orTop`. */
  function scrollToTarget(immediate: boolean, orTop: boolean) {
    const id = location.hash.slice(1);
    const target = id ? document.getElementById(decodeURIComponent(id)) : null;
    if (target) {
      if (lenis) lenis.scrollTo(target, { immediate, offset: -88 });
      else target.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' });
    } else if (!orTop) {
      return;
    } else if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }

  // Same-page anchors (e.g. /operations#iron-ore while on /operations) and first load
  // with a hash: the page does not re-mount, so scroll here.
  useEffect(() => {
    if (location.hash) scrollToTarget(false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash]);

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={() => requestAnimationFrame(() => scrollToTarget(true, true))}
    >
      {/* Outer wrapper carries no transform, so fixed panels and GSAP pins inside work. */}
      <motion.div key={location.pathname} initial="initial" animate="enter" exit="exit">
        {!reduce && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[90] origin-right bg-copper-gradient"
            variants={{
              initial: { scaleX: 1 },
              enter: { scaleX: 0, transition: { duration: 0.5, ease } },
              exit: { scaleX: 0 },
            }}
          />
        )}
        <motion.div
          variants={reduce ? { initial: {}, enter: {}, exit: { opacity: 0 } } : pageTransition}
          // Drop the transform once settled so descendants are not in a containing block.
          onAnimationComplete={(def) => {
            if (def === 'enter') document.getElementById('page')?.style.removeProperty('transform');
          }}
          id="page"
        >
          {outlet}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
