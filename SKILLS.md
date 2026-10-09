<<<<<<< HEAD
# Niraum Metals — SKILLS & Progress Tracker

> **Read this file first in every session.** It is the single source of truth for what exists, how things are done, and what comes next. Update it at the end of every phase and every working session.

---

## 1. Project snapshot

| Item | Value |
| --- | --- |
| Company | Niraum Metals Pvt. Ltd. *(confirm legal name — letterhead footer says "Limited")* |
| Motto | Strength Forged For Generations |
| Address | Lalitpur-13, Nepal |
| Purpose | Corporate website for a Nepal mining & metals company (iron ore, metal minerals, stone & aggregates) with an admin panel |
| Design reference | https://gmining.com (feel only: preloader, page transitions, hover reveals, scroll storytelling) |
| Frontend | React 18 + Vite + TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, GSAP + ScrollTrigger, Lenis, TanStack Query, React Hook Form + Zod, react-helmet-async, Leaflet |
| Backend | Node 20 + Express 4 + TypeScript, Mongoose 8 (MongoDB Atlas), Zod, argon2, JWT (httpOnly cookies), Cloudinary, Nodemailer/Resend, Nominatim geocoding |
| Tooling | pnpm workspaces, ESLint, Prettier, Husky, Commitlint, Vitest, Supertest, Playwright, Docker, GitHub Actions |
| Hosting | Frontend → Vercel · API → Render · DB → MongoDB Atlas (Mumbai) · Media → Cloudinary · DNS → Cloudflare |
| Live URLs | Production: `TBD` · Staging: `TBD` · API: `TBD` · Admin: `TBD/admin` |

---

## 2. Brand tokens (never change without approval)

| Token | Hex | Use |
| --- | --- | --- |
| Charcoal | `#2B2F36` | Primary text, structure |
| Graphite | `#14171C` | Dark-mode background |
| Copper | `#B8754A` | CTAs, links, active states, key numbers |
| Copper light | `#DDA27C` | Highlights, gradient mid |
| Copper deep | `#8A5236` | Shadows, gradient start |
| Copper gradient | `linear-gradient(135deg, #8A5236 0%, #DDA27C 50%, #A9663F 100%)` | Buttons, preloader, gradient text |
| Silver | `#C9CDD3` | Secondary lines, icons |
| Off-white | `#F6F4F1` | Light-mode background |
| Rule line | `#C27A44` | Dividers |

- **Font:** Manrope Variable only (`@fontsource-variable/manrope`). H1 800 · H2 700 · H3 600 · body 400 · labels 500 uppercase, 0.12em tracking.
- **Glass panel:** dark `rgba(20,23,28,0.45)` / light `rgba(255,255,255,0.55)`, `backdrop-blur` 18–24px, 1px border `rgba(221,162,124,0.25)`, radius 20px. Fallback: solid 92% opacity when `backdrop-filter` is unsupported.
- **Text on images:** always a gradient overlay (`from-black/70 via-black/40 to-transparent`) in both themes; contrast ≥ 4.5:1.
- **Logo:** use supplied files only (light + dark versions). Never redraw or recolour.

---

## 3. Conventions

### Code
- TypeScript strict, no `any`. Named exports for components. One component per file.
- Files: `PascalCase.tsx` for components, `camelCase.ts` for utils/hooks, `kebab-case` for routes/slugs.
- Styling: Tailwind utilities + tokens from `src/styles/globals.css`. No hard-coded hex in components.
- Motion: only animate `transform` and `opacity`. Every animated component respects `prefers-reduced-motion`.
- Data fetching: TanStack Query hooks live in `src/features/<feature>/api.ts`.
- Validation: Zod schemas in `backend/src/validators/`; mirror types on the frontend in `src/features/<feature>/types.ts`.

### Git
- Branches: `main` (production) · `develop` (staging) · `feature/<short-name>` · `fix/<short-name>`.
- Commits: Conventional Commits — `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`, `ci:`.
- Every PR into `develop` needs green CI and one review.

### How to add a public page
1. Create `frontend/src/pages/public/<Name>.tsx` with `<Seo>` (title ≤ 60 chars, description ≤ 155) and JSON-LD.
2. Structure: `<main>` → `<section id aria-labelledby>` → `.container` → one H2 per section; one H1 per page.
3. Register the route in `src/app/router.tsx` and add it to the prerender list + sitemap.
4. Add nav/footer links if needed. Add a Playwright smoke test.
5. Update the File map below.

### How to add an API resource
1. Model → `backend/src/models/<Name>.ts` (timestamps, indexes, slug if public).
2. Zod schema → `validators/<name>.ts`.
3. Service → controller → route (`routes/<name>.routes.ts`), mount under `/api/v1`.
4. Guard admin routes with `requireAuth` + `requireRole(...)`; write AuditLog on mutations.
5. Tests with Supertest; update `docs/API.md` and the OpenAPI spec.

### How to add an admin manager
1. Page in `frontend/src/pages/admin/<Name>.tsx` using the shared data-table + form pattern.
2. Add to role-aware sidebar config. Add Playwright test for create → publish.

---

## 4. File map (keep current)

```
niraum-metals/
├─ frontend/
│  ├─ public/                     favicons, robots.txt, og-image.jpg, logo files
│  ├─ src/
│  │  ├─ app/                     router.tsx, providers.tsx, App.tsx
│  │  ├─ pages/public/            Home, About, Operations, Projects, ProjectDetail,
│  │  │                           Sustainability, News, Article, Careers, Job,
│  │  │                           Contact, Legal, NotFound
│  │  ├─ pages/admin/             Login, Dashboard, Settings, Projects, News, Jobs,
│  │  │                           Team, Media, Messages, Users, AuditLog
│  │  ├─ components/ui/           shadcn/ui primitives
│  │  ├─ components/layout/       Navbar, Footer, AdminShell
│  │  ├─ components/sections/     Hero, Stats, Services, ProjectGallery, Timeline,
│  │  │                           NewsGrid, LogoMarquee, CtaBand, ContactForm, MapCard
│  │  ├─ components/motion/       Preloader, PageTransition, Reveal, Parallax,
│  │  │                           CountUp, MagneticButton
│  │  ├─ components/seo/          Seo, JsonLd
│  │  ├─ features/                settings, projects, news, jobs, contact (hooks + types)
│  │  ├─ lib/                     api.ts, utils.ts, motion.ts, seo.ts
│  │  ├─ styles/                  globals.css, glass.css, textures.css
│  │  └─ assets/                  images, video posters, textures, CREDITS.md
│  ├─ tests/  e2e/  .env.example  vite.config.ts  tailwind.config.ts  Dockerfile
├─ backend/
│  ├─ src/
│  │  ├─ config/                  env.ts, db.ts, cloudinary.ts, mailer.ts, logger.ts
│  │  ├─ models/                  User, SiteSettings, Project, Post, Job, Application,
│  │  │                           TeamMember, Service, Message, Media, AuditLog
│  │  ├─ routes/  controllers/  services/
│  │  ├─ middlewares/             auth, requireRole, validate, rateLimit, upload,
│  │  │                           errorHandler
│  │  ├─ validators/  utils/  jobs/  seed/
│  │  ├─ app.ts  server.ts
│  ├─ tests/  .env.example  Dockerfile
├─ docs/                          ARCHITECTURE.md, API.md, SECURITY.md,
│                                 DEPLOYMENT.md, adr/
├─ .github/workflows/             ci.yml, deploy-frontend.yml, deploy-backend.yml
├─ docker-compose.yml  SKILLS.md  README.md  CHANGELOG.md  LICENSE
```

---

## 5. Phase checklist

- [ ] **Phase 1 — Design (Google Stitch):** all screens, light + dark, desktop + tablet + mobile, component sheet, style guide
- [ ] **Phase 2 — Architecture:** monorepo skeleton, configs, docker-compose, ARCHITECTURE.md
- [ ] **Phase 3 — Frontend:** tokens, theme, shadcn, motion system, all public pages, SEO, responsive, tests
- [ ] **Phase 4 — Backend:** env, models, auth, settings + geocoding, CRUD, media, contact, tests, OpenAPI
- [ ] **Phase 5 — Admin panel:** login, shell, dashboard, settings (address/map, social toggles), managers, media, inbox, users, audit
- [ ] **Phase 6 — Security:** OWASP review, headers, rate limits, CSRF, 2FA, SECURITY.md, ZAP scan
- [ ] **Phase 7 — CI/CD + Deploy:** workflows, Docker, staging + production, domain, DEPLOYMENT.md, rollback runbook
- [ ] **Phase 8 — Docs + QA:** README, SKILLS, CREDITS, final QA checklist passed

---

## 6. Feature status

| Feature | Area | Status | Key files | Tests |
| --- | --- | --- | --- | --- |
| Preloader + page transitions | Frontend | Not started | `components/motion/*` | — |
| Light/dark theme | Frontend | Not started | `app/providers.tsx`, `ThemeToggle` | — |
| Navbar (glass, sticky, mobile sheet) | Frontend | Not started | `components/layout/Navbar.tsx` | — |
| Home sections | Frontend | Not started | `pages/public/Home.tsx` | — |
| Projects list + detail + map | Frontend | Not started | `pages/public/Projects*.tsx` | — |
| Contact form + map + socials | Frontend | Not started | `ContactForm.tsx`, `MapCard.tsx` | — |
| Footer (logo, links, socials) | Frontend | Not started | `components/layout/Footer.tsx` | — |
| SEO (meta, JSON-LD, sitemap, prerender) | Frontend | Not started | `components/seo/*` | — |
| Auth (login, refresh, lockout, reset) | Backend | Not started | `routes/auth.*` | — |
| Site settings + geocoding | Backend | Not started | `models/SiteSettings.ts`, `services/geocode.ts` | — |
| Content CRUD | Backend | Not started | `routes/*` | — |
| Media upload (Cloudinary) | Backend | Not started | `middlewares/upload.ts` | — |
| Admin settings (address/map, social toggles) | Admin | Not started | `pages/admin/Settings.tsx` | — |
| Admin content managers | Admin | Not started | `pages/admin/*` | — |
| CI pipeline | DevOps | Not started | `.github/workflows/ci.yml` | — |
| Deployments | DevOps | Not started | `deploy-*.yml` | — |

Status values: Not started · In progress · Review · Done · Blocked

---

## 7. Session log (newest first)

| Date | What changed | Files touched | Open issues |
| --- | --- | --- | --- |
| YYYY-MM-DD | Project initialised; SKILLS.md created | `SKILLS.md` | Confirm legal name |

---

## 8. Known issues / tech debt

- Legal name inconsistency: "Pvt. Ltd." vs "Limited" — must be resolved before launch.
- Render free tier sleeps when idle — move to a paid instance for production.

---

## 9. Next steps (top 5, in order)

1. Run Phase 1 in Google Stitch and export designs.
2. Run Phase 2 to create the monorepo skeleton.
3. Collect real business facts (founding year, licences, sites, phone, email, social URLs).
4. Gather free media (Pexels, Unsplash, Pixabay, Mixkit, Coverr) and log in `CREDITS.md`.
5. Register domain and create Vercel, Render, MongoDB Atlas, Cloudinary accounts.

---

## 10. Environment variables (never commit real values)

### Backend (`backend/.env`)
| Name | Purpose | Example |
| --- | --- | --- |
| `NODE_ENV` | Runtime mode | `development` |
| `PORT` | API port | `5000` |
| `MONGODB_URI` | Atlas connection string | `mongodb+srv://user:***@cluster/niraum` |
| `JWT_ACCESS_SECRET` | Access token signing | 64-char random string |
| `JWT_REFRESH_SECRET` | Refresh token signing | 64-char random string |
| `CLIENT_URL` | CORS allowlist (site) | `http://localhost:5173` |
| `ADMIN_URL` | CORS allowlist (admin) | `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Media storage | — |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` or `RESEND_API_KEY` | Email | — |
| `CONTACT_INBOX` | Where contact emails go | `info@<domain>` |
| `NOMINATIM_USER_AGENT` | Geocoding identity | `NiraumMetalsSite/1.0 (info@<domain>)` |
| `TURNSTILE_SECRET` | Spam protection | — |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | First superadmin | — |
| `FRONTEND_DEPLOY_HOOK` | Rebuild site on publish | Vercel deploy hook URL |
| `LOG_LEVEL` | Logging | `info` |

### Frontend (`frontend/.env`)
| Name | Purpose | Example |
| --- | --- | --- |
| `VITE_API_URL` | API base URL | `http://localhost:5000/api/v1` |
| `VITE_SITE_URL` | Canonical base URL | `https://www.<domain>` |
| `VITE_TURNSTILE_SITE_KEY` | Spam protection | — |

---

## 11. Placeholders still to replace

- [ ] Founding year, company history, milestones
- [ ] Licences and registration numbers
- [ ] Operation/site names, locations, minerals, capacities
- [ ] Leadership names, roles, photos
- [ ] Phone, email, WhatsApp, office hours
- [ ] Social media URLs (set in Admin → Settings → Social Media)
- [ ] Exact office pin (Admin → Settings → Address & Map)
- [ ] Privacy Policy, Terms of Use, Cookie Policy text (legal review)
- [ ] Stock photos/videos → real Niraum site media

---

## 12. Definition of done (every feature)

- [ ] Matches Stitch design in light and dark at 360 / 768 / 1280 px
- [ ] Keyboard accessible, focus visible, reduced motion respected
- [ ] Unit/e2e tests added and passing in CI
- [ ] No console errors; Lighthouse not regressed
- [ ] SKILLS.md (status, file map, session log) and README updated
=======
# SKILLS.md — how to work in this repo

Practical playbook for contributors and AI coding agents. Read with
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). If something here conflicts with an ADR, the ADR wins.

## 1. Ground rules

- **Stack is fixed** (see README). Don't add or swap frameworks without an ADR.
- **Never invent company facts.** Founding year, licences, site names, tonnage, staff count,
  phone, email, social links and registration numbers stay as `[PLACEHOLDER: …]` until the client
  confirms them. Add new ones to the register in ARCHITECTURE.md §11.
- **Logo:** use the supplied files in `frontend/public/logo/`. Never redraw, recolour or re-letter.
- **Tone of copy:** solid, trustworthy, engineering-led. Short confident sentences. No hype.
- Conventional Commits (`feat(frontend): …`, `fix(api): …`); hooks enforce lint, format and
  message format.

## 2. Brand tokens (exact values)

| Token           | Hex                                                              | Tailwind                                      | Use                                   |
| --------------- | ---------------------------------------------------------------- | --------------------------------------------- | ------------------------------------- |
| Charcoal        | `#2B2F36`                                                        | `charcoal`                                    | text, structure                       |
| Graphite        | `#14171C`                                                        | `graphite`                                    | dark background                       |
| Copper          | `#B8754A`                                                        | `copper` / `primary`                          | CTAs, active, links, key numbers only |
| Copper light    | `#DDA27C`                                                        | `copper-light`                                | highlights, dark-mode links           |
| Copper deep     | `#8A5236`                                                        | `copper-deep`                                 | shadows, light-mode link text         |
| Silver          | `#C9CDD3`                                                        | `silver`                                      | secondary lines, icons                |
| Off-white       | `#F6F4F1`                                                        | `offwhite`                                    | light background                      |
| Rule            | `#C27A44`                                                        | `rule`                                        | letterhead / divider line             |
| Copper gradient | `linear-gradient(135deg, #8A5236 0%, #DDA27C 50%, #A9663F 100%)` | `bg-copper-gradient`, `.text-copper-gradient` | wordmark "N", accents                 |

- Text on copper = graphite (never white — fails contrast).
- Use semantic classes (`bg-background`, `text-foreground`, `text-muted-foreground`, `border`)
  in components so both themes work; raw brand colours only for brand moments.
- Type: Manrope only. `h1` 800, `h2` 700, `h3` 600, body 400, `.label` 500 uppercase 0.12em.
- Surfaces: `.glass`, `.glass-copper`, `.copper-glow`, `.texture-brushed`, `.texture-grain`.

## 3. Recipes

### Add a public page

1. `frontend/src/pages/public/<Name>.tsx`, default export, include `<Seo …/>`.
2. Register a `lazy` route in `src/app/router.tsx`. Dynamic? add `getStaticPaths` + `loader`.
3. SSR-safe: no `window`/`document` during render — use effects.
4. Add a Vitest render test and, for key journeys, a Playwright spec in `frontend/e2e/`.

### Add a shadcn/ui component

`pnpm --filter frontend dlx shadcn@latest add <component>` → lands in `src/components/ui/`
(excluded from lint, keep edits minimal).

### Add an API resource

1. Model in `backend/src/models/<Name>.ts` (timestamps, indexes, `toJSON` transform).
2. Zod schemas in `validators/<name>.ts` (`create`, `update`, `listQuery`).
3. Service (business logic, audit log, rebuild trigger) → controller (envelope) → route
   (`auth`, `requireRole`, `validate`).
4. Mount in `app.ts` under `/api/v1`.
5. Mirror the schema in `frontend/src/features/<name>/schema.ts` and add Query hooks in `api.ts`.
6. Supertest tests for happy path, validation error, auth/role denial. Document in `docs/API.md`.

### Motion

- Page/element enter: Framer Motion with presets from `lib/motion.ts`.
- Scroll-scrubbed or pinned: GSAP ScrollTrigger inside `gsap.context()` in `useLayoutEffect`,
  revert on unmount. Lenis drives ScrollTrigger updates.
- Animate `transform`/`opacity` only. Always honour `prefers-reduced-motion`.

### Performance checklist (every PR touching public pages)

- Images: explicit `width`/`height`, Cloudinary `f_auto,q_auto`, `srcset`, `loading="lazy"`
  except the LCP image (`fetchpriority="high"`).
- New dependency? Check bundle impact and load it only on the route that needs it.
- Run `pnpm build && pnpm --filter frontend preview` and Lighthouse mobile (target ≥ 90).

## 4. Commands

| Task               | Command                                                |
| ------------------ | ------------------------------------------------------ |
| Install            | `pnpm install`                                         |
| DB + mail (Docker) | `pnpm db:up` (Mongo :27017, Mailpit UI :8025)          |
| Dev (both)         | `pnpm dev` (web :5173, API :4000)                      |
| Lint / format      | `pnpm lint` · `pnpm format`                            |
| Typecheck          | `pnpm typecheck`                                       |
| Unit tests         | `pnpm test`                                            |
| E2E                | `pnpm test:e2e`                                        |
| Build (prerender)  | `pnpm build`                                           |
| Full stack Docker  | `docker compose --profile app up --build` (site :8080) |

## 5. Definition of done

Lint, typecheck, unit tests and build pass; new endpoints documented; no invented facts;
both themes checked; keyboard and screen-reader basics checked; mobile 320 px checked.
>>>>>>> 94c13ad5384f40c29dc64182ab75618d0097644b
