# Niraum Metals — SKILLS & Progress Tracker

> **Read this file first in every session.** It is the single source of truth for what exists,
> how things are done and what comes next. Update it at the end of every phase and session.
> Read with [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); if this file conflicts with an ADR, the
> ADR wins.
>
> **Current phase: 4.5 — real content, bilingual (EN/NE), bulk inquiries.** Phases 2–4 are
> complete. All 4.5 work is additive: extend finished code, don't rewrite it. Content facts come
> only from `docs/content/NIRAUM_MASTER_BLUEPRINT.md` and `docs/content/data/assay_data.json`.

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
| Hosting (proposed)      | Vercel (frontend) · Render (API) · Atlas Mumbai · Cloudinary · Cloudflare DNS — not decided in `docs/DEPLOYMENT.md` yet                              |

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

Planned in Phase 4.5 (not created yet — move into the tree above as they land):

```text
frontend/src/app/i18n.ts                 react-i18next setup, /:lang routing helpers
frontend/src/locales/en|ne/              common, home, about, project, products, technical,
                                         sustainability, investors, contact, admin .json
frontend/src/pages/public/               OurProject, Products, TechnicalData, Investors
frontend/src/components/layout/          LanguageToggle
frontend/src/components/sections/        InquiryForm, AssaySummaryTable, AssaySampleTable,
                                         FeBySectionChart, MapGallery, FounderCard, DataOriginNote
frontend/src/features/                   products, deposits, assay, inquiries (use*.ts hooks)
frontend/src/assets/CREDITS.md           media credits (real vs stock)
backend/src/models/                      Product, Deposit, AssaySample, AssaySummary, Inquiry,
                                         schemas/LocalizedString.ts
backend/src/migrations/                  2026-10-localize-fields.ts (+ `migrate` script)
backend/src/seed/                        assay.seed.ts, katujpani.seed.ts, product.seed.ts
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
  - [ ] Step 5 — Tests (averages, i18n, inquiry, migration) + Lighthouse ≥ 90 on `/en` and `/ne`
  - [ ] Step 6 — Docs (SKILLS, README, ARCHITECTURE, API, CHANGELOG)
- [ ] **Phase 5 — Admin panel:** login, shell, dashboard, settings (address/map, social toggles), managers, media, inbox, users, audit
      (+ Phase 4.5 adds: Inquiries inbox with status pipeline + CSV, Products editor, Deposit
      editor incl. lat/lng pin, Assay manager with CSV import + `publicAssayDetail` switch, EN/नेपाली
      tabs on every content form)
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
| Real report imagery + logos (4.5)               | Assets   | Done (step 1)      | `assets/site/*`, `docs/content/manifest.json`           | —                           |
| Bilingual EN/NE (4.5)                           | Full     | Done (step 2)      | `app/i18n.ts`, `locales/*`, `LocalizedString.ts`        | —                           |
| LocalizedString migration (4.5)                 | Backend  | Done (step 2)      | `migrations/2026-10-localize-fields.ts`                 | —                           |
| Product + Deposit models/API (4.5)              | Backend  | Done (step 3)      | `models/Product.ts`, `models/Deposit.ts`                | —                           |
| Assay models/API + seed (4.5)                   | Backend  | Done (step 3)      | `models/Assay*.ts`, `seed/assay.seed.ts`                | —                           |
| Bulk supply Inquiry (4.5)                       | Full     | Done (step 4)      | `models/Inquiry.ts`, `InquiryForm.tsx`                  | —                           |
| Our Project / Products / Technical / Investors  | Frontend | Done (step 4)      | `pages/public/*`                                        | —                           |

Status values: Not started · In progress · Review · Done · Blocked

---

## 7. Session log (newest first)

| Date       | What changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Files touched                                                                                                                                                                                 | Open issues                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 2026-10-10 | Phase 4.5 step 4 — pages: Home rebuilt to blueprint §5 (hero copy + Request Bulk Supply / View Technical Data, stats from AssaySummary with 2-decimal CountUp, What we supply, project teaser with lease map, 6-step field-to-supply timeline, inquiry CTA); new Our Project (location, local-grid note, tabbed maps + lightbox, zones, land figures flagged, status, gallery), Products (applications verbatim, Table 14 chemistry, [CONFIRM] supply terms, Product JSON-LD), Technical Data (key figures, Table 14 HTML table, Recharts Fe₂O₃ chart, gated sample table, sampling method, report request), Investors (overview, milestones, founder, deck form); About (story, values, FounderCard, consultant credit); Contact (Bulk Supply Inquiry tab, default). Nav reordered; footer links; 7 page namespaces EN + NE. 30 frontend tests. | `frontend/src/{pages,components,features,content,locales,lib}/**`, `frontend/tests/*`, `frontend/Dockerfile`                                                                                  | Nepali copy needs native review; ContactForm (general tab), Operations/News/Careers/Legal still English on /ne |
| 2026-10-10 | Phase 4.5 step 3 — models + API: Product and Deposit (content resources: public list/detail with `?lang=`, admin CRUD), AssaySample + AssaySummary (`/assay/summary` always public; `/assay/samples` 403 unless `publicAssayDetail`; admin always), Inquiry (`POST /inquiries` 5/h/IP, honeypot, captcha, inbox email + `INQUIRY_CC`, auto-reply EN/NE; admin list/filter/status/CSV with formula-injection guard). Seeds from `assay_data.json` (upsert) + Katujpani deposit, hematite product, founder (create-if-missing). OpenAPI updated. 130 backend tests.                                                                                                                                                                                                                                                                                | `backend/src/{models,services,controllers,validators,routes,seed,docs}/**`, `backend/tests/{assay,inquiry}.test.ts`, `.env.example`                                                           | Land figures + WGS-84 pin + product sizes stay [CONFIRM]                                                       |
| 2026-10-10 | Phase 4.5 step 2 — bilingual. Backend: LocalizedString `{ en, ne? }` on Project/Post/Job/Service/TeamMember text + SiteSettings motto/footer.about; public `?lang=`; admin keeps English strings + `translations`; `publicAssayDetail`, `defaultLanguage`, founder fields; idempotent `migrate` (also in seed). Frontend: react-i18next with URL-driven language (`useT`/`useLang`), `/en/*` + `/ne/*` prerendered (55 pages), `/` + old URLs → redirect stubs, LanguageToggle (saves choice), language-aware `Link`/`NavLink`, hreflang + og:locale + sitemap alternates, Mukta for Devanagari, nginx shells per language.                                                                                                                                                                                                                      | `backend/src/{models,services,validators,migrations}/**`, `frontend/src/{app,hooks,locales,lib,components,pages,features}/**`, `vite.config.ts`, `nginx.conf`, tests                          | Nepali strings need native review; secondary pages (Operations, News, Careers, Legal) still English in `/ne`   |
| 2026-10-10 | Phase 4.5 step 1 — assets: `?site` imagetools preset (AVIF/WebP 480/768/1200), `content/siteImages.ts` with alt text checked against the contact sheet; Katujpani photo in hero (2 px blur ≥ 1600 px), About banner, sustainability band/page; real emblem in `Logo.tsx` (off-white tile on dark); favicons, app icons and og-image regenerated from the brand files; `.texture-hematite`; `assets/CREDITS.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                  | `frontend/vite.config.ts`, `src/content/siteImages.ts`, `Logo.tsx`, `Hero.tsx`, `SustainabilityBand.tsx`, `About.tsx`, `Sustainability.tsx`, `textures.css`, `public/*`, `index.html`         | Field-photo consent before using the two team photos                                                           |
| 2026-10-10 | Phase 4.5 baseline on `feature/phase-4-5-content`: 110 backend + 17 frontend unit tests pass; lint and typecheck clean.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | —                                                                                                                                                                                             | —                                                                                                              |
| 2026-10-10 | Phase 4.5 prep: committed Phases 3–4; fixed pre-commit hook on Windows (tools run via `node`, `--no-warn-ignored`); moved blueprint, Phase 4.5 prompt, manifest, assay data, report images, logos and design originals into the repo; merged incoming SKILLS/README/ARCHITECTURE (real code wins).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `.lintstagedrc.json`, `docs/content/**`, `frontend/src/assets/site/**`, `design-assets/**`, `SKILLS.md`, `README.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`                                     | Confirm list §11; Phase 4.5 steps 1–6                                                                          |
| 2026-10-10 | Phase 4 finished: sample content seed, `/images/*` → local picture mapping, Turnstile widget on contact + apply forms, build prerenders API slugs (sitemap-data + per-page JSON snapshot, real `lastmod`). 110 backend + 17 frontend unit tests, e2e passing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `backend/src/seed/*`, `backend/tests/settings.test.ts`, `frontend/vite.config.ts`, `frontend/src/{lib,content,components,features}/**`, `frontend/tests/*`, env examples, Dockerfile, compose | Phase 1 screens still Home-only                                                                                |
| 2026-10-09 | Phase 4: backend API — env, 13 models, cookie auth (lockout, rotation, reset), roles, settings + Nominatim geocoding, generic content CRUD with soft delete + audit, media, contact/applications/newsletter, captcha, rebuild hook, OpenAPI, 107 tests.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `backend/**`, `docs/*.md`, `docker-compose.yml`, `SKILLS.md`, `README.md`, `CHANGELOG.md`                                                                                                     | Seed content; frontend captcha + sitemap-data                                                                  |
| 2026-10-09 | Fix: blank dev page in Edge — ad blocker blocked `CookieBanner`/`consent`/`SocialIcons` modules; renamed to `DataNotice`/`visitorPrefs`/`ProfileLinks`. README progress + troubleshooting, CHANGELOG.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `frontend/src/**`, `README.md`, `CHANGELOG.md`, `SKILLS.md`                                                                                                                                   | —                                                                                                              |
| 2026-10-09 | Phase 3: design tokens, glass/texture utilities, 28 shadcn components, motion system, 13 public pages, SEO + sitemap, API-with-fallback data layer, 15 unit + 4 e2e tests. Resolved merge conflict in this file.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `frontend/**`, `SKILLS.md`, `README.md`                                                                                                                                                       | Backend endpoints (Phase 4); real logo, media and facts                                                        |
| 2026-10-08 | Phase 2: monorepo skeleton, configs, docker-compose, docs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | repo root, `backend/`, `frontend/`, `docs/`                                                                                                                                                   | Confirm legal name                                                                                             |

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
- Pre-commit on Windows: lint-staged hung when it passed many paths through the `eslint.CMD` /
  `prettier.CMD` shims (cmd.exe never started node). `.lintstagedrc.json` now calls
  `node node_modules/<tool>/…` directly — keep it that way.

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
- `pages/admin/` is empty (Phase 5 not started); the incoming file map listed admin pages as
  existing.
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

1. Phase 4.5 — run `docs/content/PHASE_4.5_CONTENT_INTEGRATION_PROMPT.md` steps 1–6 on
   `feature/phase-4-5-content` (assets → i18n + migration → models/seeds → pages → tests → docs).
2. Get the founder to answer the confirm list (§11) — legal name, lease holder, phone, WGS-84 pin.
3. Native-speaker review of the Nepali strings.
4. Phase 5 — admin panel on the documented `/admin` endpoints, plus the 4.5 managers (resolve
   `/images/*.jpg` refs with `withLocalImages` in previews).
5. Legal review of the draft Privacy, Terms and Cookie pages; then Phase 6 security, Phase 7 deploy.

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

- [ ] One legal name (Pvt. Ltd. vs Limited)
- [ ] Lease ownership of Katujpani and how to credit Ms Niru Upreti
- [ ] Public phone/WhatsApp (+977 985 109 0957?) and email (niraummetals@gmail.com)
- [ ] WGS-84 lat/lng of the mine main point
- [ ] Land figures from Map No. 1 (survey 20.68 ha, total land use 3.41 ha, etc.)
- [ ] Product sizes, minimum order, packing, delivery points
- [ ] Permission to publish sample-level assay data (`publicAssayDetail`)
- [ ] Consent from people shown in field photos
- [ ] Original high-res photos + founder portrait
- [ ] Sustainability commitments from EIA/IEE
- [ ] Social media URLs (Admin → Settings)
- [ ] Privacy, Terms, Cookie text (legal review)
- [ ] Nepali copy reviewed by a native speaker

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
- [ ] Facts match the blueprint; no "high-grade" claims; data-origin note under technical tables
- [ ] Works in `/en` and `/ne` with no untranslated keys visible (once Phase 4.5 i18n lands)
- [ ] SKILLS.md (status, file map, session log), README and ARCHITECTURE updated
