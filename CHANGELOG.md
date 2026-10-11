# Changelog

All notable changes to this project are documented here. Format:
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added — Phase 5: admin panel (2026-10-11)

- `/admin`: lazy, client-only, `noindex`; public code can't import it (`check:admin-boundary`).
- Sign-in with captcha after 3 failed logins, forced password change, forgot/reset; drafts survive
  an expired session; role-aware shell with Cmd+K palette, breadcrumbs and unsaved-changes guard.
- Dashboard; settings (address + map pin with geocode fallback, social links, assay visibility).
- Generic resource manager with English | नेपाली tabs (saving English keeps Nepali): products,
  deposit (WGS-84 pin), team, services, projects, posts, jobs; TipTap rich text; media library
  and picker; scheduled publishing for projects and posts.
- Inquiries pipeline (status counts, search, CSV export), messages, applications (signed CV link).
- Assay data manager: inline edits, all-or-nothing CSV import with per-line errors, public
  sample-detail switch; backend admin write endpoints + `POST /admin/assay/import`.
- Users (superadmin) and audit log with field diffs and links to each record's screen.
- Tests: 176 backend + 229 frontend unit tests; 10 admin e2e flows against an in-memory API.

### Added — site updates (2026-10-11)

- New banner photos (Home hero, page heroes), founder portrait, company phone/WhatsApp.
- Deposit composition donut (Table 14) on Home, Products and Technical Data.
- Sustainability section on Home rebuilt around the CH-B-1 field photo.
- Drilling preloader (CSS-only, plays before JS).

### Fixed (2026-10-11)

- Glass and texture styles never loaded (late `@import` below `@font-face`): the scrolled header
  was see-through and glass cards had no background.
- Nepali headings clipped vowel signs and chandrabindu.
- `sonner` was imported by the admin but missing from `package.json`.

### Added — Phase 4.5: real content, bilingual site, bulk inquiries (2026-10-10)

- Content source of truth in `docs/content/` (master blueprint, Phase 4.5 prompt, image
  manifest, assay data JSON + CSV); report imagery and logos in `frontend/src/assets/site/`,
  originals in `design-assets/`.
- Real Katujpani imagery and brand emblem on the site; favicons, app icons and og-image
  regenerated from the supplied logo.
- English / नेपाली: every public page under `/en` and `/ne` (react-i18next, URL-driven), language
  toggle that remembers the choice, `/` and old URLs redirect, hreflang + og:locale + sitemap
  alternates, Mukta for Devanagari.
- Backend LocalizedString `{ en, ne? }` with `?lang=` on public reads, `translations` on admin
  reads, and an idempotent migration (`pnpm --filter backend migrate`).
- Models + API: Product, Deposit, AssaySample, AssaySummary, Inquiry; settings
  `publicAssayDetail` + `defaultLanguage`; founder fields on TeamMember; seeds from
  `assay_data.json` and the blueprint.
- Pages: Our Project, Products, Technical Data, Investors; Home, About and Contact rebuilt to the
  blueprint (stats from the API, Bulk Supply Inquiry tab, founder card, consultant credit).
- Tests: Table 14 averages (±0.02), migration idempotency, language resolution, assay gate,
  inquiries (EN/NE, spam, rate limit, CSV), page and e2e journeys.

### Changed

- Navigation follows the blueprint (Home, About, Our Project, Products, Technical Data,
  Sustainability, Investors, Contact); "Get a Quote" is now "Request a Quote".
- Preloader shows on desktop only and dismisses itself by CSS at 1.6 s.

### Fixed

- Every prerendered page preloaded all images and fonts in the bundle (~28 MB); only the needed
  fonts are preloaded now.
- Pre-commit hook hung on Windows when lint-staged passed many files through `.cmd` shims; tools
  now run via `node` directly.

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
