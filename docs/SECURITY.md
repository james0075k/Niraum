# Security

> Skeleton — expanded with the threat model during the feature phase.

## Reporting

Report vulnerabilities privately to `[PLACEHOLDER: security contact email]`. Do not open public
issues for security problems.

## Controls (baseline)

| Area          | Control                                                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Passwords     | argon2id (`argon2` defaults: m=64 MiB, t=3, p=4), min length 12, lockout after `LOGIN_MAX_ATTEMPTS` for `LOGIN_LOCK_MINUTES`                                                                                       |
| Sessions      | ADR-0003: 15 min access / 7 d rotating refresh JWT, httpOnly Secure SameSite=Strict cookies, version-based revocation                                                                                              |
| CSRF          | SameSite=Strict + `Origin` allow-list on non-GET requests + JSON-only bodies                                                                                                                                       |
| Input         | Zod on body/query/params (controllers parse; unknown update fields rejected); `express-mongo-sanitize`; Mongoose `strictQuery`; `hpp`; 1 MB JSON limit                                                             |
| Rich text     | Server-side allow-list HTML sanitising before save; rendered without `dangerouslySetInnerHTML` of unsanitised data                                                                                                 |
| Uploads       | multer memory storage; declared MIME must match magic bytes (jpg/png/webp/avif/pdf/mp4); images 8 MB, PDF 5 MB, video 50 MB; Cloudinary only (never API disk); CVs stored as private files, served via signed URLs |
| Rate limiting | global + per-route (login, forgot, contact, applications, newsletter)                                                                                                                                              |
| Spam          | Honeypot field (`website`) on public forms; Cloudflare Turnstile or reCAPTCHA verified server-side (required in production); contact 5 / hour / IP                                                                 |
| Headers       | helmet on the API; CSP, HSTS, Referrer-Policy, Permissions-Policy at the static host                                                                                                                               |
| Secrets       | env only, validated at boot; production refuses placeholder JWT secrets; pino redacts cookies/authorization/password                                                                                               |
| Authorization | `requireRole` on every admin route; last-superadmin protection                                                                                                                                                     |
| Audit         | append-only AuditLog for every admin write and login                                                                                                                                                               |
| Privacy       | contact `ip`/`userAgent` purged after `[PLACEHOLDER: retention period]`                                                                                                                                            |
| Dependencies  | Dependabot weekly updates (`.github/dependabot.yml`)                                                                                                                                                               |
