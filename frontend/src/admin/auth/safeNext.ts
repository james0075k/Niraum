/**
 * The post-login destination from `?next=`: only same-app admin paths (`/admin`, `/admin/…`,
 * `/admin?…`). Anything else — `//host`, absolute URLs, backslashes, `..` segments, public
 * pages — falls back to the dashboard, so the parameter can't be used as an open redirect.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || /[\\\s]/.test(next)) return '/admin';
  // No dot segments (`/admin/../en`), raw or percent-encoded.
  if (/(^|\/)(\.|%2e){1,2}(\/|[?#]|$)/i.test(next)) return '/admin';
  return /^\/admin(?:[/?#]|$)/.test(next) ? next : '/admin';
}
