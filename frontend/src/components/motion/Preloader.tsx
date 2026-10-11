import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useT } from '@/hooks/useLang';
import { ease } from '@/lib/motion';

const SEEN_KEY = 'niraum-preloaded';
const DURATION_MS = 1600; // spec: max 1.8 s

/** Ground cross-section, top to bottom (brand tones; no depths — nothing here is a fact). */
const STRATA = [
  { y: 88, h: 22, fill: '#3B3029' }, // topsoil
  { y: 110, h: 26, fill: '#5A3B2B' }, // weathered rock
  { y: 136, h: 30, fill: '#8A5236' }, // hematite band
  { y: 166, h: 34, fill: '#2B2F36' }, // bedrock
];

/**
 * Branded preloader: a drill rig sinks a hole through rock layers — the string extends, the bit
 * spins, chips fly at the collar and a core sample fills on the side as the progress bar.
 * Every animation is CSS (globals.css `.drill-*`), so it plays in the prerendered HTML before
 * JS loads; framer only fades it out. Shown once per session on desktop; index.html adds
 * `html.preloaded` before paint when it was already seen, on phones or under reduced motion,
 * and a CSS failsafe hides it at 1.6 s if JS never runs.
 */
export function Preloader() {
  const [visible, setVisible] = useState(true);
  const { t } = useT();

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
          aria-label={t('preloader.loading')}
        >
          <svg viewBox="0 0 240 200" className="h-48 w-56" aria-hidden="true">
            <defs>
              <linearGradient id="pl-copper" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8A5236" />
                <stop offset="50%" stopColor="#DDA27C" />
                <stop offset="100%" stopColor="#A9663F" />
              </linearGradient>
              <clipPath id="pl-ground">
                <rect x="20" y="88" width="168" height="112" rx="10" />
              </clipPath>
              <clipPath id="pl-bit">
                <path d="M114 0 H126 V8 L120 16 L114 8 Z" />
              </clipPath>
            </defs>

            {/* Ground cross-section + borehole */}
            <g clipPath="url(#pl-ground)">
              {STRATA.map((s) => (
                <rect key={s.y} x="20" y={s.y} width="168" height={s.h} fill={s.fill} />
              ))}
              <rect className="drill-hole" x="115" y="88" width="10" height="100" fill="#0C0E11" />
            </g>
            <line x1="12" y1="88" x2="196" y2="88" stroke="#C9CDD3" strokeOpacity="0.5" />

            {/* Rig: mast, struts, crown block, rotary head */}
            <g stroke="#C9CDD3" strokeWidth="2" strokeLinecap="round" fill="none">
              <line x1="120" y1="10" x2="120" y2="88" strokeOpacity="0.35" />
              <line x1="106" y1="88" x2="120" y2="12" />
              <line x1="134" y1="88" x2="120" y2="12" />
              <line x1="110" y1="64" x2="130" y2="64" strokeOpacity="0.6" />
              <line x1="113" y1="40" x2="127" y2="40" strokeOpacity="0.6" />
            </g>
            <rect x="112" y="6" width="16" height="6" rx="2" fill="#C9CDD3" />
            <rect x="109" y="16" width="22" height="12" rx="3" fill="url(#pl-copper)" />
            <circle
              className="drill-rotor"
              cx="120"
              cy="22"
              r="3.2"
              fill="none"
              stroke="#14171C"
              strokeWidth="1.6"
              strokeDasharray="3 2"
            />

            {/* Drill string extends from the head; the bit rides on its tip */}
            <rect className="drill-rod" x="118" y="28" width="4" height="56" fill="#C9CDD3" />
            <g className="drill-bit">
              <g transform="translate(0 82)">
                <path d="M114 0 H126 V8 L120 16 L114 8 Z" fill="url(#pl-copper)" />
                <g clipPath="url(#pl-bit)" transform="translate(0 0)">
                  <g
                    className="drill-flutes"
                    stroke="#14171C"
                    strokeOpacity="0.55"
                    strokeWidth="1.5"
                  >
                    {[-12, -6, 0, 6, 12, 18].map((x) => (
                      <line key={x} x1={110 + x} y1="16" x2={118 + x} y2="0" />
                    ))}
                  </g>
                </g>
              </g>
            </g>

            {/* Chips thrown up at the collar */}
            {[
              ['-10px', '-14px', '0s'],
              ['12px', '-18px', '0.15s'],
              ['-16px', '-8px', '0.3s'],
              ['16px', '-10px', '0.45s'],
            ].map(([dx, dy, delay]) => (
              <circle
                key={delay}
                className="drill-chip"
                cx="120"
                cy="86"
                r="1.6"
                fill="#DDA27C"
                style={{ '--dx': dx, '--dy': dy, animationDelay: delay } as React.CSSProperties}
              />
            ))}

            {/* Core sample = progress */}
            <rect
              x="204"
              y="88"
              width="14"
              height="100"
              rx="4"
              fill="none"
              stroke="#C9CDD3"
              strokeOpacity="0.4"
            />
            <g className="drill-core">
              {STRATA.map((s) => (
                <rect
                  key={s.y}
                  x="206"
                  y={s.y}
                  width="10"
                  height={Math.min(s.h, 188 - s.y)}
                  fill={s.fill}
                />
              ))}
            </g>
          </svg>

          <p className="mt-6 text-2xl font-extrabold tracking-[0.18em] duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both [animation-delay:300ms]">
            <span className="text-copper">N</span>IRAUM
            <span className="mt-1 block text-center text-[0.55rem] font-medium tracking-[0.6em] text-copper-light">
              METALS
            </span>
          </p>
          <button
            type="button"
            onClick={finish}
            className="label mt-8 min-h-11 rounded-full px-4 text-silver/80 transition-colors hover:text-offwhite"
          >
            {t('preloader.skip')}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
