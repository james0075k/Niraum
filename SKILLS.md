# Niraum Metals — SKILLS & Progress Tracker

> **Read this file first in every session.** It is the single source of truth for what exists,
> how things are done and what comes next. Update it at the end of every phase and session.
> Read with [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); if this file conflicts with an ADR, the
> ADR wins.

---

## 1. Project snapshot

| Item             | Value                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Company          | Niraum Metals Pvt. Ltd. _(confirm legal name — letterhead footer says "Limited")_                                                     |
| Motto            | Strength Forged For Generations                                                                                                       |
| Address          | Lalitpur-13, Nepal                                                                                                                    |
| Purpose          | Corporate website for a Nepal mining & metals company (iron ore, metal minerals, stone & aggregates) with an admin panel              |
| Design reference | <https://gmining.com> (feel only) · Stitch export: `code.html`, `screen.png`, `DESIGN.md` (Home, dark, desktop)                       |
| Frontend         | React 18 + Vite 6 + TypeScript, Tailwind 3, shadcn/ui, Framer Motion, GSAP + ScrollTrigger, Lenis, TanStack Query, RHF + Zod, Leaflet |
| Rendering        | Public routes prerendered with `vite-react-ssg` (19 pages); `/admin` client-only                                                      |
| Backend          | Node 20 + Express 4 + TypeScript, Mongoose 8, Zod, argon2, JWT (httpOnly cookies), Cloudinary, Nodemailer, Nominatim                  |
| Tooling          | pnpm workspaces, ESLint + Prettier, Husky, Commitlint, Vitest + RTL, Supertest, Playwright, Docker, GitHub Actions                    |
| Live URLs        | Production: `TBD` · Staging: `TBD` · API: `TBD` · Admin: `TBD/admin`                                                                  |

---

## 2. Ground rules and brand

- **Stack is fixed.** Don't add or swap frameworks without an ADR.
- **Never invent company facts.** Unknowns render as `[PLACEHOLDER: label]` via `tbc()` /
  `<Tbc>` / `<TbcText>` (`src/content/placeholders.ts`). Demo projects/articles carry
  `isSample: true` and show a "Sample" badge. Before go-live, `grep -r PLACEHOLDER dist/` must
  return nothing.
- **Logo:** supplied files only (`frontend/public/logo/`, or SiteSettings.logo). Until they
  arrive the site shows the type-only wordmark (`components/common/Logo.tsx`). Never redraw the
  hexagon mark. `favicon.*` / app icons are **temporary** "N" icons — replace.
- **Copy tone:** solid, trustworthy, engineering-led. Short confident sentences. No hype.
- **Commits:** Conventional Commits (`feat(frontend): …`); hooks enforce lint, format, message.

| Token           | Hex                                                              | Tailwind                             | Use                                   |
| --------------- | ---------------------------------------------------------------- | ------------------------------------ | ------------------------------------- |
| Charcoal        | `#2B2F36`                                                        | `charcoal`                           | text, structure                       |
| Graphite        | `#14171C`                                                        | `graphite`                           | dark background                       |
| Copper          | `#B8754A`                                                        | `copper` / `primary`                 | CTAs, active, links, key numbers only |
| Copper light    | `#DDA27C`                                                        | `copper-light`                       | highlights, dark-mode copper text     |
| Copper deep     | `#8A5236`                                                        | `copper-deep`                        | shadows, light-mode copper text       |
| Silver          | `#C9CDD3`                                                        | `silver`                             | secondary lines, icons                |
| Off-white       | `#F6F4F1`                                                        | `offwhite`                           | light background                      |
| Rule            | `#C27A44`                                                        | `rule`                               | divider line                          |
| Copper gradient | `linear-gradient(135deg, #8A5236 0%, #DDA27C 50%, #A9663F 100%)` | `bg-copper-gradient`, `.text-copper` | CTAs, key numbers, nav underline      |

- Text on copper = graphite (5:1), never white. Copper **text** uses `text-copper-ink`
  (copper-deep in light, copper-light in dark) for AA contrast.
- Use semantic classes (`bg-background`, `text-foreground`, `text-muted-foreground`). Sections
  that always sit on photos/graphite add the `dark` class so tokens stay readable in light mode.
- Type: Manrope Variable only. `h1` 800 `clamp(2.5rem,6vw,5.5rem)`, `h2` 700, `h3` 600, body
  400, `.label` 500 uppercase 0.12em.
- Surfaces: `.glass`, `.glass-strong`, `.glass-copper`, `.metal-sheen`, `.glow-follow`,
  `.grain` (4% noise), `.photo-overlay`, `.copper-haze`, `.tbc`.

---

## 3. Conventions and recipes

### Code

- TypeScript strict, no `any`. One component per file; non-component helpers in their own
  module (fast-refresh lint rule). `PascalCase.tsx` components, `camelCase.ts` utils/hooks.
- No `window`/`document` during render (prerender). Browser-only UI: `useMounted()`; media
  queries: `useMediaQuery()` / `usePrefersReducedMotion()` (both hydration-safe).
- Never nest block elements (`<div>`, `<Badge>`) inside `<p>` — it breaks hydration.
- Don't put `cookie`, `consent`, `banner`, `social`, `ads`, `track` or `analytics` in file
  names: ad blockers block those module URLs and the dev site renders blank.

### Data

- Hooks in `src/features/<feature>/use*.ts` call `useContentList` / `useContentItem`
  (`lib/query.ts`): API first, local fallback from `src/content/*` as `initialData`, so
  prerendered HTML is complete and the site works before Phase 4.
- Form schemas + submitters: `features/contact/schemas.ts` (contact, application, newsletter).

### Add a public page

1. `frontend/src/pages/public/<Name>.tsx`, default export, `<Seo title description crumbs />`
   (title part ≤ 34 chars so "Title | Niraum Metals Nepal" ≤ 60; description ≤ 155).
2. `<PageHero>` gives the single H1 + breadcrumbs; each `<section id aria-labelledby>` has
   one H2 (`<SectionHeading>`) inside `.container-site`.
3. Register a `lazy` route in `src/app/router.tsx`; dynamic routes add `getStaticPaths`.
   Sitemap is generated from prerendered routes automatically.
4. Vitest test in `frontend/tests/`; Playwright spec in `frontend/e2e/` for key journeys.

### Add a shadcn/ui component

The CLI (v2.3.0, Tailwind 3) hangs on its own dependency install here. Fetch the file from
`https://ui.shadcn.com/r/styles/new-york/<name>.json` into `src/components/ui/`, then
`pnpm --filter frontend add` the listed dependencies.

### Add an API resource (Phase 4)

1. Content type: model in `backend/src/models/<Name>.ts` (spread `contentBaseFields`) → Zod
   schemas in `validators/content.ts` → `createContentService({...})` in
   `services/resources.ts` → a row in `contentResources` (`routes/index.ts`). That yields public
   list/detail, admin CRUD + restore, audit, rebuild hook and OpenAPI docs.
2. Anything else: controller parses with Zod (`schema.parse(req.body)`) and calls a service;
   services never see `req`/`res`, take an `Actor` and call `auditService.record` on writes.
3. Return the shapes in `frontend/src/lib/types.ts`; list rich-text fields in `richText`.
4. Supertest in `backend/tests`: happy path, validation error, auth denial. Mock externals with
   `vi.spyOn(storage | mailer, …)` / `vi.spyOn(globalThis, 'fetch')`. Document in `docs/API.md`.

### Motion

- Presets in `lib/motion.ts`; components in `components/motion/` (Reveal, SplitText, CountUp,
  Parallax, TiltCard, MagneticButton, Marquee, Preloader, PageTransition, SmoothScroll).
- GSAP/Lenis load lazily after first paint. Pinned sections use `gsap.matchMedia()` and revert.
- Animate `transform`/`opacity` only; everything honours `prefers-reduced-motion`
  (`MotionConfig reducedMotion="user"` + `usePrefersReducedMotion`).

---

## 4. File map (keep current)

```text
frontend/
├─ index.html                 theme + preloader pre-paint script
├─ nginx.conf                 prerendered pages, real 404, app shell for /admin + new slugs
├─ vite.config.ts             imagetools (?picture), SSG, sitemap.xml + robots.txt, preview fix
├─ public/                    favicon.svg/ico + app icons (TEMPORARY), og-image.jpg, logo/
├─ src/
│  ├─ app/                    App.tsx (layout), providers.tsx, router.tsx (all routes)
│  ├─ assets/images/          9 web-sized field photos (originals in /Assets)
│  ├─ content/                local fallback data: site, services, projects, posts, about,
│  │                          legal, images, placeholders
│  ├─ features/               settings, services, projects, news, jobs, team (hooks),
│  │                          contact/schemas.ts
│  ├─ hooks/                  useMounted, useMediaQuery (+ fine pointer, reduced motion)
│  ├─ lib/                    api, query, seo (JSON-LD), theme, motion, visitorPrefs, format, types
│  ├─ components/
│  │  ├─ ui/                  shadcn/ui (28 primitives; button/input restyled to brand)
│  │  ├─ common/              Logo, Img, Tbc, PageHero, SectionHeading, ProfileLinks
│  │  ├─ layout/              Navbar, Footer, ThemeToggle, DataNotice, MobileCta
│  │  ├─ motion/              Preloader, PageTransition, SmoothScroll, Reveal, SplitText, …
│  │  ├─ sections/            Hero, Stats, Services, ProjectGallery, ProjectCard,
│  │  │                       ProcessTimeline, SustainabilityBand, NewsGrid, LogoMarquee,
│  │  │                       CtaBand, ContactForm, ApplyForm, MapCard, LeafletMap
│  │  └─ seo/                 Seo, JsonLd
│  ├─ pages/public/           Home, About, Operations, Projects, ProjectDetail,
│  │                          Sustainability, News, Article, Careers, Job, Contact,
│  │                          Legal, NotFound
│  └─ styles/                 globals.css (tokens), glass.css, textures.css
├─ tests/                     Vitest: home, navbar, theme-toggle, contact-form, map-card, query
└─ e2e/site.spec.ts           Playwright: home, theme, contact, 404, admin login (fixme)
backend/src/
├─ app.ts                     createApp(): middleware chain, no I/O · server.ts: listen + shutdown
├─ config/                    env (Zod), db (retry), logger (redaction), mailer (SMTP/Resend),
│                             cloudinary (`storage` wrapper)
├─ models/                    13 Mongoose models + shared.ts (image, seo, soft-delete fields)
├─ validators/                Zod: auth, settings, content, public, common
├─ middlewares/               requestId, auth (requireAuth/requireRole), rateLimits,
│                             originCheck, upload (multer + magic bytes), errorHandler
├─ services/                  auth, token, user, settings, geocode, content (generic) +
│                             resources, media, contact, application, newsletter, captcha,
│                             audit, seo
├─ controllers/               auth, settings, content (factory), public, admin, helpers
├─ routes/index.ts            every /api/v1 route + the contentResources table
├─ jobs/rebuild.ts            debounced deploy hook · docs/openapi.ts: spec + Swagger UI
└─ seed/                      index.ts: superadmin + geocoded settings + content.ts samples
backend/tests/                Vitest + Supertest + mongodb-memory-server (8 files, 110 tests)
docs/                         ARCHITECTURE, API, SECURITY, DEPLOYMENT, adr/
```

---

## 5. Phase checklist

- [~] **Phase 1 — Design (Google Stitch):** _partial_ — Home only, dark, desktop. Missing:
  other screens, light theme, tablet/mobile, component sheet. Stitch used Domine + its own
  palette; the build follows the Brand Brief instead (Manrope, exact hex).
- [x] **Phase 2 — Architecture:** monorepo skeleton, configs, docker-compose, ARCHITECTURE.md
- [x] **Phase 3 — Frontend:** tokens, theme, shadcn, motion system, all public pages, SEO,
      responsive, tests
- [x] **Phase 4 — Backend:** env, models, auth, settings + geocoding, CRUD, media, contact, tests, OpenAPI
- [ ] **Phase 5 — Admin panel:** login, shell, dashboard, settings (address/map, social toggles), managers, media, inbox, users, audit
- [ ] **Phase 6 — Security:** OWASP review, headers, rate limits, CSRF, 2FA, SECURITY.md, ZAP scan
- [ ] **Phase 7 — CI/CD + Deploy:** workflows, Docker, staging + production, domain, DEPLOYMENT.md, rollback runbook
- [ ] **Phase 8 — Docs + QA:** README, SKILLS, CREDITS, final QA checklist passed

### Phase 4 tasks

- [ ] `backend/.env` + MongoDB running (`pnpm db:up` or Atlas) — per machine
- [x] Models: SiteSettings, Service, Project, Post, Job, Application, TeamMember, Message, Subscriber, Media, User, AuditLog, GeocodeCache
- [x] Public GET routes: settings/public, services, projects, posts, jobs, team (shapes = `frontend/src/lib/types.ts`)
- [x] POST `/contact`, `/applications` (PDF ≤ 5 MB), `/newsletter` (double opt-in)
- [x] Auth: login (lockout), refresh (rotation), logout, forgot/reset, change-password, me
- [x] Admin CRUD (soft delete + restore) + settings geocode; sanitise rich-text HTML on save
- [x] Media library (Cloudinary, magic-byte checks), inbox, users, audit log, rebuild hook
- [x] Seed: first superadmin (forced password change) + geocoded settings
- [x] Seed SAMPLE services/projects/posts (`backend/src/seed/content.ts`, mirrors `frontend/src/content`) into empty collections only; images are `/images/<file>.jpg`, mapped back to local pictures by `withLocalImages`
- [x] Prerender: build fetches `GET /seo/sitemap-data` + each item (`vite.config.ts` `fetchApiContent`), prerenders admin-created project/news/job pages with an embedded JSON snapshot (`lib/ssgData.ts`), sitemap `lastmod` = `updatedAt`; API down → local content only
- [x] Frontend: Turnstile widget (`components/common/Captcha.tsx`, `VITE_TURNSTILE_SITE_KEY`) sends `captchaToken` from contact + apply forms; hidden when no site key
- [x] Tests: 110 backend (services 99 % / controllers 100 % lines) · `docs/API.md` · OpenAPI at `/api/docs`

---

## 6. Feature status

| Feature                                         | Area     | Status             | Key files                                               | Tests                       |
| ----------------------------------------------- | -------- | ------------------ | ------------------------------------------------------- | --------------------------- |
| Preloader + page transitions                    | Frontend | Done               | `components/motion/Preloader.tsx`, `PageTransition.tsx` | e2e (indirect)              |
| Light/dark theme (+ admin default)              | Frontend | Done               | `lib/theme.tsx`, `layout/ThemeToggle.tsx`, `index.html` | theme-toggle, e2e           |
| Navbar (glass, sticky, dropdown, sheet)         | Frontend | Done               | `components/layout/Navbar.tsx`                          | navbar                      |
| Home sections                                   | Frontend | Done               | `pages/public/Home.tsx`, `components/sections/*`        | home, e2e                   |
| About, Operations, Sustainability               | Frontend | Done               | `pages/public/*`                                        | screenshots                 |
| Projects list (filters) + detail + map          | Frontend | Done               | `Projects.tsx`, `ProjectDetail.tsx`, `MapCard.tsx`      | map-card                    |
| News list + article                             | Frontend | Done               | `News.tsx`, `Article.tsx`                               | screenshots                 |
| Careers + job + apply form (PDF ≤ 5 MB)         | Frontend | Done (no jobs yet) | `Careers.tsx`, `Job.tsx`, `ApplyForm.tsx`               | —                           |
| Contact form + map + socials                    | Frontend | Done (API pending) | `ContactForm.tsx`, `MapCard.tsx`, `Contact.tsx`         | contact-form, map-card, e2e |
| Footer, cookie banner, mobile CTA, 404, legal   | Frontend | Done               | `components/layout/*`, `Legal.tsx`, `NotFound.tsx`      | e2e (404)                   |
| SEO (meta, JSON-LD, sitemap, prerender)         | Frontend | Done               | `components/seo/*`, `lib/seo.ts`, `vite.config.ts`      | e2e (title)                 |
| Auth (login, refresh, lockout, reset)           | Backend  | Done               | `services/auth.service.ts`, `middlewares/auth.ts`       | auth, roles                 |
| Site settings + geocoding                       | Backend  | Done               | `services/settings.service.ts`, `geocode.service.ts`    | settings                    |
| Content CRUD, contact, applications, newsletter | Backend  | Done               | `services/content.service.ts`, `routes/index.ts`        | content, forms              |
| Media library (Cloudinary)                      | Backend  | Done               | `services/media.service.ts`, `middlewares/upload.ts`    | media                       |
| OpenAPI docs                                    | Backend  | Done               | `docs/openapi.ts` → `/api/docs`                         | health                      |
| Admin (all)                                     | Admin    | Not started        | `pages/admin/*`                                         | e2e admin login (fixme)     |
| CI pipeline / deployments                       | DevOps   | Skeleton           | `.github/workflows/*`                                   | —                           |

Status values: Not started · In progress · Review · Done · Blocked

---

## 7. Session log (newest first)

| Date       | What changed                                                                                                                                                                                                                                                  | Files touched                                                                                                                                                                                 | Open issues                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 2026-10-10 | Phase 4 finished: sample content seed, `/images/*` → local picture mapping, Turnstile widget on contact + apply forms, build prerenders API slugs (sitemap-data + per-page JSON snapshot, real `lastmod`). 110 backend + 17 frontend unit tests, e2e passing. | `backend/src/seed/*`, `backend/tests/settings.test.ts`, `frontend/vite.config.ts`, `frontend/src/{lib,content,components,features}/**`, `frontend/tests/*`, env examples, Dockerfile, compose | Phase 1 screens still Home-only                         |
| 2026-10-09 | Phase 4: backend API — env, 13 models, cookie auth (lockout, rotation, reset), roles, settings + Nominatim geocoding, generic content CRUD with soft delete + audit, media, contact/applications/newsletter, captcha, rebuild hook, OpenAPI, 107 tests.       | `backend/**`, `docs/*.md`, `docker-compose.yml`, `SKILLS.md`, `README.md`, `CHANGELOG.md`                                                                                                     | Seed content; frontend captcha + sitemap-data           |
| 2026-10-09 | Fix: blank dev page in Edge — ad blocker blocked `CookieBanner`/`consent`/`SocialIcons` modules; renamed to `DataNotice`/`visitorPrefs`/`ProfileLinks`. README progress + troubleshooting, CHANGELOG.                                                         | `frontend/src/**`, `README.md`, `CHANGELOG.md`, `SKILLS.md`                                                                                                                                   | —                                                       |
| 2026-10-09 | Phase 3: design tokens, glass/texture utilities, 28 shadcn components, motion system, 13 public pages, SEO + sitemap, API-with-fallback data layer, 15 unit + 4 e2e tests. Resolved merge conflict in this file.                                              | `frontend/**`, `SKILLS.md`, `README.md`                                                                                                                                                       | Backend endpoints (Phase 4); real logo, media and facts |
| 2026-10-08 | Phase 2: monorepo skeleton, configs, docker-compose, docs                                                                                                                                                                                                     | repo root, `backend/`, `frontend/`, `docs/`                                                                                                                                                   | Confirm legal name                                      |

---

## 8. Known issues / tech debt

- Legal name inconsistency: "Pvt. Ltd." vs "Limited" — resolve before launch.
- `useContentList` only falls back to local content on errors/404. Once the API answers, an
  **empty** collection renders an empty page — run `pnpm seed` on every fresh database.
- Sample content lives twice: `frontend/src/content` (offline fallback) and
  `backend/src/seed/content.ts` (seed). Change both, or let the admin panel own it.
- Captcha needs **both** keys in production: `TURNSTILE_SECRET` (backend) and
  `VITE_TURNSTILE_SITE_KEY` (frontend build). The widget only supports Turnstile — with
  `RECAPTCHA_SECRET` alone the forms would answer 400.
- Phase 6 CSP must allow `https://challenges.cloudflare.com` in `script-src` and `frame-src`.
- Build-time prerender of admin-created pages needs `SSG_API_URL` reachable **from the build**
  (in docker-compose the `backend` host isn't reachable during `docker build`, so it falls back).
- Rate-limit counters and the settings cache are in-process; add a shared store before running
  more than one API replica.
- The docker-compose `app` profile runs the API with `NODE_ENV=production`, which requires real
  JWT secrets, Cloudinary, SMTP/Resend, captcha and Nominatim values in `backend/.env`.
- Pages published after the last build render client-side (nginx serves the shell) until the
  rebuild hook (`REBUILD_HOOK_URL`) triggers a new build.
- No hero video yet (`HERO_VIDEO_URL`); hero uses the field-geologist photo.
- Office map pin is approximate (central Lalitpur) and labelled as such.
- shadcn CLI hangs during its dependency install on this machine — see §3 for the workaround.
- Render free tier sleeps when idle — use a paid instance for production.

---

## 9. Next steps (top 5, in order)

1. Phase 5 — admin panel on the documented `/admin` endpoints (resolve `/images/*.jpg` refs
   with `withLocalImages` in previews).
2. Collect real facts (founding year, licences, sites, phone, email, socials, office hours,
   leadership) and the official logo files.
3. Hero video + Himalayan/site photography (log sources in `CREDITS.md`).
4. Legal review of the draft Privacy, Terms and Cookie pages.
5. Lighthouse mobile pass (target ≥ 90) once real media is in.

---

## 10. Environment variables (never commit real values)

Source of truth: `backend/.env.example` and `frontend/.env.example`.

| Backend                                                                 | Purpose                                   |
| ----------------------------------------------------------------------- | ----------------------------------------- |
| `NODE_ENV`, `PORT` (4000), `LOG_LEVEL`, `TRUST_PROXY`                   | runtime                                   |
| `CLIENT_URL`, `ADMIN_URL`, `CORS_ORIGINS`, `API_PUBLIC_URL`             | allowed origins, links in emails          |
| `MONGODB_URI`                                                           | database (required)                       |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_*_TTL`, `COOKIE_DOMAIN` | auth                                      |
| `LOGIN_MAX_ATTEMPTS`, `LOGIN_LOCK_MINUTES`                              | login hardening                           |
| `CLOUDINARY_*` (folder `niraum`)                                        | media                                     |
| `SMTP_*` or `RESEND_API_KEY`, `MAIL_FROM`, `CONTACT_INBOX`, `HR_INBOX`  | email (Mailpit in dev)                    |
| `NOMINATIM_USER_AGENT`, `NOMINATIM_URL`                                 | address → coordinates                     |
| `TURNSTILE_SECRET` or `RECAPTCHA_SECRET`                                | form spam protection (required in prod)   |
| `SEED_ADMIN_*`                                                          | first admin                               |
| `REBUILD_HOOK_URL`, `REBUILD_DEBOUNCE_SECONDS`                          | rebuild prerendered site after publishing |

| Frontend (all `VITE_*` are public)          | Purpose                                                             |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `VITE_API_URL`                              | API base (`/api/v1`, proxied in dev)                                |
| `VITE_SITE_URL`                             | canonical URLs, sitemap, robots, Open Graph — **set in production** |
| `SSG_API_URL`                               | API used at build time by the prerender                             |
| `VITE_TURNSTILE_SITE_KEY`                   | Turnstile widget on contact/apply forms (required in production)    |
| `VITE_MAP_TILE_URL`, `VITE_MAP_ATTRIBUTION` | Leaflet tiles                                                       |
| `VITE_ANALYTICS_ID`                         | optional; load only if `readConsent()?.analytics`                   |

---

## 11. Placeholders still to replace

Every item below renders as `[PLACEHOLDER: …]` or a "Sample" badge today.

- [ ] Official logo files (light, dark, mark) → `public/logo/` + regenerate favicons/app icons
- [ ] Founding year, company history, milestones (`content/about.ts`)
- [ ] Licence, company registration, PAN/VAT numbers
- [ ] Real projects: names, districts, coordinates, statuses, facts (`content/projects.ts` is sample)
- [ ] Home and operation figures: tonnage, grades, capacities, fleet, staff count (`content/site.ts`, `services.ts`)
- [ ] Leadership names, roles, bios, photos (`content/about.ts`)
- [ ] Phone, email, WhatsApp, office hours, social URLs (SiteSettings — Admin → Settings)
- [ ] Exact office pin (SiteSettings.location — remove `approximate`)
- [ ] Safety record and community programme details
- [ ] News: replace the three sample explainer articles with real news
- [ ] Legal pages: retention periods, analytics provider, legal review
- [ ] Hero video and more site photography

---

## 12. Commands

| Task               | Command                                                          |
| ------------------ | ---------------------------------------------------------------- |
| Install            | `pnpm install`                                                   |
| DB + mail (Docker) | `pnpm db:up` (Mongo :27017, Mailpit UI :8025)                    |
| Dev (both)         | `pnpm dev` (web :5173, API :4000)                                |
| Lint / format      | `pnpm lint` · `pnpm format`                                      |
| Typecheck          | `pnpm typecheck`                                                 |
| Unit tests         | `pnpm test`                                                      |
| E2E                | `pnpm test:e2e` (set `PW_CHROMIUM_PATH` to use installed Chrome) |
| Build (prerender)  | `pnpm build` → `pnpm --filter frontend preview` (:4173)          |
| Full stack Docker  | `docker compose --profile app up --build` (site :8080)           |

---

## 13. Definition of done (every feature)

- [ ] Lint, typecheck, unit tests and build pass; e2e for key journeys
- [ ] Light and dark checked at 360 / 768 / 1280 px; no horizontal scroll
- [ ] Keyboard accessible, visible copper focus ring, 44 px targets, reduced motion respected
- [ ] No hydration or console errors on the prerendered page
- [ ] No invented facts; new unknowns added to §11
- [ ] SKILLS.md (status, file map, session log) and README updated
