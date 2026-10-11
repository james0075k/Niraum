import emblem from '@/assets/site/brand/Brand_Logo_Emblem_Transparent.png?w=96&format=webp';
import { useSettings } from '@/features/settings/useSettings';
import { cn } from '@/lib/utils';

/**
 * Brand lockup. Uses the supplied logo files from SiteSettings (light/dark) when the
 * admin has uploaded them; otherwise the supplied emblem (assets/site/brand) beside the
 * wordmark in type. The emblem is the supplied transparent file in its own colours on every
 * background (no tile, never recoloured — owner's choice, 11 Oct 2026).
 */
export function Logo({ className, onDark }: { className?: string; onDark?: boolean }) {
  const { logo, companyName } = useSettings();

  if (logo.light && logo.dark) {
    return (
      <span className={cn('inline-flex items-center', className)}>
        <img
          src={onDark ? logo.dark : logo.light}
          alt={companyName}
          className={cn('h-10 w-auto', !onDark && 'dark:hidden')}
          width={160}
          height={40}
        />
        {!onDark && (
          <img
            src={logo.dark}
            alt=""
            aria-hidden="true"
            className="hidden h-10 w-auto dark:block"
            width={160}
            height={40}
          />
        )}
      </span>
    );
  }

  return (
    <span
      className={cn('inline-flex items-center gap-2.5 leading-none', className)}
      aria-label={companyName}
      role="img"
    >
      <span className="inline-flex h-11 w-[29px] shrink-0 items-center justify-center">
        <img
          src={emblem}
          alt=""
          aria-hidden="true"
          width={29}
          height={44}
          className="h-full w-auto"
        />
      </span>
      <Wordmark onDark={onDark} />
    </span>
  );
}

function Wordmark({ onDark }: { onDark?: boolean | undefined }) {
  return (
    <span className="inline-flex flex-col items-start leading-none">
      <span
        className={cn(
          'text-[1.35rem] font-extrabold tracking-[0.08em]',
          onDark ? 'text-offwhite' : 'text-charcoal dark:text-offwhite',
        )}
      >
        <span className="text-copper">N</span>IRAUM
      </span>
      <span
        className={cn(
          'mt-1 text-[0.58rem] font-semibold tracking-[0.62em]',
          onDark ? 'text-copper-light' : 'text-copper-deep dark:text-copper-light',
        )}
      >
        METALS
      </span>
    </span>
  );
}
