# Changelog

All notable changes to this project are documented here. Format:
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added — Phase 4 completion (2026-10-10)

- `pnpm seed` also loads SAMPLE services, projects and posts into empty collections (never
  re-seeds deleted samples). Seeded images use `/images/<file>.jpg`; the frontend maps them to
  its optimised local AVIF/WebP pictures (`withLocalImages`).
- Cloudflare Turnstile widget on the contact and job-application forms
  (`VITE_TURNSTILE_SITE_KEY`); submit waits for a token, which is reset after every attempt.
- Prerender fetches published slugs from `GET /seo/sitemap-data`, so admin-created projects,
  articles and jobs get static HTML. Each such page embeds its API item as a JSON snapshot for
  hydration; `sitemap.xml` uses each item's `updatedAt`. An unreachable API falls back to local
  content.

### Added — Phase 4: backend API (2026-10-09)

- Zod-validated environment (`CLIENT_URL`, `ADMIN_URL`, `CONTACT_INBOX`, `NOMINATIM_USER_AGENT`,
  `TURNSTILE_SECRET`/`RECAPTCHA_SECRET`, `RESEND_API_KEY`…); production refuses to boot without
  real secrets and service credentials.
- MongoDB connection retry with backoff; graceful shutdown on SIGTERM/SIGINT.
- Middleware chain: request id → pino-http → helmet (strict API CSP) → CORS allow-list + Origin
  check → compression → JSON (1 MB) → cookies → mongo-sanitize → hpp → rate limits.
- Models: User, SiteSettings, Project, Post, Job, Application, TeamMember, Service, Message,
  Subscriber, Media, AuditLog (append-only), GeocodeCache (30-day TTL).
- Cookie-based auth with lockout, refresh rotation, version-based revocation, forgot/reset,
  change-password and forced first-login password change; editor/admin/superadmin roles.
- Site settings with Nominatim geocoding, manual pin override, ETag + in-memory cache.
- Generic content CRUD for projects, posts, jobs, team and services: slugs, filters, full-text
  search, pagination, sanitised HTML, soft delete/restore, audit trail, debounced rebuild hook.
- Cloudinary media library with magic-byte validation; contact form, job applications with
  private CV storage, double opt-in newsletter; Turnstile/reCAPTCHA verification.
- `GET /seo/sitemap-data`; OpenAPI 3 spec + Swagger UI at `/api/docs` outside production.
- Seed script: first superadmin + geocoded Lalitpur-13 settings.
- 107 Vitest + Supertest tests on an in-memory MongoDB.

### Changed — Phase 4

- Backend env names: `CORS_ORIGINS`/`PUBLIC_SITE_URL` → `CLIENT_URL` + `ADMIN_URL` (+ optional
  `CORS_ORIGINS`), `MAIL_TO_CONTACT` → `CONTACT_INBOX`, `GEOCODER_*` → `NOMINATIM_*`;
  `UPLOAD_MAX_MB` replaced by per-type limits. `node-geocoder` removed.
- Mongoose `sanitizeFilter` disabled (it broke the API's own query operators); input is
  coerced by Zod and stripped by express-mongo-sanitize instead.

### Added — Phase 3: public website (2026-10-09)

- Brand design tokens (light/dark), Manrope, glass/grain/metal-sheen utilities.
- 28 shadcn/ui components restyled to the brand; theme toggle with admin default.
- Motion system: preloader, page transitions, Lenis + GSAP smooth scroll, scroll reveal,
  split-text, parallax, pinned project gallery, count-up, tilt, magnetic buttons, marquee;
  reduced-motion support throughout.
- 13 public pages (Home, About, Operations, Projects, Project detail, Sustainability, News,
  Article, Careers, Job, Contact, Legal, 404), navbar, footer, cookie notice, mobile action bar.
- API-first data hooks with local fallback content; contact, job application (PDF CV) and
  newsletter forms (endpoints arrive in Phase 4).
- SEO: per-page meta, Open Graph, JSON-LD, 19 prerendered pages, generated sitemap.xml and
  robots.txt. Field photos optimised to AVIF/WebP/JPEG.
- Vitest component tests and Playwright e2e specs.

### Fixed — Phase 3

- nginx returns a real 404 page for unknown URLs instead of the Home page.
- Hydration mismatches from reduced-motion detection and invalid `<div>`-in-`<p>` markup.
- Blank dev page when an ad blocker blocked files named `CookieBanner`, `consent`,
  `SocialIcons` (renamed).
- Unresolved merge-conflict markers in SKILLS.md.

### Added — Phase 2: architecture (2026-10-08)

- pnpm workspace skeleton (`frontend`, `backend`) with shared TypeScript, ESLint, Prettier,
  Husky, lint-staged and Commitlint configuration.
- Frontend: Vite + React 18 + vite-react-ssg prerendering, Tailwind brand tokens (light/dark),
  glass and texture utilities, theme provider, axios client with refresh handling, motion and
  SEO presets, Vitest and Playwright setup.
- Backend: Express app factory with security middleware, Zod-validated env, pino logging,
  MongoDB connection, error envelope, health endpoint and Supertest test.
- docker-compose (MongoDB 7, Mailpit; optional app profile), Dockerfiles, CI workflow.
- Docs: ARCHITECTURE, API, SECURITY, DEPLOYMENT, ADRs 0001–0004, SKILLS.md.
