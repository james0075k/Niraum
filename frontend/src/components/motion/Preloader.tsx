import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { ease } from '@/lib/motion';

const SEEN_KEY = 'niraum-preloaded';
const DURATION_MS = 1600; // spec: max 1.8 s

/**
 * Branded preloader: hexagon stroke draws in, wordmark fades up, copper line fills.
 * Rendered in the prerendered HTML so it covers the first paint; shown once per
 * session. index.html adds `html.preloaded` before paint when it was already seen
 * (or reduced motion is on), and a CSS failsafe hides it if JS never runs.
 */
export function Preloader() {
  const [visible, setVisible] = useState(true);

  const finish = useCallback(() => {
    setVisible(false);
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    // Already seen / reduced motion: CSS (html.preloaded) keeps it hidden — nothing to run.
    if (document.documentElement.classList.contains('preloaded')) return;
    const t = window.setTimeout(finish, DURATION_MS);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [finish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          className="preloader fixed inset-0 z-[100] flex flex-col items-center justify-center bg-graphite text-offwhite"
          exit={{ opacity: 0, transition: { duration: 0.45, ease } }}
          role="status"
          aria-label="Loading Niraum Metals"
        >
          <svg viewBox="0 0 100 100" className="h-24 w-24" aria-hidden="true">
            <defs>
              <linearGradient id="pl-copper" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8A5236" />
                <stop offset="50%" stopColor="#DDA27C" />
                <stop offset="100%" stopColor="#A9663F" />
              </linearGradient>
            </defs>
            <motion.path
              d="M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z"
              fill="none"
              stroke="url(#pl-copper)"
              strokeWidth="3"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease }}
            />
            <motion.text
              x="50"
              y="62"
              textAnchor="middle"
              fontSize="38"
              fontWeight="800"
              fill="url(#pl-copper)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              N
            </motion.text>
          </svg>
          <motion.p
            className="mt-6 text-2xl font-extrabold tracking-[0.18em]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, ease }}
          >
            <span className="text-copper">N</span>IRAUM
            <span className="mt-1 block text-center text-[0.55rem] font-medium tracking-[0.6em] text-copper-light">
              METALS
            </span>
          </motion.p>
          <div className="mt-8 h-px w-48 overflow-hidden bg-white/10">
            <motion.div
              className="h-full origin-left bg-copper-gradient"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: DURATION_MS / 1000, ease: 'easeInOut' }}
            />
          </div>
          <button
            type="button"
            onClick={finish}
            className="label mt-10 min-h-11 rounded-full px-4 text-silver/80 transition-colors hover:text-offwhite"
          >
            Skip intro
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
