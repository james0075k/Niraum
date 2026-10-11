# Niraum Metals — SKILLS & Progress Tracker

> **Read this file first in every session.** It is the single source of truth for what exists,
> how things are done and what comes next. Update it at the end of every phase and session.
> Read with [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); if this file conflicts with an ADR, the
> ADR wins.
>
> **Current phase: 7 — deploy (config done; accounts, domain and first deploy pending), then 6 —
> security.** Phase 7 was started before Phase 6 at the owner's request (2026-10-11). Phases 2–5
> are complete (4.5 has open items: mobile Lighthouse, Nepali review, confirm list). All 4.5 work is additive: extend finished code, don't rewrite it. Content facts come
> only from `docs/content/NIRAUM_MASTER_BLUEPRINT.md` and `docs/content/data/assay_data.json`.

---

## 1. Project snapshot

| Item             | Value                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Company          | Niraum Metals Pvt. Ltd. (NIRAUM METALS PVT. LTD. — confirmed legal name)                                                                    |
| Motto            | Strength Forged For Generations                                                                                                             |
| Address          | Lalitpur-13, Nepal                                                                                                                          |
| Purpose          | Corporate website for a Nepal mining & metals company (iron ore, metal minerals, stone & aggregates) with an admin panel                    |
| Design reference | <https://gmining.com> (feel only) · Stitch export: `code.html`, `screen.png`, `DESIGN.md` (Home, dark, desktop)                             |
| Frontend         | React 18 + Vite 6 + TypeScript, Tailwind 3, shadcn/ui, Framer Motion, GSAP + ScrollTrigger, Lenis, TanStack Query, RHF + Zod, Leaflet       |
| Rendering        | Public routes prerendered with `vite-react-ssg` (19 pages); `/admin` client-only                                                            |
| Backend          | Node 20 + Express 4 + TypeScript, Mongoose 8, Zod, argon2, JWT (httpOnly cookies), Cloudinary, Nodemailer, Nominatim                        |
| Tooling          | pnpm workspaces, ESLint + Prettier, Husky, Commitlint, Vitest + RTL, Supertest, Playwright, Docker, GitHub Actions                          |
| Live URLs        | Production: `https://<domain>` (Vercel) · Staging: Vercel PR previews · API: `https://api.<domain>` (Render) · Admin: `/admin` — domain TBD |

Phase 4.5 facts (from the blueprint; the code still shows the older generic copy until 4.5 lands):

| Item                    | Value                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Established             | 2026                                                                                                                                                 |
| Founder                 | Shivahari Pudasaini                                                                                                                                  |
| Mine / project          | Katujpani Iron Deposit, Bakaiya Gaupalika-09, Makawanpur, Bagmati Province (topo 2785 10A, E 627755.00 / N 3033300.00 local grid, spot height 914 m) |
| Product                 | Industrial hematite iron ore (Fe₂O₃) — cement iron corrective; foundry/metallurgical evaluation lots                                                 |
| Key data                | Deposit weighted average 23.48 % Fe · 33.59 % Fe₂O₃ · 53.05 % SiO₂ · 3.22 % Al₂O₃ over 62.55 m (Table 14)                                            |
| Data source             | Mine scheme by Shubharambha Mining and Engineering Services Pvt. Ltd., under DMG guidelines                                                          |
| Primary goal            | Bulk supply inquiries (cement, steel/foundry, traders) + investor credibility                                                                        |
| Languages (planned)     | English (`/en`) and नेपाली (`/ne`)                                                                                                                   |
| Content source of truth | `docs/content/NIRAUM_MASTER_BLUEPRINT.md` + `docs/content/data/assay_data.json` (+ CSVs); image placement in `docs/content/manifest.json`            |
| Planned additions       | react-i18next, i18next-browser-languagedetector, Recharts, Mukta (Devanagari)                                                                        |
| Hosting (decided)       | Vercel (site) · Render Singapore (API) · Atlas AWS Singapore · Cloudinary · Resend · Cloudflare DNS — ADR-0005, `docs/DEPLOYMENT.md`                 |

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

**Phase 4.5 additions (blueprint v2.0 — never change without approval):**

- **Copy rules:** never call the ore "high-grade" (deposit average is 23.48 % Fe with high
  silica); always show the data-origin note under technical tables; never show government seals
  or signatures from the report. Application wording comes from blueprint §4 verbatim.
- **Fonts:** keep Manrope (the brief's Montserrat/Inter suggestion is declined). Add **Mukta** for
  Devanagari when `lang="ne"`. Tabular numerals (`tabular-nums`) in every data table.
- **Texture:** `assets/site/photos/Texture_Weathered_Hematite.webp` at 6–10 % opacity behind
  dark sections (may replace the generic `.grain` there).
- **Logo:** real files are now in `frontend/src/assets/site/brand/`
  (`Brand_Logo_Full_Transparent.png`, `Brand_Logo_Emblem_Transparent.png`, plus opaque and WebP
  versions). Never redraw or recolour. The wordmark in `Logo.tsx` and the temporary "N"
  favicons stay until Phase 4.5 step 1 swaps them.
- **Images:** report imagery is small (≈340–560 px originals upscaled 2×) — fine for cards,
  galleries and a darkened hero, not a sharp full-screen hero.

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

### Change content or data (Phase 4.5)

- Copy and facts: edit `docs/content/NIRAUM_MASTER_BLUEPRINT.md` first, then the seed / local
  fallback content / admin. Unknowns stay `[CONFIRM]` placeholders (admin-editable), never guesses.
- Assay data: edit `docs/content/data/assay_data.json` (CSVs mirror it), re-run `pnpm seed`; the
  weighted-average test (Fe 23.48 / Fe₂O₃ 33.59 / SiO₂ 53.05, ±0.02) must still pass.
- Numbers on the site (stats strip, chemistry) come from the API (`AssaySummary`), with the local
  fallback built from the same JSON — never typed into components.

### i18n (Phase 4.5 — planned, not built yet)

- Every user-visible public string uses `t('ns.key')`; add the key to both
  `src/locales/en/*.json` and `src/locales/ne/*.json` (ne falls back to en until reviewed).
- Public routes live under `/:lang(en|ne)/`; old unprefixed URLs keep working (redirect).
  `/admin` stays English-only for now.
- DB text fields become `LocalizedString { en, ne? }`; public GETs take `?lang=` and return
  resolved strings, admin GETs return both.

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
docs/content/                 NIRAUM_MASTER_BLUEPRINT.md (content source of truth),
                              PHASE_4.5_CONTENT_INTEGRATION_PROMPT.md, manifest.json (image →
                              section), CONTACT_SHEET.png
docs/content/data/            assay_data.json + 6 CSVs (grab A, grab B/C, channel B/C/KXY,
                              weighted by section)
frontend/src/assets/site/     real report imagery, WebP: photos/ (15), maps/ (5), brand/ (logos:
                              full + emblem, opaque + transparent PNG, WebP)
design-assets/                not shipped: images/{photos,maps} high-quality JPG originals,
                              tables/ (report table scans — reference only, rebuild as HTML)
```

Added in Phase 4.5 (built):

```text
frontend/src/app/i18n.ts                 LANGS, localePath/stripLang/switchLangPath, i18next init
frontend/src/hooks/useLang.ts            useLang (URL prefix), useLocalePath, useT (getFixedT)
frontend/src/locales/en|ne/              common, home, about, project, products, technical,
                                         investors, contact .json (ne falls back to en)
frontend/src/pages/public/               OurProject, Products, TechnicalData, Investors,
                                         LangRedirect (`/` + legacy URLs)
frontend/src/components/common/          LangLink (language-aware Link / NavLink)
frontend/src/components/layout/          LanguageToggle
frontend/src/components/sections/        InquiryForm, AssaySummaryTable, AssaySampleTable,
                                         FeBySectionChart, MapGallery, FounderCard, DataOriginNote,
                                         SupplyCards, ProjectTeaser
frontend/src/features/                   assay/useAssay, products/useProducts,
                                         deposits/useDeposit, inquiries/schemas, team/useFounder
frontend/src/content/                    siteImages.ts (report imagery), katujpani.ts (fallback
                                         deposit/product/founder + assay from the JSON)
frontend/src/lib/                        withLang.ts, detectLang.ts
frontend/src/assets/CREDITS.md           media credits
frontend/src/assets/site/photos/         + Niraum field photos (iron-ore-*, bedrock-*; `?photo`)
frontend/src/assets/site/textures/       hematite-tile.webp (8 % texture tile)
frontend/src/app/redirects.ts            retired pages → new pages (prerender stubs, nginx 301s)
frontend/src/pages/public/               Moved.tsx (retired-page redirect)
docs/content/data/site_content.json      deposit / product / founder / settings text as { en, ne }
design-assets/originals/                 untouched field-photo originals (9 MB)
backend/src/models/                      Product, Deposit, AssaySample, AssaySummary, Inquiry,
                                         schemas/LocalizedString.ts
backend/src/services/                    assay.service, inquiry.service (+ product/deposit in
                                         resources.ts)
backend/src/controllers/                 assay.controller, inquiry.controller
backend/src/validators/                  assay.ts (+ product/deposit in content.ts, inquiry in
                                         public.ts)
backend/src/migrations/                  2026-10-localize-fields.ts, run.ts (`migrate` script)
backend/src/seed/                        assay.seed.ts, katujpani.seed.ts (deposit, product,
                                         founder)
```

Added in Phase 7 (deploy config):

```text
frontend/vercel.json                     Vercel build, 301s, /admin shell, headers
render.yaml                              Render Blueprint for niraum-api
.github/workflows/deploy-backend.yml     CI-gated Render deploy + /health commit check
.github/workflows/deploy-frontend.yml    manual Vercel rebuild + smoke check
backend/src/jobs/publishWatch.ts         rebuild when scheduled projects/posts go live
docs/adr/0005-hosting-vercel-render-atlas.md
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
- [ ] **Phase 4.5 — Real content + bilingual + inquiries** (prompt:
      `docs/content/PHASE_4.5_CONTENT_INTEGRATION_PROMPT.md`)
  - [x] Report images cropped, enhanced, labelled (20 photos/maps + logos) — supplied
  - [x] Assay data transcribed and verified (JSON + CSV) — supplied
  - [x] Master blueprint written — supplied
  - [x] Content, data and assets moved into the repo; SKILLS/README/ARCHITECTURE merged
  - [x] Step 1 — Assets imported into frontend, stock media replaced, real logo + favicons
  - [x] Step 2 — i18n (react-i18next, `/en` `/ne`, Mukta, hreflang) + LocalizedString migration
  - [x] Step 3 — Product, Deposit, AssaySample, AssaySummary, Inquiry models + API + seeds
  - [x] Step 4 — Pages: Our Project, Products, Technical Data, Investors; Home/About/Contact updated
  - [~] Step 5 — Tests ✓ (132 backend, 36 frontend, 11 e2e) + Lighthouse ≥ 90 — desktop ✓ (98–100), mobile ✓ 90–99 except /ne Home 82–88 (see §8)
  - [x] Step 6 — Docs (SKILLS, README, ARCHITECTURE, API, CHANGELOG)
- [x] **Phase 5 — Admin panel** (_all 13 tasks done 2026-10-11_; plan `docs/superpowers/plans/2026-10-10-phase-5-admin-panel.md`)**:** login, shell, dashboard, settings (address/map, social toggles), managers, media, inbox, users, audit
      (+ Phase 4.5 adds: Inquiries inbox with status pipeline + CSV, Products editor, Deposit
      editor incl. lat/lng pin, Assay manager with CSV import + `publicAssayDetail` switch, EN/नेपाली
      tabs on every content form)
- [ ] **Phase 6 — Security:** OWASP review, headers, rate limits, CSRF, 2FA, SECURITY.md, ZAP scan
- [~] **Phase 7 — CI/CD + Deploy:** _config done 2026-10-11_ (ADR-0005)
  - [x] Hosting decided: Vercel + Render + Atlas + Cloudflare DNS
  - [x] `frontend/vercel.json`, `render.yaml`, deploy workflows (backend gated on CI + health commit check)
  - [x] Timed rebuild for scheduled projects/posts (`jobs/publishWatch.ts`)
  - [x] DEPLOYMENT.md: setup steps, staging (Vercel previews), rollback runbook, go-live checklist
  - [ ] Domain registered; accounts created (Atlas, Render, Vercel, Cloudinary, Resend, Turnstile)
  - [ ] Secrets and env vars entered; GitHub `production` environment + branch protection
  - [ ] First deploy, seed, superadmin password changed, go-live checklist ticked
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
| Admin: login, shell, dashboard, settings        | Admin    | Done (P5 T1–6)     | `admin/{auth,layout,pages,settings}/*`                  | admin/* (login, shell…)     |
| Admin: resource manager (EN/NE tabs)            | Admin    | Done (P5 T7–8)     | `admin/resources/*`, `ResourceForm`, `ResourceTable`    | resource-*, localize        |
| Admin: rich text + media library                | Admin    | Done (P5 T8)       | `RichTextEditor.tsx`, `MediaPicker.tsx`, `pages/Media`  | rich-text, media            |
| Scheduled publishing (projects, posts)          | Backend  | Done (P5 T8)       | `services/content.service.ts` (`schedulable`)           | schedule                    |
| Admin: deposit editor (WGS-84 pin)              | Admin    | Done (P5 T9)       | `admin/pages/DepositEdit.tsx`                           | deposit                     |
| Admin: inquiries, messages, applications        | Full     | Done (P5 T10)      | `admin/inbox/*`, `pages/{Inquiries,Messages,…}`         | inbox, inquiry              |
| Admin: assay manager + CSV import               | Full     | Done (P5 T11)      | `admin/pages/Assay.tsx`, `services/assay.service.ts`    | assay, assay-admin, csv     |
| Admin: users + audit log                        | Admin    | Done (P5 T12)      | `admin/pages/{Users,Audit}.tsx`                         | users-audit                 |
| Admin e2e (in-memory API)                       | Admin    | Done (P5 T13)      | `e2e/admin.spec.ts`, `backend/scripts/e2e-server.ts`    | 10 Playwright flows         |
| Deposit composition donut (Table 14)            | Frontend | Done               | `sections/CompositionDonut.tsx`, `lib/composition.ts`   | composition-donut           |
| Drilling preloader (CSS-only)                   | Frontend | Done               | `motion/Preloader.tsx`, `globals.css` `.drill-*`        | screenshots                 |
| CI pipeline / deployments                       | DevOps   | Done (not live)    | `.github/workflows/*`, `render.yaml`, `vercel.json`     | —                           |
| Rebuild when scheduled items go live            | Backend  | Done               | `jobs/publishWatch.ts`                                  | publish-watch               |
| Real report imagery + logos (4.5)               | Assets   | Done (step 1)      | `assets/site/*`, `docs/content/manifest.json`           | —                           |
| Bilingual EN/NE (4.5)                           | Full     | Done (step 2)      | `app/i18n.ts`, `locales/*`, `LocalizedString.ts`        | —                           |
| LocalizedString migration (4.5)                 | Backend  | Done (step 2)      | `migrations/2026-10-localize-fields.ts`                 | —                           |
| Product + Deposit models/API (4.5)              | Backend  | Done (step 3)      | `models/Product.ts`, `models/Deposit.ts`                | —                           |
| Assay models/API + seed (4.5)                   | Backend  | Done (step 3)      | `models/Assay*.ts`, `seed/assay.seed.ts`                | —                           |
| Bulk supply Inquiry (4.5)                       | Full     | Done (step 4)      | `models/Inquiry.ts`, `InquiryForm.tsx`                  | —                           |
| Our Project / Products / Technical / Investors  | Frontend | Done (QA'd)        | `pages/public/*`                                        | —                           |

Status values: Not started · In progress · Review · Done · Blocked

---

## 7. Session log (newest first)

| Date       | What changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Files touched                                                                                                                                                                                                                                                                                                                                                                                                                 | Open issues                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 2026-10-11 | Developer page `/:lang/developer` (`pages/public/Developer.tsx`, ns `developer`, en + ne headings): portrait cropped from the CV (`assets/images/developer-james-portrait.jpg`, `images.developer`), role, summary, Portfolio/GitHub/LinkedIn/Email buttons (no phone), "What was built", skills, selected projects (Momento, FarmaHelp, CloudCall), "Website design & development © <year> Janak (James) Rokaya", Person JSON-LD; prerendered + in sitemap. Footer: "Developer" entry at the end of Quick links (`nav.developer`), no extra credit line. CV PDF not linked or shipped. `LICENSE` still names Niraum Metals — unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                           | `pages/public/Developer.tsx`, `app/router.tsx`, `components/layout/Footer.tsx`, `content/images.ts`, `locales/{en,ne}/{developer,common}.json`, `tests/footer.test.tsx`                                                                                                                                                                                                                                                       | Code ownership vs. LICENSE (owner to decide); Nepali text in native review                                     |
| 2026-10-11 | Phase 7 deploy config (owner chose deploy before Phase 6; Vercel + Render + Atlas). ADR-0005; `frontend/vercel.json` (pnpm workspace build, retired-page 301s, `/admin` shell, cache + security headers); build also writes root `404.html`; `render.yaml` (Docker, Singapore, starter, health check, `preDeployCommand` migrations, `autoDeploy: false`); `deploy-backend.yml` (after CI on main → Render hook `&ref=<sha>` → waits for `/health` `commit`); `deploy-frontend.yml` (manual Vercel hook + smoke check); `/health` returns `commit`; `jobs/publishWatch.ts` rebuilds when scheduled items go live; API image ships `docs/content/data` for seeding. 178 backend + 229 frontend tests, lint, typecheck, build pass. Not done: accounts, domain, secrets, first deploy (no Docker locally, so image builds are checked by CI only).                                                                                                                                                                                                                                   | `frontend/vercel.json`, `render.yaml`, `.github/workflows/deploy-*.yml`, `backend/src/{jobs/publishWatch,config/env,routes/index,server}.ts`, `backend/Dockerfile`, `frontend/vite.config.ts`, `docs/{DEPLOYMENT,ARCHITECTURE,API}.md`, `docs/adr/0005-*`                                                                                                                                                                     | Domain + accounts; first deploy; Phase 6                                                                       |
| 2026-10-11 | Site updates (plan `~/.claude/plans/atomic-launching-eich.md`): **glass/texture CSS never loaded** — `@import`s sat below the Mukta `@font-face` and were dropped; moved to the top (scrolled header was see-through). Banner photos (`crane.jpg` Home hero, `worksites.jpg` page heroes, source [CONFIRM]); logo emblem transparent in its own colours, no tile (owner chose not to recolour); Nepali headings no longer clip vowel signs; founder portrait (`shivahari.jpeg`, seed fills a missing photo); phone/WhatsApp +977 9851090957 (`site_content.json` → fallback + seed). Home sustainability section rebuilt as a split layout with the CH-B-1 field photo. Deposit composition SVG donut (SiO₂ / Fe₂O₃ / Al₂O₃ / remainder from Table 14; Fe as centre label) on Home, Products, Technical Data. Drilling preloader in pure CSS. Vitest `asyncUtilTimeout` 10 s. 176 backend + 229 frontend tests. Lighthouse mobile A/B on the same machine: baseline en 85–87 / ne 74–77 → now en 83–86 / ne 72 (see §8).                                                           | `frontend/src/{styles,components,content,pages,locales,lib}/**`, `backend/src/seed/katujpani.seed.ts`, `docs/content/data/site_content.json`, `assets/CREDITS.md`                                                                                                                                                                                                                                                             | Banner photo licences; /ne mobile TBT                                                                          |
| 2026-10-11 | Phase 5 tasks 9–13 by five parallel agents in git worktrees, merged by cherry-pick: deposit editor with WGS-84 pin (T9), inquiries pipeline + CSV, messages, applications, inquiry `q` + `meta.counts` (T10), assay admin writes + all-or-nothing CSV import + screen (T11), users + audit log (T12), admin e2e on an in-memory API with e2e seed users, plus smoke e2e for the new screens (T13). Found and fixed: `sonner` missing from `package.json`. Audit rows link to inquiry detail, messages, applications, assay, media, users. Earlier today: T8 rich text, media library, scheduling, remaining content configs.                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `frontend/src/admin/**`, `backend/src/{services,controllers,validators,routes,utils,seed}/**`, `backend/scripts/e2e-server.ts`, `frontend/e2e/admin.spec.ts`, `docs/API.md`                                                                                                                                                                                                                                                   | Phase 6 security                                                                                               |
| 2026-10-11 | Phase 5 task 8 — scheduled publishing: projects/posts with a future `publishedAt` stay off public lists, detail and sitemap (`schedulable` in content.service, `$and` so it combines with jobs' deadline `$or`; project validator accepts `publishedAt`). TipTap 2.27.3 `RichTextEditor` (bold, italic, H2/H3, lists, safe links, undo/redo; empty doc → `''`) in every richtext field incl. EN/नेपाली tabs. Media: `MediaPicker` (library dialog + upload, chosen straight away), `/admin/media` page (type tabs, drag-and-drop upload with alt required for images and client size/type checks, edit alt, copy URL, delete, `STORAGE_UNAVAILABLE` banner). Configs for team, services, projects, posts, jobs; form support for `nullable` fields and `group` objects (hidden keys such as project lat/lng are kept). Test setup: jsdom layout stubs for ProseMirror, `asyncUtilTimeout` 5 s (cold lazy admin chunks timed out at 1 s even before this change). 150 backend + 181 frontend tests; lint, typecheck, build, admin boundary clean; editor code only in admin chunks. | `backend/src/services/{content.service,resources}.ts`, `validators/content.ts`, `tests/schedule.test.ts`, `frontend/src/admin/{components/{RichTextEditor,MediaPicker,MediaUpload,MediaGrid,ResourceField,LocalizedField}.tsx,media/useMedia.ts,pages/Media.tsx,resources/{config,form}.ts,routes.tsx}`, `frontend/tests/{setup.ts,admin/{rich-text,media,resource-configs,localized-field}.test.*}`, `frontend/package.json` | Task 9 deposit editor; scheduled items need a rebuild at their publish time (§8)                               |
| 2026-10-10 | Phase 5 tasks 2–7 (logged 11 Oct): captcha after 3 failed logins (`9c5495a`); sign-in, forced password change, forgot/reset (`d4dab2d`), drafts kept on session errors (`02a50b2`); role-aware shell with sidebar, Cmd+K palette, breadcrumbs, unsaved guard (`30f0ba7`, `31f56c0`); dashboard (`e85e4ed`); settings with map pin, social rows, assay visibility (`e46bf31`); generic resource manager with EN/नेपाली tabs, products first, `localized.json` sync test (`dbac026`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `backend/src/services/auth.service.ts`, `frontend/src/admin/**`                                                                                                                                                                                                                                                                                                                                                               | —                                                                                                              |
| 2026-10-10 | Phase 5 task 1 — admin route tree: lazy client-only `/admin/*` (`adminRoute` beside the `/:lang` tree, own providers, noindex Helmet), Login stub, `check:admin-boundary` script (public code must not import `@/admin`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `frontend/src/admin/**`, `frontend/src/app/router.tsx`, `frontend/scripts/check-admin-boundary.mjs`, `frontend/tests/admin/routes.test.tsx`, `eslint.config.js`                                                                                                                                                                                                                                                               | Login form, shell, pages follow in tasks 2+                                                                    |
| 2026-10-10 | Low-risk perf pass: app starts on first-contentful-paint (PerformanceObserver, 3 s fallback); below-fold images render after mount with placeholder + noscript. Lighthouse mobile en 98–99, ne 82–92; desktop 98–100.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `frontend/vite.config.ts`, `components/common/Img.tsx`                                                                                                                                                                                                                                                                                                                                                                        | /ne Home mobile 82–88                                                                                          |
| 2026-10-10 | Follow-up QA + performance: Technical Data overflow fix (min-w-0), self-hosted Mukta (400/700, optional, preloaded on /ne only; CLS 0), 23 KB texture tile, LCP text without fade, app JS starts after first paint (data-hydrated marker; e2e waits), cookie notice only with analytics. QA sweep: 8 pages × en/ne × light/dark × 390/768/1440 = 96 views, no overflow/console errors after fix. Lighthouse desktop 92–98 / 100 / 100 / 100; mobile 82–84 en, 77–78 ne; CLS 0 everywhere.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `frontend/vite.config.ts`, `globals.css`, `textures.css`, `Hero.tsx`, `PageHero.tsx`, `LanguageToggle.tsx`, `DataNotice.tsx`, `App.tsx`, `e2e/site.spec.ts`                                                                                                                                                                                                                                                                   | Mobile Lighthouse < 90 (see §8)                                                                                |
| 2026-10-10 | Every nav page brought to the Home standard (one commit per page): About, Our Project, Products, Technical Data, Sustainability, Investors, Contact — blueprint §5 sections, real photos, bulk-supply CTA band, SEO + JSON-LD (Person, Place, Product, Dataset, LocalBusiness), full Nepali (TODO-review markers). Shared Nepali chrome; `site_content.json` as single source for deposit/product/founder; Operations/Projects/News/Careers retired with redirects; placeholder contact values no longer rendered as links.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `frontend/src/{pages,components,locales,content,features,app}/**`, `backend/src/seed/katujpani.seed.ts`, `docs/content/data/site_content.json`, `nginx.conf`                                                                                                                                                                                                                                                                  | Land figures hidden until confirmed                                                                            |
| 2026-10-10 | Real field photography: 8 photos from `/Assets` processed (EXIF/GPS stripped, rotation, light correction), `?photo` preset AVIF+WebP 480–1600, originals in `design-assets/originals`; new hero; og-image; CREDITS + manifest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `frontend/src/assets/site/photos/*`, `content/siteImages.ts`, `design-assets/originals/*`                                                                                                                                                                                                                                                                                                                                     | Consent for people in photos                                                                                   |
| 2026-10-10 | Backend runs locally on MongoDB Atlas (`backend/.env`, gitignored, fresh JWT secrets); `pnpm seed` + `pnpm dev` verified (health ok, Home stats from the API); old lint-staged stashes dropped. Hero split-text spacing fixed (+ test). Legal name confirmed: NIRAUM METALS PVT. LTD.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `backend/.env` (local only), `SplitText.tsx`, `tests/split-text.test.tsx`, docs                                                                                                                                                                                                                                                                                                                                               | —                                                                                                              |
| 2026-10-10 | Phase 4.5 step 6 — docs: API.md (languages, products/deposits, assay, inquiries, migration, rate limit), CHANGELOG, README (status, seed/migrate, pages), ARCHITECTURE §13 (built; how it differs from the plan), SKILLS file map.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `docs/API.md`, `CHANGELOG.md`, `README.md`, `docs/ARCHITECTURE.md`, `SKILLS.md`                                                                                                                                                                                                                                                                                                                                               | —                                                                                                              |
| 2026-10-10 | Phase 4.5 step 5 — QA: e2e updated + new journeys (redirect, language toggle + remembered choice, hreflang, inquiry EN/NE, Technical Data, dark mode) — 10 passed (chromium, system Chrome). Perf fixes: strip vite-react-ssg's blanket image preloads (28.8 MB → 0.9 MB per page), keep only Manrope Latin (+ Mukta 400 on /ne) font preloads, CSS entrance for above-the-fold text, preloader skipped on phones and CSS-dismissed at 1.6 s. Lighthouse home — desktop: /en 94/100/100/100, /ne 92/100/100/100; mobile (simulated slow 4G): /en 70, /ne 66 performance, 100 a11y/BP/SEO; CLS 0. Vitest testTimeout 15 s.                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `frontend/vite.config.ts`, `e2e/site.spec.ts`, `SplitText.tsx`, `Hero.tsx`, `PageHero.tsx`, `lib/motion.ts`, `globals.css`, `index.html`                                                                                                                                                                                                                                                                                      | Mobile performance < 90: needs a decision on the motion stack (see §8)                                         |
| 2026-10-10 | Phase 4.5 step 4 — pages: Home rebuilt to blueprint §5 (hero copy + Request Bulk Supply / View Technical Data, stats from AssaySummary with 2-decimal CountUp, What we supply, project teaser with lease map, 6-step field-to-supply timeline, inquiry CTA); new Our Project (location, local-grid note, tabbed maps + lightbox, zones, land figures flagged, status, gallery), Products (applications verbatim, Table 14 chemistry, [CONFIRM] supply terms, Product JSON-LD), Technical Data (key figures, Table 14 HTML table, Recharts Fe₂O₃ chart, gated sample table, sampling method, report request), Investors (overview, milestones, founder, deck form); About (story, values, FounderCard, consultant credit); Contact (Bulk Supply Inquiry tab, default). Nav reordered; footer links; 7 page namespaces EN + NE. 30 frontend tests.                                                                                                                                                                                                                                   | `frontend/src/{pages,components,features,content,locales,lib}/**`, `frontend/tests/*`, `frontend/Dockerfile`                                                                                                                                                                                                                                                                                                                  | Nepali copy needs native review; ContactForm (general tab), Operations/News/Careers/Legal still English on /ne |
| 2026-10-10 | Phase 4.5 step 3 — models + API: Product and Deposit (content resources: public list/detail with `?lang=`, admin CRUD), AssaySample + AssaySummary (`/assay/summary` always public; `/assay/samples` 403 unless `publicAssayDetail`; admin always), Inquiry (`POST /inquiries` 5/h/IP, honeypot, captcha, inbox email + `INQUIRY_CC`, auto-reply EN/NE; admin list/filter/status/CSV with formula-injection guard). Seeds from `assay_data.json` (upsert) + Katujpani deposit, hematite product, founder (create-if-missing). OpenAPI updated. 130 backend tests.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `backend/src/{models,services,controllers,validators,routes,seed,docs}/**`, `backend/tests/{assay,inquiry}.test.ts`, `.env.example`                                                                                                                                                                                                                                                                                           | Land figures + WGS-84 pin + product sizes stay [CONFIRM]                                                       |
| 2026-10-10 | Phase 4.5 step 2 — bilingual. Backend: LocalizedString `{ en, ne? }` on Project/Post/Job/Service/TeamMember text + SiteSettings motto/footer.about; public `?lang=`; admin keeps English strings + `translations`; `publicAssayDetail`, `defaultLanguage`, founder fields; idempotent `migrate` (also in seed). Frontend: react-i18next with URL-driven language (`useT`/`useLang`), `/en/*` + `/ne/*` prerendered (55 pages), `/` + old URLs → redirect stubs, LanguageToggle (saves choice), language-aware `Link`/`NavLink`, hreflang + og:locale + sitemap alternates, Mukta for Devanagari, nginx shells per language.                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `backend/src/{models,services,validators,migrations}/**`, `frontend/src/{app,hooks,locales,lib,components,pages,features}/**`, `vite.config.ts`, `nginx.conf`, tests                                                                                                                                                                                                                                                          | Nepali strings need native review; secondary pages (Operations, News, Careers, Legal) still English in `/ne`   |
| 2026-10-10 | Phase 4.5 step 1 — assets: `?site` imagetools preset (AVIF/WebP 480/768/1200), `content/siteImages.ts` with alt text checked against the contact sheet; Katujpani photo in hero (2 px blur ≥ 1600 px), About banner, sustainability band/page; real emblem in `Logo.tsx` (off-white tile on dark); favicons, app icons and og-image regenerated from the brand files; `.texture-hematite`; `assets/CREDITS.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `frontend/vite.config.ts`, `src/content/siteImages.ts`, `Logo.tsx`, `Hero.tsx`, `SustainabilityBand.tsx`, `About.tsx`, `Sustainability.tsx`, `textures.css`, `public/*`, `index.html`                                                                                                                                                                                                                                         | Field-photo consent before using the two team photos                                                           |
| 2026-10-10 | Phase 4.5 baseline on `feature/phase-4-5-content`: 110 backend + 17 frontend unit tests pass; lint and typecheck clean.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | —                                                                                                                                                                                                                                                                                                                                                                                                                             | —                                                                                                              |
| 2026-10-10 | Phase 4.5 prep: committed Phases 3–4; fixed pre-commit hook on Windows (tools run via `node`, `--no-warn-ignored`); moved blueprint, Phase 4.5 prompt, manifest, assay data, report images, logos and design originals into the repo; merged incoming SKILLS/README/ARCHITECTURE (real code wins).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `.lintstagedrc.json`, `docs/content/**`, `frontend/src/assets/site/**`, `design-assets/**`, `SKILLS.md`, `README.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`                                                                                                                                                                                                                                                                     | Confirm list §11; Phase 4.5 steps 1–6                                                                          |
| 2026-10-10 | Phase 4 finished: sample content seed, `/images/*` → local picture mapping, Turnstile widget on contact + apply forms, build prerenders API slugs (sitemap-data + per-page JSON snapshot, real `lastmod`). 110 backend + 17 frontend unit tests, e2e passing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `backend/src/seed/*`, `backend/tests/settings.test.ts`, `frontend/vite.config.ts`, `frontend/src/{lib,content,components,features}/**`, `frontend/tests/*`, env examples, Dockerfile, compose                                                                                                                                                                                                                                 | Phase 1 screens still Home-only                                                                                |
| 2026-10-09 | Phase 4: backend API — env, 13 models, cookie auth (lockout, rotation, reset), roles, settings + Nominatim geocoding, generic content CRUD with soft delete + audit, media, contact/applications/newsletter, captcha, rebuild hook, OpenAPI, 107 tests.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `backend/**`, `docs/*.md`, `docker-compose.yml`, `SKILLS.md`, `README.md`, `CHANGELOG.md`                                                                                                                                                                                                                                                                                                                                     | Seed content; frontend captcha + sitemap-data                                                                  |
| 2026-10-09 | Fix: blank dev page in Edge — ad blocker blocked `CookieBanner`/`consent`/`SocialIcons` modules; renamed to `DataNotice`/`visitorPrefs`/`ProfileLinks`. README progress + troubleshooting, CHANGELOG.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `frontend/src/**`, `README.md`, `CHANGELOG.md`, `SKILLS.md`                                                                                                                                                                                                                                                                                                                                                                   | —                                                                                                              |
| 2026-10-09 | Phase 3: design tokens, glass/texture utilities, 28 shadcn components, motion system, 13 public pages, SEO + sitemap, API-with-fallback data layer, 15 unit + 4 e2e tests. Resolved merge conflict in this file.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `frontend/**`, `SKILLS.md`, `README.md`                                                                                                                                                                                                                                                                                                                                                                                       | Backend endpoints (Phase 4); real logo, media and facts                                                        |
| 2026-10-08 | Phase 2: monorepo skeleton, configs, docker-compose, docs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | repo root, `backend/`, `frontend/`, `docs/`                                                                                                                                                                                                                                                                                                                                                                                   | Confirm legal name                                                                                             |

---

## 8. Known issues / tech debt

- **CSS `@import` order:** every `@import` in `globals.css` must stay above all other rules,
  including `@font-face`, or the browser silently drops it (glass/textures were missing until
  2026-10-11).
- **Lighthouse is machine-dependent:** compare against a baseline built and measured in the
  same session (A/B), not against old numbers. 2026-10-11 A/B: en unchanged, /ne ≈ 3 points lower
  (TBT +200 ms, likely hydration of the extra Home section).
- Agent worktrees from Phase 5 live in `.claude/worktrees/` (ignored; all merged) — remove with
  `git worktree remove` when no longer needed.

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
- **Scheduled items:** `jobs/publishWatch.ts` fires the rebuild hook within
  `PUBLISH_CHECK_MINUTES` (10) of a scheduled project/post going live. In-process, so one API
  replica only.
- **Deployed before Phase 6:** the site ships with basic security headers (`vercel.json`) but no
  CSP yet. Phase 6 adds it (Turnstile, Cloudinary, map tiles).
- **Vercel previews can't sign in to `/admin`:** `*.vercel.app` is cross-site to `api.<domain>`
  (ADR-0003/0005).
- **Format check on Windows:** `pnpm format:check` reports ~59 files because `core.autocrlf=true`
  checks out CRLF; CI (LF) is clean. Check only changed files locally.
- No hero video yet (`HERO_VIDEO_URL`); hero uses the field-geologist photo.
- Office map pin is approximate (central Lalitpur) and labelled as such.
- shadcn CLI hangs during its dependency install on this machine — see §3 for the workaround.
- Render free tier sleeps when idle — use a paid instance for production.
- **Lighthouse** (Home, Our Project, Contact; local preview): desktop 98–100, mobile en 98–99,
  mobile /ne Our Project 92 and Contact 90, **mobile /ne Home 82–88** (target 90) — a11y, best
  practices, SEO 100, CLS 0 everywhere. What is left on /ne Home: the two Mukta weights (~200 KB,
  preloaded so headings don't shift) and the hero photo. Options: Mukta 400 only (synthetic-bold
  headings) or a smaller mobile hero crop.
- Non-priority images render after the app mounts (placeholder box + <noscript> copy), so
  below-the-fold photos never compete with first paint; the app starts on first-contentful-paint.
- The app JS now starts after the first painted frame (vite.config.ts `onPageRendered`);
  interactive UI (menu, toggles, forms) is live after hydration — `<html data-hydrated>`.
- Retired pages: Operations → Products, Projects (+ details) → Our Project, News (+ articles) →
  About, Careers (+ jobs) → Contact. Components and backend APIs (posts, jobs, services,
  projects) are kept for a Phase 5 decision.
- Cookie notice is shown only when `VITE_ANALYTICS_ID` is set (essential cookies need none).
- Map No. 1 land figures are not shown on the site until confirmed ([CONFIRM]).
- Pre-commit on Windows: lint-staged hung when it passed many paths through the `eslint.CMD` /
  `prettier.CMD` shims (cmd.exe never started node). `.lintstagedrc.json` now calls
  `node node_modules/<tool>/…` directly — keep it that way.

- **Mobile Lighthouse performance ≈ 70 (target 90).** Real paint is fast (observed FCP 0.3 s,
  LCP 0.7 s) and desktop scores 92–94, but simulated slow-4G mobile charges ~650 KB of JS
  (React, framer-motion, GSAP/Lenis, app) requested before first paint. Reaching 90 needs a
  decision: defer/lazy-load framer-motion + GSAP/Lenis after first paint, or drop some motion on
  mobile. The weathered-hematite texture (154 KB) could also be recompressed.
- Nepali copy (locales `ne/*.json`, auto-reply in `inquiry.service.ts`) is a draft — native
  review needed. The data-origin statement and product application wording stay English on `/ne`.
  Still English on `/ne`: general ContactForm, Operations, Projects, News, Careers, Legal,
  Sustainability page body, Footer newsletter labels.
- Projects/ProjectDetail/Operations/News sample content (generic iron ore / aggregates / metal
  minerals) predates the Katujpani focus — kept working and reachable from the footer; decide in
  Phase 5 whether to retire or rewrite it.
- The frontend fallback `content/katujpani.ts` repeats the deposit/product/founder text from
  `backend/src/seed/katujpani.seed.ts` — change both (assay numbers are shared via the JSON).
- vite-react-ssg preloads every image and font in the module graph; `onPageRendered` in
  `vite.config.ts` strips them (keep it when upgrading vite-react-ssg).

**Phase 4.5 content (from the blueprint):**

- Report is titled "Mine Scheme proposed by Ms Niru Upreti" — confirm lease ownership/credit
  before any "our mine" copy.
- Report photos are small (≈340–560 px, upscaled 2×); request original camera files.
- Section C sample sheet is incomplete (6.95 of 9.15 m); the site uses Table 14 values. DM-9
  Fe/Al₂O₃ partly hidden by a stamp.
- Mine location is in the report's local grid (Easting/Northing), not lat/lng — do not
  auto-convert; the map pin waits for WGS-84 coordinates.

**Incoming docs vs. real code (10 Oct 2026 merge — the code wins; fix the docs, not the code):**

- Phase 1 is _partial_ (Home only, dark, desktop); the incoming tracker marked it done.
- Admin code lives in `frontend/src/admin/` (not `pages/admin/`); public code must never import it
  (`pnpm --filter frontend check:admin-boundary`).
- The **Operations** page exists and isn't in the incoming sitemap; decide in 4.5 whether it
  stays, becomes Products, or redirects.
- 13 models exist, including **Subscriber** and **GeocodeCache** (not in the incoming data model).
  All text fields are plain strings today.
- Middleware is `auth.ts` (requireAuth + requireRole), `rateLimits`, `originCheck`, `requestId`,
  `upload`, `errorHandler`. There is no `validate` middleware — controllers call `schema.parse`.
- Data hooks are `features/<x>/use*.ts` on `useContentList`/`useContentItem` with local fallback,
  not `features/<x>/api.ts`.
- Timeline component is `ProcessTimeline`; extra components `DataNotice`, `MobileCta`, `Captcha`.
- `robots.txt` and `sitemap.xml` are generated by `vite.config.ts`, not files in `public/`.
- API port is **4000** (incoming docs say 5000). Rebuild hook env is `REBUILD_HOOK_URL`
  (incoming: `FRONTEND_DEPLOY_HOOK`). E2E script is `test:e2e` (incoming: `e2e`). No `migrate`
  script or `migrations/` folder yet.
- Branches: `main` + feature branches with the `feat/` and `feature/` prefixes; no `develop` yet.
- ADRs on disk are 0001–0004; the incoming ADR summary uses 0007–0011 (0005/0006 don't exist).
  Renumber to 0005–0009 when writing them.
- Blueprint/manifest name images as `.png` under `photos/`, `maps/`, `tables/`; the delivered
  files are `.webp` (site) and `.jpg` (`design-assets/`). Same base names.
- Two photo sets now exist: `assets/images/` (9 field photos from `/Assets` WhatsApp originals,
  in use) and `assets/site/` (report imagery). Step 1 decides which replace which.
- The blueprint mentions `Niraum_Web_Assets.zip`; the files were delivered unzipped (now moved).

---

## 9. Next steps (top 5, in order)

1. Decide on mobile performance (SKILLS §8): defer framer-motion / GSAP / Lenis after first
   paint or trim mobile motion, then re-run Lighthouse on `/en` and `/ne` (target ≥ 90).
2. Get the founder to answer the confirm list (§11) — lease holder, WGS-84 pin, banner photo licences.
3. Native-speaker review of the Nepali strings.
4. Phase 7 go-live: register the domain, create the accounts and follow `docs/DEPLOYMENT.md`
   "First-time setup" (Atlas → services → Render → Vercel → DNS → GitHub), then the go-live list.
5. Phase 6 — security: OWASP review, CSP (Turnstile, Cloudinary, tiles), CSRF, 2FA, SECURITY.md,
   ZAP scan against the deployed site. Legal review of Privacy, Terms and Cookie pages.

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
| `PUBLISH_CHECK_MINUTES` (10)                                            | scheduled-item rebuild check (0 = off)    |
| `RENDER_GIT_COMMIT`                                                     | set by Render; shown by `/health`         |

| Frontend (all `VITE_*` are public)          | Purpose                                                             |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `VITE_API_URL`                              | API base (`/api/v1`, proxied in dev)                                |
| `VITE_SITE_URL`                             | canonical URLs, sitemap, robots, Open Graph — **set in production** |
| `SSG_API_URL`                               | API used at build time by the prerender                             |
| `VITE_TURNSTILE_SITE_KEY`                   | Turnstile widget on contact/apply forms (required in production)    |
| `VITE_MAP_TILE_URL`, `VITE_MAP_ATTRIBUTION` | Leaflet tiles                                                       |
| `VITE_ANALYTICS_ID`                         | optional; load only if `readConsent()?.analytics`                   |

Planned in Phase 4.5 (add to the `.env.example` files when implemented):

| Name                | Where    | Purpose                                                 |
| ------------------- | -------- | ------------------------------------------------------- |
| `INQUIRY_CC`        | backend  | optional CC for bulk-supply inquiry emails              |
| `VITE_DEFAULT_LANG` | frontend | fallback language when none is saved or detected (`en`) |

`CONTACT_INBOX` receives contact **and** inquiry emails (`niraummetals@gmail.com` until a domain
mailbox exists — [CONFIRM]).

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

Several items above are now answered by the blueprint (founding year 2026, founder, Katujpani
project, real logo files, contact email) — they stay unticked until Phase 4.5 puts them in the
code.

### Phase 4.5 confirm list (blueprint [CONFIRM] items — admin-editable placeholders until answered)

- [ ] Lease ownership of Katujpani and how to credit Ms Niru Upreti
- [x] Public phone/WhatsApp +977 9851090957 (founder's number = company line; confirmed by the owner 2026-10-11) — email niraummetals@gmail.com (blueprint)
- [ ] WGS-84 lat/lng of the mine main point
- [ ] Land figures from Map No. 1 (survey 20.68 ha, total land use 3.41 ha, etc.)
- [ ] Product sizes, minimum order, packing, delivery points
- [ ] Permission to publish sample-level assay data (`publicAssayDetail`)
- [ ] Consent from people shown in field photos (hero `iron-ore-outcrop-cliff-field-geologist`, Field_Sampling_*)
- [x] Founder portrait (`shivahari.jpeg`, 2026-10-11)
- [ ] Source and licence of the banner photos `crane.jpg`, `worksites.jpg` (not of Katujpani)
- [ ] Sustainability commitments from EIA/IEE
- [ ] Social media URLs (Admin → Settings)
- [ ] Privacy, Terms, Cookie text (legal review)
- [ ] Nepali copy reviewed by a native speaker

---

## 12. Commands

| Task               | Command                                                           |
| ------------------ | ----------------------------------------------------------------- |
| Install            | `pnpm install`                                                    |
| DB + mail (Docker) | `pnpm db:up` (Mongo :27017, Mailpit UI :8025)                     |
| Dev (both)         | `pnpm dev` (web :5173, API :4000)                                 |
| Lint / format      | `pnpm lint` · `pnpm format`                                       |
| Typecheck          | `pnpm typecheck`                                                  |
| Unit tests         | `pnpm test`                                                       |
| Migrate (4.5)      | `pnpm --filter backend migrate` (idempotent; also in `pnpm seed`) |
| E2E                | `pnpm test:e2e` (set `PW_CHROMIUM_PATH` to use installed Chrome)  |
| Build (prerender)  | `pnpm build` → `pnpm --filter frontend preview` (:4173)           |
| Full stack Docker  | `docker compose --profile app up --build` (site :8080)            |

---

## 13. Definition of done (every feature)

- [ ] Lint, typecheck, unit tests and build pass; e2e for key journeys
- [ ] Light and dark checked at 360 / 768 / 1280 px; no horizontal scroll
- [ ] Keyboard accessible, visible copper focus ring, 44 px targets, reduced motion respected
- [ ] No hydration or console errors on the prerendered page
- [ ] No invented facts; new unknowns added to §11
- [ ] Facts match the blueprint; no "high-grade" claims; data-origin note under technical tables
- [ ] Works in `/en` and `/ne` with no untranslated keys visible (once Phase 4.5 i18n lands)
- [ ] SKILLS.md (status, file map, session log), README and ARCHITECTURE updated
