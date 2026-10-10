import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from '@/components/common/LangLink';
import { Button } from '@/components/ui/button';
import { readConsent, saveConsent } from '@/lib/visitorPrefs';
import { ease } from '@/lib/motion';

/**
 * Essential vs analytics consent banner (see lib/visitorPrefs.ts).
 * File names here avoid "cookie", "consent", "banner" and "social": ad-blocker lists block
 * URLs containing them, and one blocked module stops the whole app from loading in dev.
 */
export function DataNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Wait a beat so the banner never competes with the preloader / LCP.
    const t = window.setTimeout(() => setOpen(readConsent() === null), 2200);
    return () => window.clearTimeout(t);
  }, []);

  function choose(analytics: boolean) {
    saveConsent(analytics);
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="region"
          aria-label="Cookie consent"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease } }}
          exit={{ opacity: 0, y: 24, transition: { duration: 0.3 } }}
          className="glass-strong fixed inset-x-3 bottom-[5.5rem] z-[45] mx-auto max-w-xl p-5 sm:inset-x-4 md:bottom-4 md:left-4 md:right-auto"
        >
          <p className="text-sm font-semibold text-foreground">Cookies on this site</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We use essential cookies to run the site. With your permission we also use analytics
            cookies to see which pages help visitors.{' '}
            <Link to="/legal/cookies" className="font-medium underline underline-offset-2">
              Cookie Policy
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => choose(true)}>
              Accept all
            </Button>
            <Button size="sm" variant="outline" onClick={() => choose(false)}>
              Essential only
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
