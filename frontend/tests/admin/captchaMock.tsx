import { forwardRef } from 'react';

/**
 * Stand-in for `@/components/common/Captcha` in admin tests: a site key is "configured" and the
 * widget is a button that hands back a token. Use with
 *   vi.mock('@/components/common/Captcha', () => import('./captchaMock'));
 */
export const captchaEnabled = true;

export const Captcha = forwardRef<unknown, { onToken: (token: string | null) => void }>(
  function Captcha({ onToken }, _ref) {
    return (
      <button type="button" data-testid="captcha" onClick={() => onToken('captcha-token')}>
        Verify
      </button>
    );
  },
);
