# 0003 — Auth: JWT in httpOnly SameSite=Strict cookies

- Status: Accepted · 2026-10-08

## Decision

- Access JWT (15 min, `HS256`, `JWT_ACCESS_SECRET`) in cookie `na_at`, `Path=/api`.
- Refresh JWT (7 days, `JWT_REFRESH_SECRET`, carries `ver = refreshTokenVersion`) in cookie
  `na_rt`, `Path=/api/v1/auth`. Rotated on every refresh.
- Both `httpOnly; Secure; SameSite=Strict`. No tokens in `localStorage` or response bodies.
- Revocation: bump `User.refreshTokenVersion` (logout, password change, deactivation).

## Consequences

- XSS cannot read tokens; CSRF is blocked by `SameSite=Strict` plus an `Origin` allow-list check
  on state-changing requests.
- The API must be **same-site** with the website (same origin behind `/api`, or `api.` subdomain
  of the same registrable domain). Cross-site hosting (e.g. `*.onrender.com` API with a custom
  domain site) is not supported.
- In local dev, Vite proxies `/api` so cookies are first-party; `Secure` cookies are accepted on
  `http://localhost` by modern browsers.
