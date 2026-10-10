# Niraum Metals

**Strength Forged For Generations** — website and content management system for
**Niraum Metals Pvt. Ltd.**, Lalitpur-13, Nepal (iron ore, metal minerals, stone and aggregate).

Phase 4.5 refocuses the site on the **Katujpani Iron Deposit** (Bakaiya-09, Makawanpur):
bilingual (English / नेपाली), bulk iron ore supply inquiries from cement plants, metal buyers and
traders, and verified technical data for investors. Content source of truth:
[`docs/content/NIRAUM_MASTER_BLUEPRINT.md`](docs/content/NIRAUM_MASTER_BLUEPRINT.md).

> Status: **public website + backend API built (Phases 3–4 done)**. The REST API serves
> settings, content, forms, media and admin auth; the admin panel (Phase 5) comes next.
> Detailed tracker: [SKILLS.md](SKILLS.md).

## Progress

| Phase                                | Status                                                             |
| ------------------------------------ | ------------------------------------------------------------------ |
| 1 — Design (Google Stitch)           | 🟡 Partial — Home page only (dark, desktop); see note below        |
| 2 — Architecture                     | ✅ Done                                                            |
| 3 — Frontend (public site)           | ✅ Done                                                            |
| 4 — Backend API                      | ✅ Done                                                            |
| 4.5 — Real content, EN/NE, inquiries | 🟡 Built — mobile Lighthouse performance and Nepali review pending |
| 5 — Admin panel                      | ⬜ Next                                                            |
| 6 — Security hardening               | ⬜ To do                                                           |
| 7 — CI/CD + deploy                   | ⬜ To do                                                           |
| 8 — Docs + final QA                  | ⬜ To do                                                           |

Phase 1 note: the Stitch export (`code.html`, `screen.png`, `DESIGN.md`) covers the Home page
only. The build follows the Brand Brief where Stitch differed (Manrope instead of Domine, exact
brand hex values, no invented facts).

### Phase 3 — completed tasks

- [x] Design tokens for light + dark (`globals.css`, `tailwind.config.ts`), Manrope, fluid type
- [x] Glass, grain, metal-sheen, copper-glow utilities with `backdrop-filter` fallback
- [x] Theme: light / dark / system, saved choice, no flash on load, sun/moon toggle
- [x] 28 shadcn/ui components, restyled to the brand (44 px touch targets)
- [x] Motion: preloader, page transitions, smooth scroll (Lenis + GSAP), scroll reveal,
      split-text headings, parallax, pinned project gallery, count-up, card tilt, magnetic
      buttons, cursor glow, marquee — all off for reduced motion
- [x] Layout: glass navbar (shrinks on scroll, Operations dropdown, mobile menu), footer,
      skip link, breadcrumbs, cookie notice, sticky mobile action bar
- [x] Pages: Home, About, Operations, Projects (filters), Project detail (facts, gallery,
      map), Sustainability, News, Article, Careers, Job (PDF CV upload), Contact (form + map),
      Privacy, Terms, Cookies, 404
- [x] Data layer: API first, local fallback content until Phase 4
- [x] SEO: titles, descriptions, canonical, Open Graph, JSON-LD (Organization, LocalBusiness,
      BreadcrumbList, Article, JobPosting), 19 prerendered pages, sitemap.xml, robots.txt
- [x] Images: Niraum field photos as AVIF/WebP/JPEG at 3 sizes, lazy loading
- [x] Tests: 15 unit tests (Vitest) and e2e (Playwright) for home, theme, contact, 404
- [x] Fixes: hydration-safe motion hooks, nginx real 404, ad-blocker-safe file names

### Phase 4 — completed tasks

- [x] Zod-validated env (crashes on missing values; production demands real secrets/services)
- [x] MongoDB with connection retry and graceful shutdown; 13 models with indexes, unique
      slugs, text search, soft delete
- [x] Auth: argon2id, lockout after 5 failures (15 min), 15 min / 7 day JWTs in httpOnly
      Secure SameSite=Strict cookies, refresh rotation, logout everywhere, forgot/reset with
      single-use 30 min tokens, forced password change for the seeded superadmin
- [x] Roles: editor (content) · admin (+ settings, inbox, audit) · superadmin (+ users)
- [x] Site settings with Nominatim geocoding (1 req/s, 30-day cache, manual pin override,
      warning instead of a wrong pin), ETag + 60 s cache on the public projection
- [x] Projects, posts, jobs, team, services: public + admin CRUD, filters, search, pagination,
      HTML sanitising, audit log, debounced frontend rebuild hook
- [x] Media library on Cloudinary (magic-byte checks, per-type size limits)
- [x] Contact (honeypot, Turnstile/reCAPTCHA, 5/hour, inbox email + auto-reply), job
      applications (private CV storage), double opt-in newsletter
- [x] `GET /seo/sitemap-data`, OpenAPI at `/api/docs` (dev), [API reference](docs/API.md)
- [x] 110 backend tests (Vitest + Supertest + in-memory MongoDB); services 99 %, controllers
      100 % line coverage
- [x] `pnpm seed` loads sample services, projects and posts into a fresh database
- [x] Turnstile captcha widget on the contact and job-application forms
- [x] Build prerenders admin-published projects, articles and jobs (from `/seo/sitemap-data`)

### Phase 4.5 — real content, bilingual, inquiries

Prompt: [`docs/content/PHASE_4.5_CONTENT_INTEGRATION_PROMPT.md`](docs/content/PHASE_4.5_CONTENT_INTEGRATION_PROMPT.md).

- [x] Master blueprint, assay data (JSON + CSV), report images and logos added to the repo
- [x] Real imagery + logo on the site, favicons regenerated
- [x] English / नेपाली (`/en`, `/ne`, hreflang, Mukta) + LocalizedString migration
- [x] Product, Deposit, AssaySample, AssaySummary, Inquiry models, API and seeds
- [x] Our Project, Products, Technical Data, Investors pages; Bulk Supply Inquiry form
- [x] Tests: 130 backend + 30 frontend unit, 10 e2e (assay averages, i18n, inquiry, migration)
- [~] Lighthouse: desktop 92–94 performance and 100 a11y / best practices / SEO on `/en` and
  `/ne`; mobile performance ≈ 70 — see SKILLS.md §8

### Waiting on Niraum Metals

- [ ] Official logo files (site shows a text wordmark and a temporary "N" favicon)
- [ ] Phone, email, WhatsApp, office hours, social links, exact office location
- [ ] Founding year, licences, registration numbers, leadership, real projects and figures
- [ ] Hero video and more site photography
- [ ] Legal review of the Privacy, Terms and Cookie pages
- [ ] Phase 4.5 confirm list: one legal name, Katujpani lease holder and credit, public phone,
      WGS-84 mine pin, land figures, product sizes/minimum order/delivery, permission to publish
      sample-level assay data, consent for people in field photos, original photos + founder
      portrait, EIA/IEE commitments, Nepali review

Every unknown is shown on the site as `[PLACEHOLDER: …]`; full list in SKILLS.md §11.

## Stack

| Layer     | Technology                                                                                                                                                                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend  | React 18, Vite 6, TypeScript, React Router 6, Tailwind CSS 3, shadcn/ui (Radix), Framer Motion, GSAP + ScrollTrigger, Lenis, TanStack Query, React Hook Form + Zod, react-helmet-async, Leaflet / react-leaflet (OpenStreetMap), lucide-react, Manrope Variable |
| Rendering | Public routes prerendered at build time with `vite-react-ssg`; `/admin` client-rendered                                                                                                                                                                         |
| Backend   | Node 20, Express 4, TypeScript, Mongoose 8 (MongoDB Atlas), Zod, argon2, JWT (httpOnly cookies), helmet, cors, express-rate-limit, hpp, express-mongo-sanitize, multer + Cloudinary, Nodemailer / Resend, pino, Nominatim, zod-to-openapi                       |
| Tooling   | pnpm workspaces, ESLint 10 (flat) + Prettier, Husky + lint-staged, Commitlint, Vitest + RTL, Supertest, Playwright, Docker + Compose, GitHub Actions                                                                                                            |

## Quick start

Requirements: Node 20 LTS (`.nvmrc`), pnpm ≥ 9 (`corepack enable`), Docker.

```bash
pnpm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
pnpm db:up          # MongoDB on :27017, Mailpit (dev inbox) on http://localhost:8025
pnpm seed           # migrations + admin, settings, samples, Katujpani deposit/product/founder, assay data
pnpm dev            # web http://localhost:5173/en (or /ne) · API http://localhost:4000/api/v1/health
```

The website runs without the API: each page falls back to local content in
`frontend/src/content/` until the backend serves it. To see only the site, `pnpm dev:fe` is enough.

To check the production build (prerendered HTML, as deployed):

```bash
pnpm build
pnpm --filter frontend preview   # http://localhost:4173
```

Other commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`,
`pnpm --filter backend migrate` (idempotent LocalizedString migration),
`docker compose --profile app up --build` (whole stack at http://localhost:8080).

### Which command to run

| From         | Command       | Starts                                               |
| ------------ | ------------- | ---------------------------------------------------- |
| `E:\October` | `pnpm dev:fe` | website only — enough until Phase 4                  |
| `E:\October` | `pnpm dev`    | website + API (API needs `backend/.env` and MongoDB) |
| `frontend/`  | `pnpm dev`    | website only                                         |

## Troubleshooting

- **Blank page in dev, console says `main.tsx` failed to load** — an ad/cookie blocker
  extension is blocking a source file by name. Source file names must not contain `cookie`,
  `consent`, `banner`, `social`, `ads`, `track` or `analytics`. Test in an InPrivate window.
- **Red `500` errors for `/api/v1/...` in the browser console** — expected until the backend
  is built; pages fall back to local content.
- **`JWT_ACCESS_SECRET: Required` in the terminal** — the backend has no `.env`. Copy
  `backend/.env.example` to `backend/.env`, or run `pnpm dev:fe` for the website only.
- **Page looks outdated after installing packages** — stop the dev server, start it again and
  hard-reload the browser (Ctrl+Shift+R).

## Content and data

- All copy and numbers come from `docs/content/NIRAUM_MASTER_BLUEPRINT.md`; image placement is in
  `docs/content/manifest.json`.
- Assay data: `docs/content/data/assay_data.json` (+ CSV copies). Phase 4.5 seeds it into
  `AssaySample` / `AssaySummary`, and a unit test re-checks the weighted averages
  (Fe 23.48 % · Fe₂O₃ 33.59 % · SiO₂ 53.05 %).
- Data credit: Shubharambha Mining and Engineering Services Pvt. Ltd., mine scheme under DMG
  guidelines. Figures are indicative of the sampled zones, not a JORC/NI 43-101 reserve statement.
- Never describe the ore as "high-grade".
- Site imagery (WebP) is in `frontend/src/assets/site/{photos,maps,brand}`; high-quality JPG
  originals and report table scans are in `design-assets/` (not shipped).

## Pages

All under `/en/…` and `/ne/…` (`/` redirects to the saved or browser language). Phase 4.5:
Our Project (Katujpani) · Products · Technical Data · Investors · Contact with the Bulk Supply
Inquiry. Also: Home · About · Operations · Projects (filters) · Project detail (facts, gallery, map) ·
Sustainability & Safety · News · Article · Careers · Job (apply with PDF CV) · Contact (form + map)
· Privacy / Terms / Cookies · 404. Light and dark themes, preloader, page transitions,
scroll-reveal, pinned project gallery, reduced-motion support, sitemap and JSON-LD.

## Repository

```
frontend/   React app — public site (prerendered) + /admin CMS
backend/    Express REST API (/api/v1)
docs/       ARCHITECTURE · API · SECURITY · DEPLOYMENT · adr/ · content/ (blueprint + assay data)
design-assets/  high-quality image originals + report table scans (not shipped)
.github/    CI and deploy workflows
SKILLS.md   progress tracker + playbook (status, recipes, brand tokens, placeholders)
CLAUDE.md   rules for AI coding sessions (read SKILLS.md first, facts from the blueprint only)
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — component diagram, data models, request flows, NFRs
- [API](docs/API.md) · [Security](docs/SECURITY.md) · [Deployment](docs/DEPLOYMENT.md)
- [Decision records](docs/adr/README.md)
- [SKILLS.md](SKILLS.md) — how to add pages, endpoints, motion; brand rules

## Brand

Charcoal `#2B2F36` · Graphite `#14171C` · Copper `#B8754A` · Copper light `#DDA27C` ·
Copper deep `#8A5236` · Silver `#C9CDD3` · Off-white `#F6F4F1` · Rule `#C27A44`.
Typeface: Manrope (Mukta for Nepali from Phase 4.5). Logo: supplied files only
(`frontend/src/assets/site/brand/`) — never redrawn or recoloured.

Unknown company facts (founding year, licences, site names, tonnage, staff count, contact
details, social links, registration numbers) are kept as visible `[PLACEHOLDER: …]` values
until confirmed — see ARCHITECTURE.md §11 and SKILLS.md §11. Demo projects and articles carry a
"Sample" badge. The site photos are Niraum's own field photographs (`Assets/`). Report photos, maps and data:
© Niraum Metals / Shubharambha Mining and Engineering Services, used with permission.

## Licence

Proprietary — © Niraum Metals Pvt. Ltd. All rights reserved. See [LICENSE](LICENSE).
