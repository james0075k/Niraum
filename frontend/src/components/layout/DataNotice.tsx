import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from '@/components/common/LangLink';
import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/useLang';
import { readConsent, saveConsent } from '@/lib/visitorPrefs';
import { ease } from '@/lib/motion';

/** Analytics is optional (VITE_ANALYTICS_ID); without it the site sets essential cookies only. */
const ANALYTICS_ENABLED = !!import.meta.env.VITE_ANALYTICS_ID;

/**
 * Essential vs analytics consent banner (see lib/visitorPrefs.ts). Shown only when analytics is
 * configured — essential cookies need no consent, and a banner about analytics that doesn't
 * exist would only get in the way (it also became the late LCP element on /ne pages).
 * File names here avoid "cookie", "consent", "banner" and "social": ad-blocker lists block
 * URLs containing them, and one blocked module stops the whole app from loading in dev.
 */
export function DataNotice() {
  const [open, setOpen] = useState(false);
  const { t } = useT();

  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    // Wait a beat so the banner never competes with the preloader / LCP.
    const timer = window.setTimeout(() => setOpen(readConsent() === null), 2200);
    return () => window.clearTimeout(timer);
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
          aria-label={t('notice.aria')}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease } }}
          exit={{ opacity: 0, y: 24, transition: { duration: 0.3 } }}
          className="glass-strong fixed inset-x-3 bottom-[5.5rem] z-[45] mx-auto max-w-xl p-5 sm:inset-x-4 md:bottom-4 md:left-4 md:right-auto"
        >
          <p className="text-sm font-semibold text-foreground">{t('notice.title')}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('notice.body')}{' '}
            <Link to="/legal/cookies" className="font-medium underline underline-offset-2">
              {t('notice.policy')}
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => choose(true)}>
              {t('notice.accept')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => choose(false)}>
              {t('notice.essential')}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
