/** Cookie consent (essential vs analytics). Analytics must check readConsent()?.analytics. */
export const CONSENT_KEY = 'niraum-consent';
export type Consent = { essential: true; analytics: boolean; at: string };

export function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

export function saveConsent(analytics: boolean): Consent {
  const value: Consent = { essential: true, analytics, at: new Date().toISOString() };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable — the banner simply returns next visit */
  }
  window.dispatchEvent(new CustomEvent('niraum:consent', { detail: value }));
  return value;
}
