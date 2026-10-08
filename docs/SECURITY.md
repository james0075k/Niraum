# Security

> Skeleton — expanded with the threat model during the feature phase.

## Reporting

Report vulnerabilities privately to `[PLACEHOLDER: security contact email]`. Do not open public
issues for security problems.

## Controls (baseline)

| Area          | Control                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Passwords     | argon2id (`argon2` defaults: m=64 MiB, t=3, p=4), min length 12, lockout after `LOGIN_MAX_ATTEMPTS` for `LOGIN_LOCK_MINUTES` |
| Sessions      | ADR-0003: 15 min access / 7 d rotating refresh JWT, httpOnly Secure SameSite=Strict cookies, version-based revocation        |
| CSRF          | SameSite=Strict + `Origin` allow-list on non-GET requests + JSON-only bodies                                                 |
| Input         | Zod on body/query/params; `express-mongo-sanitize`; Mongoose `sanitizeFilter` + `strictQuery`; `hpp`; 100 kb body limit      |
| Rich text     | Server-side allow-list HTML sanitising before save; rendered without `dangerouslySetInnerHTML` of unsanitised data           |
| Uploads       | multer memory storage, MIME sniffing + extension allow-list, `UPLOAD_MAX_MB`, stored on Cloudinary (never on API disk)       |
| Rate limiting | global + per-route (login, forgot, contact, applications, newsletter)                                                        |
| Headers       | helmet on the API; CSP, HSTS, Referrer-Policy, Permissions-Policy at the static host                                         |
| Secrets       | env only, validated at boot; production refuses placeholder JWT secrets; pino redacts cookies/authorization/password         |
| Authorization | `requireRole` on every admin route; last-superadmin protection                                                               |
| Audit         | append-only AuditLog for every admin write and login                                                                         |
| Privacy       | contact `ip`/`userAgent` purged after `[PLACEHOLDER: retention period]`                                                      |
| Dependencies  | Dependabot weekly updates (`.github/dependabot.yml`)                                                                         |
