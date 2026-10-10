import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * True when the build has a Turnstile site key. Forms then need a token before they submit;
 * without one (development) the widget is hidden and the API skips verification.
 */
// eslint-disable-next-line react-refresh/only-export-components -- a build-time constant
export const captchaEnabled = Boolean(SITE_KEY);

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loader: Promise<TurnstileApi> | null = null;

/** Loads Cloudflare's script once, on the first form that needs it. */
function loadTurnstile(): Promise<TurnstileApi> {
  loader ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile missing'));
    script.onerror = () => {
      loader = null; // allow a retry on the next mount
      reject(new Error('Turnstile failed to load'));
    };
    document.head.appendChild(script);
  });
  return loader;
}

export interface CaptchaHandle {
  /** Tokens are single-use: reset after every submission, successful or not. */
  reset(): void;
}

interface CaptchaProps {
  onToken: (token: string | null) => void;
  className?: string;
}

/** Cloudflare Turnstile widget, themed to match the site. Renders nothing without a site key. */
export const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(function Captcha(
  { onToken, className },
  ref,
) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const { resolvedTheme } = useTheme();
  const [failed, setFailed] = useState(false);

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
      onTokenRef.current(null);
    },
  }));

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadTurnstile().then(
      (turnstile) => {
        if (cancelled || !container.current) return;
        widgetId.current = turnstile.render(container.current, {
          sitekey: SITE_KEY,
          theme: resolvedTheme,
          size: 'flexible',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      },
      () => !cancelled && setFailed(true),
    );
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
      onTokenRef.current(null);
    };
  }, [resolvedTheme]);

  if (!SITE_KEY) return null;
  return (
    <div className={className}>
      <div ref={container} className={cn('min-h-[65px]', failed && 'hidden')} />
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          The spam check could not load. Check your connection or content blocker, then reload the
          page.
        </p>
      )}
    </div>
  );
});
