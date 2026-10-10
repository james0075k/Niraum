import { motion } from 'framer-motion';
import { useT } from '@/hooks/useLang';
import { useMounted } from '@/hooks/useMounted';
import { ease } from '@/lib/motion';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

/** Sun ⇄ moon morph: the disc grows, a mask bites the crescent, rays rotate away. */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useT();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const dark = mounted && resolvedTheme === 'dark';
  const spring = { duration: 0.5, ease };

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={mounted ? t(dark ? 'theme.toLight' : 'theme.toDark') : t('theme.toggle')}
      aria-pressed={mounted ? dark : undefined}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/10',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <mask id="theme-moon-mask">
          <rect width="24" height="24" fill="white" />
          <motion.circle
            r="9"
            fill="black"
            initial={false}
            animate={{ cx: dark ? 17 : 32, cy: dark ? 6 : -4 }}
            transition={spring}
          />
        </mask>
        <motion.circle
          cx="12"
          cy="12"
          fill="currentColor"
          mask="url(#theme-moon-mask)"
          initial={false}
          animate={{ r: dark ? 9 : 5 }}
          transition={spring}
        />
        <motion.g
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={false}
          animate={{ opacity: dark ? 0 : 1, rotate: dark ? -45 : 0, scale: dark ? 0.6 : 1 }}
          style={{ originX: '12px', originY: '12px' }}
          transition={spring}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="12" y1="1.5" x2="12" y2="3.5" transform={`rotate(${a} 12 12)`} />
          ))}
        </motion.g>
      </svg>
    </button>
  );
}
