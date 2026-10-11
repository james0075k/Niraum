# Niraum Metals — Architecture

> Status: **v0.1 skeleton** · Owner: engineering · Last updated: 2026-10-10 (§13 adds the
> planned Phase 4.5 changes: real content, bilingual EN/NE, bulk inquiries, assay data)
>
> This document describes how the Niraum Metals website and admin CMS are built and how a request
> moves through the system. Decisions that were contested or are hard to reverse are recorded as
> ADRs in [`docs/adr/`](./adr). API details live in [API.md](./API.md), threat model and controls
> in [SECURITY.md](./SECURITY.md), environments in [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 1. Context

Niraum Metals Pvt. Ltd. (Lalitpur-13, Nepal) supplies iron ore, metal minerals and stone/aggregate.
The site serves five audiences: construction companies, steel and cement plants, government and
infrastructure buyers, investors, job seekers and local communities.

The system has two faces:

| Face        | Users                                | Rendering                                    | Priority                     |
| ----------- | ------------------------------------ | -------------------------------------------- | ---------------------------- |
| Public site | Everyone (mostly mobile, NP/SA)      | Prerendered static HTML, hydrated with React | Speed, SEO, motion, trust    |
| Admin CMS   | 1–10 staff (superadmin/admin/editor) | Client-rendered SPA under `/admin`           | Correctness, security, audit |

Both are served by one React app and one REST API backed by MongoDB Atlas.

**Design reference:** gmining.com — branded preloader, smooth page transitions, hover reveals on
project cards, scroll-driven storytelling, large project views. We copy the feel, not the content.

---

## 2. Repository layout

pnpm workspace, two packages (`frontend`, `backend`). Shared lint/format/TS settings at the root.

```
niraum-metals/
├─ frontend/                 React 18 + Vite + TS (public site + /admin)
│  ├─ public/                favicons, robots.txt, og-image.jpg, logo/ (supplied files)
│  ├─ src/
│  │  ├─ app/                router.tsx (route table), providers.tsx, App.tsx (root layout)
│  │  ├─ pages/public/       Home, About, Operations, Projects, ProjectDetail, Sustainability,
│  │  │                      News, Article, Careers, Job, Contact, Legal, NotFound
│  │  ├─ pages/admin/        Login, Dashboard, Settings, Projects, News, Jobs, Team, Media,
│  │  │                      Messages, Users
│  │  ├─ components/
│  │  │  ├─ ui/              shadcn/ui primitives (generated, not linted)
│  │  │  ├─ layout/          Navbar, Footer, AdminShell
│  │  │  ├─ sections/        Hero, Stats, Services, ProjectGallery, Timeline, NewsGrid,
│  │  │  │                   LogoMarquee, CtaBand, ContactForm, MapCard
│  │  │  ├─ motion/          Reveal, Parallax, CountUp, PageTransition, Preloader, MagneticButton
│  │  │  └─ seo/             Seo, JsonLd
│  │  ├─ features/<domain>/  api.ts (TanStack Query hooks), types.ts, schema.ts (Zod)
│  │  ├─ lib/                api.ts (axios), utils.ts (cn), motion.ts, seo.ts, theme.tsx
│  │  ├─ styles/             globals.css (tokens), glass.css, textures.css
│  │  └─ assets/             images, video posters, textures
│  ├─ tests/ (Vitest + RTL)  e2e/ (Playwright)
├─ backend/                  Node 20 + Express 4 + TS + Mongoose 8
│  └─ src/
│     ├─ config/             env.ts (Zod), db.ts, logger.ts, cloudinary.ts, mailer.ts
│     ├─ routes/ → middlewares/ → controllers/ → services/ → models/
│     ├─ validators/         Zod request schemas (same shapes as frontend types)
│     ├─ utils/  jobs/ (sitemap, rebuild hook)  seed/ (first admin + demo data)
│     ├─ app.ts (createApp, no I/O)  server.ts (DB connect + listen + graceful shutdown)
├─ docs/                     ARCHITECTURE, API, SECURITY, DEPLOYMENT, adr/
├─ .github/workflows/        ci.yml, deploy-frontend.yml, deploy-backend.yml
└─ docker-compose.yml        mongo + mailpit (dev); `--profile app` adds backend + frontend
```

---

## 3. Component diagram

```mermaid
flowchart LR
  subgraph Client["Browser (Chrome · Safari · Firefox · Edge · Samsung Internet)"]
    direction TB
    PUB["Public pages<br/>prerendered HTML + hydration"]
    ADM["Admin SPA<br/>/admin/* (client-only)"]
    RQ["TanStack Query cache"]
    MOT["Motion layer<br/>Lenis · GSAP ScrollTrigger · Framer Motion"]
    MAP["Leaflet map<br/>(lazy)"]
    PUB --> RQ
    ADM --> RQ
    PUB --- MOT
    PUB --- MAP
  end

  subgraph Edge["Static host / CDN + reverse proxy"]
    HTML["dist/** (HTML, hashed JS/CSS, fonts)"]
    PROXY["/api/* → API"]
  end

  subgraph API["Express API (Node 20)"]
    direction TB
    MW["helmet · cors · rate-limit · hpp · mongo-sanitize · pino-http"]
    RT["routes /api/v1"]
    AUTH["auth · requireRole · validate(Zod)"]
    CTL["controllers"]
    SVC["services"]
    MDL["Mongoose models"]
    JOBS["jobs: sitemap · rebuild hook"]
    MW --> RT --> AUTH --> CTL --> SVC --> MDL
    SVC --> JOBS
  end

  DB[("MongoDB Atlas")]
  CDN[("Cloudinary<br/>media")]
  SMTP[("SMTP<br/>Nodemailer")]
  OSM[("Nominatim<br/>geocoding")]
  TILES[("OSM tiles")]
  BUILD["CI prerender<br/>vite-react-ssg"]

  Client -->|"GET pages"| HTML
  RQ -->|"XHR JSON, cookies"| PROXY --> MW
  MDL --> DB
  SVC --> CDN
  SVC --> SMTP
  SVC --> OSM
  MAP --> TILES
  ADM -.->|"direct upload URL"| CDN
  JOBS -.->|"deploy hook"| BUILD
  BUILD -->|"GET public data"| RT
  BUILD --> HTML
```

**Key boundaries**

- The **frontend never talks to MongoDB, Cloudinary secrets or SMTP**. Everything goes through
  `/api/v1`.
- The API is reachable **same-site** as the website (path `/api` behind the same proxy, or an
  `api.` subdomain of the same registrable domain) so `SameSite=Strict` auth cookies work. See
  [ADR-0003](./adr/0003-auth-httponly-cookies.md).
- `app.ts` builds the Express app with no I/O, so Supertest imports it directly; `server.ts` owns
  the DB connection and the port.

---

## 4. Frontend

### 4.1 Rendering

| Route group | Strategy                                                                                                                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public      | **Prerendered** at build by `vite-react-ssg` ([ADR-0002](./adr/0002-prerender-vite-react-ssg.md)), hydrated on load. Dynamic routes (`/projects/:slug`, `/news/:slug`, `/careers/:slug`) are expanded by each route's `getStaticPaths()` which calls the public API (`SSG_API_URL`). |
| `/admin/*`  | **Client-only**, excluded from prerender (`ssgOptions.includedRoutes`), lazy-loaded chunk, `noindex`.                                                                                                                                                                                |

Prerendered pages embed their API data (route `loader` → static loader data). On hydration the
same data seeds TanStack Query (`initialData`), which revalidates in the background, so content
edited in the CMS shows up immediately for live visitors and in the HTML after the next rebuild.

**Freshness loop:** publishing or unpublishing content calls the debounced rebuild hook
(`REBUILD_HOOK_URL`, default 120 s), which re-runs the prerender in CI/the host.

### 4.2 Route map

| Path                                                             | Page           | Data                                                |
| ---------------------------------------------------------------- | -------------- | --------------------------------------------------- |
| `/`                                                              | Home           | settings, services, featured projects, latest posts |
| `/about`                                                         | About          | settings, team                                      |
| `/operations`                                                    | Operations     | services                                            |
| `/projects`                                                      | Projects       | projects (paginated, filter by mineral/status)      |
| `/projects/:slug`                                                | ProjectDetail  | project                                             |
| `/sustainability`                                                | Sustainability | static content + settings                           |
| `/news`, `/news/:slug`                                           | News, Article  | posts                                               |
| `/careers`, `/careers/:slug`                                     | Careers, Job   | jobs; POST applications                             |
| `/contact`                                                       | Contact        | settings (address, map); POST contact               |
| `/legal/:page`                                                   | Legal          | privacy, terms, cookies                             |
| `*`                                                              | NotFound       | — (`noindex`)                                       |
| `/admin/login`                                                   | Login          | POST auth/login                                     |
| `/admin`                                                         | Dashboard      | counts, recent messages, audit                      |
| `/admin/{settings,projects,news,jobs,team,media,messages,users}` | CRUD screens   | admin endpoints                                     |

### 4.3 State and data

- **Server state:** TanStack Query only. One `features/<domain>/api.ts` per domain exports query
  keys and hooks (`useProjects`, `useProject(slug)`, `useUpdateProject`…). No global client store;
  UI state stays local.
- **HTTP:** `lib/api.ts` axios instance, `withCredentials: true`, single-flight refresh on 401
  (one `/auth/refresh` call, then replay).
- **Forms:** React Hook Form + `zodResolver`. Schemas in `features/<domain>/schema.ts` mirror
  `backend/src/validators` field-for-field; the API remains the authority.
- **Envelope types:** `ApiList<T> = { data: T[], meta }`, `ApiItem<T> = { data: T }`,
  `ApiErrorBody = { error: { code, message, details? } }`.

### 4.4 Design system

- **Tokens** in `styles/globals.css` as CSS variables, exposed to Tailwind (`tailwind.config.ts`)
  using the shadcn/ui contract (`--background`, `--primary`, …) plus raw brand colours
  (`charcoal`, `graphite`, `copper{,-light,-deep}`, `silver`, `offwhite`, `rule`).
- **Colour rules:** copper only for CTAs, active states, links and key numbers; charcoal for text
  and structure; silver for secondary lines and icons.
  _Accessibility:_ text on copper buttons is graphite (5.0 : 1), never white (3.6 : 1, fails AA);
  light-mode link text uses copper-deep (~6 : 1 on off-white).
- **Type:** Manrope Variable, self-hosted via `@fontsource-variable/manrope` (no Google Fonts
  request). H1 800 · H2 700 · H3 600 · body 400 · `.label` 500 uppercase 0.12em.
- **Themes:** light and dark are both first-class. `lib/theme.tsx` is a next-themes-style provider
  (`light | dark | system`, persisted under `niraum-theme`); an inline script in `index.html`
  sets the class before paint to avoid a flash.
- **Signature surfaces:** `.glass` / `.glass-copper` (backdrop blur ≤ 16 px with an opaque
  fallback), `.copper-glow`, `.texture-brushed`, `.texture-grain` (inline SVG noise, zero requests).
- **Logo:** supplied files only (`public/logo/`), never redrawn or recoloured.

### 4.5 Motion

| Concern             | Tool                 | Notes                                                                                                                          |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Smooth scroll       | Lenis                | One instance in the root layout; its RAF drives `ScrollTrigger.update`. Disabled for `prefers-reduced-motion` and in `/admin`. |
| Scroll storytelling | GSAP + ScrollTrigger | Pinned sections, scrubbed timelines, parallax. Created in `useLayoutEffect` with `gsap.context()` and reverted on unmount.     |
| Enter/exit, hovers  | Framer Motion        | `PageTransition` (AnimatePresence keyed by pathname), `Reveal`, project card hover reveals. Presets in `lib/motion.ts`.        |
| Preloader           | `motion/Preloader`   | First visit per session only, ≤ 1.2 s, never blocks LCP content in the HTML (overlay fades out on `load`).                     |

Rules: animate only `transform` and `opacity`; no motion library code runs during prerender
(guard `typeof window`); heavy animation modules load per-route.

### 4.6 SEO

- `components/seo/Seo` wraps `Head` from `vite-react-ssg` (react-helmet-async under the hood):
  title, description, canonical, Open Graph, Twitter card, `hreflang` when localised.
- `JsonLd`: `Organization` (site-wide), `BreadcrumbList`, `NewsArticle`, `JobPosting`, `Place`
  for projects.
- `sitemap.xml` is generated by the backend job from published content; `robots.txt` disallows
  `/admin`.

---

## 5. Backend

### 5.1 Layers

```
route ──► middlewares (auth → requireRole → validate) ──► controller ──► service ──► model
                                                          (HTTP only)   (business)  (Mongoose)
```

- **Routes** declare path, method and middleware chain only.
- **Controllers** translate HTTP ⇄ service calls and shape the `{ data, meta }` envelope.
- **Services** hold business rules (slug generation, publish/rebuild triggers, audit logging,
  email, geocoding). They never touch `req`/`res`.
- **Models** define schema, indexes and small instance helpers.
- **Validators** are Zod schemas for `body`, `query` and `params`. Controllers call
  `schema.parse(req.x)` themselves, so the parsed (stripped, coerced) value is fully typed;
  a `ZodError` becomes `400 VALIDATION_ERROR` in the error handler.

### 5.2 Middleware order (`app.ts`)

1. `trust proxy` (= `TRUST_PROXY`) so `req.ip` and rate limits see the real client.
2. `requestId` (keeps a well-formed incoming `X-Request-Id`, else a UUID; echoed in the
   response) → `pino-http` request logging with that id (health checks skipped; cookies,
   authorization, passwords and tokens redacted).
3. `helmet` with a strict API CSP (`default-src 'none'; frame-ancestors 'none'`); the HTML CSP
   is set at the static host. Swagger UI (`/api/docs`, non-production) gets its own CSP.
4. `cors` — allow-list `CLIENT_URL`, `ADMIN_URL` (+ `CORS_ORIGINS`), `credentials: true`; then
   `originCheck` refuses state-changing requests from other origins.
5. `compression`, `express.json({ limit: '1mb' })`, `urlencoded`, `cookie-parser`.
6. `express-mongo-sanitize` (strips `$`/`.` keys), `hpp` (parameter pollution).
7. `express-rate-limit`: global `/api` 300 / 15 min / IP; stricter per-route limits for
   `auth/login` (10 / 15 min), `auth/forgot` (5 / h), `contact`, `applications`, `newsletter`
   (5 / 10 min).
8. `/api/v1` routers → `notFound` → `errorHandler` (single error envelope).

### 5.3 API conventions

- Base path `/api/v1`, JSON only.
- Success: `{ data, meta? }`. Error: `{ error: { code, message, details? } }` with stable
  `code`s (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
  `RATE_LIMITED`, `INTERNAL`).
- Lists: `?page=1&limit=20` (`limit ≤ 50`), `?sort=-createdAt`, field filters
  (`?status=operating&mineral=iron-ore`), `?q=` text search where indexed.
  `meta = { page, limit, total, pages }`.
- Public endpoints return only `published`/`isOpen`/`isActive` documents and a public field
  projection (no internal IDs of users, no message metadata).
- Full endpoint list: [API.md](./API.md).

### 5.4 Roles

| Capability                                   | editor | admin | superadmin |
| -------------------------------------------- | :----: | :---: | :--------: |
| Projects, posts, jobs, team, services, media |   ✔    |   ✔   |     ✔      |
| Messages and applications                    |        |   ✔   |     ✔      |
| Site settings, geocode                       |        |   ✔   |     ✔      |
| Users (create, deactivate, change role)      |        |       |     ✔      |
| Audit log                                    |        |   ✔   |     ✔      |

`requireRole(...roles)` runs after `auth`. A superadmin cannot demote or deactivate the last
active superadmin.

---

## 6. Data models

All schemas use `{ timestamps: true }` (`createdAt`, `updatedAt`), `strict` mode and
`toJSON` transforms that drop `__v` and secret fields. `seo` is a shared sub-schema:
`{ title?, description?, ogImage?, noindex? }`.

### User

| Field               | Type                                             | Notes                                                               |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| name                | String, required                                 |                                                                     |
| email               | String, required, **unique**, lowercase, trimmed | index                                                               |
| passwordHash        | String, required, `select: false`                | argon2id                                                            |
| role                | `superadmin \| admin \| editor`                  | default `editor`                                                    |
| isActive            | Boolean                                          | default `true`                                                      |
| lastLoginAt         | Date                                             |                                                                     |
| failedLoginCount    | Number                                           | reset on success                                                    |
| lockUntil           | Date                                             | set after `LOGIN_MAX_ATTEMPTS`                                      |
| refreshTokenVersion | Number                                           | bumped on logout-all / password change → invalidates refresh tokens |

### SiteSettings (singleton)

| Field                         | Type                                                                | Notes                                                                                  |
| ----------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| companyName, legalName, motto | String                                                              | defaults "Niraum Metals", "Niraum Metals Pvt. Ltd.", "Strength Forged For Generations" |
| logo                          | `{ light, dark }` (Media URLs)                                      | supplied files                                                                         |
| contact                       | `{ phone: [String], email: [String], whatsapp }`                    | **placeholders** until confirmed                                                       |
| address                       | `{ line1, city, district, province, country, postalCode }`          | seed: Lalitpur-13, Lalitpur, Bagmati, Nepal                                            |
| location                      | `{ lat, lng, zoom, manualOverride }`                                | from `settings/geocode` unless `manualOverride`                                        |
| officeHours                   | String                                                              | placeholder                                                                            |
| social                        | `[{ platform, url, isActive, order }]`                              | platform ∈ facebook, instagram, linkedin, youtube, x, tiktok, whatsapp, viber          |
| seo                           | `{ defaultTitle, defaultDescription, ogImage, keywords: [String] }` |                                                                                        |
| footer                        | `{ about, links: [{ label, href }] }`                               |                                                                                        |
| theme                         | `{ defaultMode: light \| dark \| system }`                          |                                                                                        |

Enforced singleton: fixed `_id` key (`'site'`) with upsert; public projection exposed at
`GET settings/public`.

### Project

| Field               | Type                                                   | Notes                                      |
| ------------------- | ------------------------------------------------------ | ------------------------------------------ |
| title               | String, required                                       |                                            |
| slug                | String, **unique**                                     | generated from title, editable             |
| mineral             | String                                                 | e.g. iron ore, aggregate                   |
| status              | `exploration \| development \| operating \| completed` |                                            |
| location            | `{ name, district, lat, lng }`                         | site names are **placeholders**            |
| summary             | String (≤ 300)                                         | cards                                      |
| body                | Rich text (sanitised HTML)                             |                                            |
| facts               | `[{ label, value }]`                                   | tonnage etc. **never invented**            |
| coverImage, gallery | Media refs/URLs                                        |                                            |
| featured, published | Boolean                                                | index `{ published, featured, createdAt }` |
| seo                 | SEO sub-schema                                         |                                            |

### Post (news)

`title`, `slug` (unique), `excerpt`, `body` (sanitised HTML), `coverImage`, `tags: [String]`
(index), `author` (ref User), `publishedAt` (Date), `published` (Boolean), `seo`.
Indexes: `{ published, publishedAt: -1 }`, text index on `title, excerpt`.

### Job

`title`, `slug` (unique), `department`, `location`, `type` (full-time/part-time/contract/
internship), `description`, `requirements: [String]`, `deadline` (Date), `isOpen` (Boolean).
Index `{ isOpen, deadline }`. Jobs past `deadline` are hidden publicly.

### Application

`job` (ref Job, required), `name`, `email`, `phone`, `cvUrl` (Cloudinary raw upload, PDF/DOCX
≤ `UPLOAD_MAX_MB`), `message`, `status` (`new | reviewing | shortlisted | rejected | hired`).
Index `{ job, createdAt: -1 }`.

### TeamMember

`name`, `role`, `bio`, `photo`, `order` (Number), `linkedin`. Sorted by `order`.

### Service / Operation

`title`, `slug` (unique), `icon` (lucide icon name), `summary`, `body`, `image`, `order`.

### Message (contact)

`name`, `email`, `phone`, `company`, `subject`, `message`, `ip`, `userAgent`,
`status` (`new | read | replied | spam`). Index `{ status, createdAt: -1 }`.
`ip`/`userAgent` are kept for abuse handling and purged after a retention period
(see SECURITY.md).

### Newsletter subscriber

`email` (unique), `status` (`pending | subscribed | unsubscribed`), `confirmToken`, `source`.
Double opt-in. (Needed by `POST newsletter`.)

### Media

`url`, `publicId` (Cloudinary), `alt` (required for images), `type` (image/video/document),
`size` (bytes), `width?`, `height?`, `uploadedBy` (ref User).

### AuditLog

`user` (ref User), `action` (`create | update | delete | login | logout | publish | …`),
`entity` (model name), `entityId`, `diff` (changed fields; secrets omitted), `ip`, `at` (Date).
Append-only; index `{ entity, entityId }`, `{ at: -1 }`.

### Relationships

```mermaid
erDiagram
  USER ||--o{ POST : authors
  USER ||--o{ MEDIA : uploads
  USER ||--o{ AUDITLOG : performs
  JOB ||--o{ APPLICATION : receives
  PROJECT }o--o{ MEDIA : "cover/gallery"
  POST }o--o| MEDIA : cover
  TEAMMEMBER }o--o| MEDIA : photo
  SERVICE }o--o| MEDIA : image
  SITESETTINGS ||--o| MEDIA : logo
```

---

## 7. Request flows

### 7.1 Public page (visitor)

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant H as Static host / CDN
  participant A as API
  participant D as MongoDB
  B->>H: GET /projects/some-slug
  H-->>B: prerendered HTML (content + embedded data), hashed JS/CSS
  Note over B: First paint = LCP from HTML. No API call needed to render.
  B->>B: hydrate · TanStack Query seeded with embedded data
  B->>A: GET /api/v1/projects/some-slug (background revalidate)
  A->>D: findOne({ slug, published: true }).lean()
  D-->>A: document
  A-->>B: { data } (Cache-Control: public, max-age=60, stale-while-revalidate)
```

### 7.2 Build-time prerender

CI (or the host's build triggered by `REBUILD_HOOK_URL`) runs `pnpm --filter frontend build`.
`vite-react-ssg` renders every public route; dynamic routes call `getStaticPaths()` →
`GET projects|posts|jobs?limit=50&page=n` to enumerate slugs, then each route `loader` fetches
its document. Output: `dist/<route>/index.html` + JSON loader data.

### 7.3 Contact form

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser (ContactForm)
  participant A as API
  participant D as MongoDB
  participant M as SMTP
  B->>B: RHF + Zod validate (client)
  B->>A: POST /api/v1/contact {name, email, …, honeypot}
  A->>A: rateLimit(5/hour/IP) → validate(Zod) → honeypot → Turnstile/reCAPTCHA
  A->>D: Message.create({…, ip, userAgent, status: new|spam})
  A->>M: notify CONTACT_INBOX + auto-reply (async; failure logged, not surfaced)
  A-->>B: 201 { data: { id } }
```

Job applications follow the same path with `multer` (memory storage, type/size checks) streaming
the CV to Cloudinary before `Application.create`.

### 7.4 Admin login and token refresh

```mermaid
sequenceDiagram
  autonumber
  participant B as Admin SPA
  participant A as API
  participant D as MongoDB
  B->>A: POST /auth/login {email, password}
  A->>A: rateLimit(10/15min) → validate
  A->>D: User.findOne({email}).select('+passwordHash')
  A->>A: lockUntil? → argon2.verify → failedLoginCount++ / reset
  A-->>B: 200 { data: user } + Set-Cookie na_at (15 min, Path=/api) + na_rt (7 d, Path=/api/v1/auth)
  Note over B,A: Both cookies httpOnly · Secure · SameSite=Strict
  B->>A: GET /admin/projects (cookie na_at)
  A->>A: auth: verify JWT · user active · requireRole
  A-->>B: 200 { data, meta }
  B->>A: request after 15 min → 401 UNAUTHENTICATED
  B->>A: POST /auth/refresh (cookie na_rt)
  A->>D: user.refreshTokenVersion === token.ver ?
  A-->>B: 200 + rotated na_at + na_rt
  B->>A: replay original request
```

Logout clears both cookies and increments `refreshTokenVersion` (all sessions end).
Forgot/reset uses a single-use, hashed, 30-minute token emailed via SMTP; responses are identical
whether or not the email exists.

### 7.5 Admin write (e.g. publish a project)

`PUT /admin/projects/:id` → `auth` → `requireRole('editor','admin','superadmin')` →
controller (`projectUpdate.parse`) → `projectService.update()`:

1. sanitise `body` HTML (allow-list); the slug only changes when `slug` is sent explicitly
   (title edits keep published URLs stable);
2. save; write `AuditLog` with the field diff (+ `publish`/`unpublish` when visibility flips);
3. if the document is or was public → debounced `jobs/rebuild` call to `REBUILD_HOOK_URL`.
   The frontend build reads `GET /seo/sitemap-data` to write `sitemap.xml`.

### 7.6 Settings geocode

`services/geocode.service.ts` calls Nominatim directly (`format=json&limit=1&countrycodes=np`,
`NOMINATIM_USER_AGENT`, ≤ 1 req/s process-wide, results cached 30 days in a Mongo TTL
collection). `PUT /admin/settings` geocodes a changed address unless `location.manualOverride`;
on failure the old pin stays and the response carries `meta.warnings`. `POST
/admin/settings/geocode` previews coordinates without saving. Dragging the pin saves
`location` with `manualOverride: true`.

### 7.7 Media upload

Admin uploads go to `POST /admin/media` (multer memory storage, MIME sniffing, size limit) →
Cloudinary upload stream into `CLOUDINARY_FOLDER` → `Media.create`. Delivery uses Cloudinary
transformation URLs (`f_auto,q_auto,w_…`) so the frontend requests AVIF/WebP at the right width
through `srcset`.

---

## 8. Security summary

Detail in [SECURITY.md](./SECURITY.md). Highlights: argon2id hashes; short-lived access JWT +
rotating refresh JWT in httpOnly `Secure` `SameSite=Strict` cookies; account lockout; per-route
rate limits; Zod validation on every input (query values coerced to primitives); Mongo operator
stripping (`express-mongo-sanitize`); HTML sanitising for rich text; helmet headers + strict API
CSP (page CSP at the host); CORS allow-list + Origin check; role checks on every admin route;
append-only audit log; secrets only in env, validated at boot (the API refuses to start in
production with placeholder secrets or missing service credentials).

Mongoose `sanitizeFilter` is deliberately **off**: it also wraps the API's own operators
(`$gt`, `$text`, `$in`). Injection is stopped before the query layer instead.

---

## 9. Non-functional targets → how we meet them

| Target                          | Mechanism                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lighthouse ≥ 90 ×4 (mobile)     | Prerendered HTML, self-hosted variable font with `font-display: swap`, critical CSS inlined by beasties, route-level code splitting, Leaflet/GSAP loaded only where used, semantic landmarks, alt text required in Media. |
| LCP < 2.5 s                     | Hero poster image (AVIF/WebP, `fetchpriority="high"`, explicit size) is the LCP element; hero video starts after load and only on fast connections (`navigator.connection`, `prefers-reduced-data`).                      |
| CLS < 0.1                       | Width/height on all media, reserved space for navbar (`--header-h`), font metric fallback, preloader overlays rather than shifts content.                                                                                 |
| INP < 200 ms                    | Transform/opacity-only animation, passive listeners, blur ≤ 16 px, no long tasks in scroll handlers (GSAP batches), React transitions for filters.                                                                        |
| API p95 < 300 ms                | Indexed queries with `.lean()` and projections, `limit ≤ 50`, connection pool, compression, `Cache-Control` on public GETs, settings cached in memory (invalidated on PUT).                                               |
| Browsers incl. Samsung Internet | Vite target `es2020`, autoprefixer, `backdrop-filter` fallback, Playwright on Chromium/Firefox/WebKit + mobile.                                                                                                           |
| 320 → 2560 px                   | Tailwind `xs`…`4xl` breakpoints, fluid type, container max 1440 px with full-bleed media.                                                                                                                                 |

---

## 10. Configuration and environments

| Environment | Frontend                                   | API                                                                                   | DB                         |
| ----------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------- |
| local       | `vite` :5173 (proxy `/api`)                | `tsx watch` :4000                                                                     | docker `mongo:7` + Mailpit |
| CI          | `vite-react-ssg build`, Vitest, Playwright | Vitest + Supertest (no DB needed for health; `mongodb-memory-server` for model tests) | in-memory                  |
| production  | static host / CDN (TBD)                    | container (TBD)                                                                       | MongoDB Atlas              |

All configuration is environment variables, documented in `frontend/.env.example` and
`backend/.env.example`. Backend env is parsed by Zod in `config/env.ts` at boot; any invalid
value stops the process. Only `VITE_*` variables reach the browser.

---

## 11. Placeholder register (unknown facts — never invent)

| Fact                                 | Where it appears                        | Current value                     |
| ------------------------------------ | --------------------------------------- | --------------------------------- |
| Founding year                        | About, Timeline, JSON-LD `foundingDate` | `[PLACEHOLDER: founding year]`    |
| Licences / permits                   | About, Sustainability                   | `[PLACEHOLDER: licences]`         |
| Site / mine names, coordinates       | Projects                                | `[PLACEHOLDER: site name]`        |
| Tonnage, capacity, reserves          | Stats, Project facts                    | `[PLACEHOLDER: tonnage]`          |
| Staff count                          | Stats, Careers                          | `[PLACEHOLDER: staff count]`      |
| Phone, email, WhatsApp               | SiteSettings.contact, Footer            | `[PLACEHOLDER: phone/email]`      |
| Social links                         | SiteSettings.social                     | empty, `isActive: false`          |
| Company registration / PAN / VAT no. | Footer, Legal                           | `[PLACEHOLDER: registration no.]` |
| Office hours                         | Contact                                 | `[PLACEHOLDER: office hours]`     |
| Production domain                    | robots.txt, sitemap, canonical          | `example.com`                     |
| Logo source files                    | `frontend/public/logo/`                 | awaiting client files             |

Placeholders render visibly (styled `[PLACEHOLDER …]`) in non-production builds and are blocked
by a pre-release check (`grep PLACEHOLDER dist/`) before go-live.

---

## 12. Open questions

1. Hosting targets for the static site and the API (drives `deploy-*.yml` and the rebuild hook).
2. ~~Is Nepali (ने) localisation required at launch?~~ **Yes** — Phase 4.5 adds `/en` + `/ne`
   path-prefix routing with `hreflang` (see §13).
3. Newsletter: own double-opt-in list (current plan) or an external provider?
4. Retention period for contact messages and job applications (privacy notice).
5. Production email: company SMTP or a transactional provider (Resend is the fallback option).

---

## 13. Phase 4.5 additions (built 2026-10-10 — real content, bilingual, inquiries)

> Source: `docs/content/PHASE_4.5_CONTENT_INTEGRATION_PROMPT.md` and the incoming architecture
> v2.0 (10 Oct 2026). Built on `feature/phase-4-5-content`. Everything above stays valid; these
> are additive changes. Where the incoming v2.0 described the existing system differently, the code
> (and the sections above) win — see SKILLS.md §8.

### 13.1 Context change

The business focus narrows to one asset, the **Katujpani Iron Deposit** (Bakaiya-09,
Makawanpur), and one product, **industrial hematite iron ore** for cement plants (iron
corrective) plus evaluation lots for foundry/metallurgical buyers. Primary goal: bulk supply
inquiries, then investor credibility. Content and numbers come only from
`docs/content/NIRAUM_MASTER_BLUEPRINT.md` and `docs/content/data/assay_data.json`.

### 13.2 Frontend

- **i18n:** react-i18next + language detector; namespaces per page; `en` + `ne` JSON in
  `src/locales/`, missing `ne` keys fall back to `en`. Public routes move under
  `/:lang(en|ne)/*`; `/` redirects by saved or browser language; existing unprefixed URLs keep
  working (redirect). `<html lang>` and the font switch (Manrope / Mukta for Devanagari) follow
  the language. `/admin` stays English-only.
- **Pages:** Our Project (Katujpani — replaces Projects as the main entry; `/projects` routes
  keep working), Products, Technical Data, Investors. Home, About and Contact get the blueprint
  copy.
- **Components:** `LanguageToggle`, `InquiryForm`, `AssaySummaryTable`, `AssaySampleTable`,
  `FeBySectionChart` (Recharts with a table fallback), `MapGallery` (tabbed maps + lightbox),
  `FounderCard`, `DataOriginNote`.
- **SEO:** per-language meta, canonical, `hreflang` (en, ne, x-default), JSON-LD Organization,
  LocalBusiness and Product; both language trees prerendered by `vite-react-ssg`; the sitemap
  lists both.
- **Assets:** report imagery in `src/assets/site/{photos,maps,brand}` (WebP) through the existing
  `?picture` imagetools pipeline (AVIF/WebP/JPEG at several widths). Originals live in
  `/design-assets` (not shipped).
- **Data:** new hooks follow the existing pattern — `features/<x>/use*.ts` on
  `useContentList` / `useContentItem`, with a local fallback built from the same assay JSON, so
  the stats strip and tables are prerendered and never hard-coded.

### 13.3 Data model changes

| Model                                                                 | Change    | Key fields                                                                                                                                                |
| --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SiteSettings                                                          | changed   | motto, footer.about → LocalizedString; **new** `publicAssayDetail` (default false), `defaultLanguage`                                                     |
| Project, Post, Service, Job                                           | changed   | user-facing text → LocalizedString                                                                                                                        |
| TeamMember                                                            | changed   | role, bio → LocalizedString; **new** `isFounder`, `otherVentures[]`                                                                                       |
| User, Message, Application, Media, AuditLog, Subscriber, GeocodeCache | unchanged | —                                                                                                                                                         |
| **Product**                                                           | new       | name, slug, chemicalFormula, summary, applications[], typicalChemistry[], sizes, minOrder, packing, image, published                                      |
| **Deposit**                                                           | new       | location (district, municipality, ward, province, topoSheet, easting, northing, spotHeightM, lat?, lng?), areas, land, geologySummary, consultant, status |
| **AssaySample**                                                       | new       | sample, dataset (grab_B_C, grab_A, channel_B, channel_C, channel_KXY), SiO2, LOI?, Fe, Fe2O3, Al2O3, CaO?, MgO?, lengthM?                                 |
| **AssaySummary**                                                      | new       | section, thicknessM, SiO2, Fe, Fe2O3, Al2O3 (+ overall row)                                                                                               |
| **Inquiry**                                                           | new       | companyName, contactName, email, phone, buyerType, quantity + unit, deliveryLocation, specRequirement, message, lang, status, sourcePage, ip, userAgent   |

`LocalizedString = { en: string; ne?: string }` (Mongoose sub-schema). Public endpoints resolve it
with `?lang=` (fallback `en`), so their response shapes stay the same; admin endpoints return
both. A new idempotent migration (`backend/src/migrations/2026-10-localize-fields.ts`, `migrate`
script) wraps existing strings as `{ en }`.

### 13.4 API additions (`/api/v1`)

| Method     | Path                                                   | Access                                    |
| ---------- | ------------------------------------------------------ | ----------------------------------------- |
| GET        | `/products`, `/products/:slug`                         | public                                    |
| GET        | `/deposits/:slug`                                      | public                                    |
| GET        | `/assay/summary`                                       | public                                    |
| GET        | `/assay/samples?dataset=`                              | public if `publicAssayDetail`, else admin |
| POST       | `/inquiries`                                           | public (captcha, honeypot, 5/hour/IP)     |
| GET, PATCH | `/admin/inquiries`, `/admin/inquiries/:id`, CSV export | admin                                     |
| CRUD       | `/admin/products`, `/admin/deposits`, `/admin/assay`   | admin/editor (Phase 5 UI)                 |

Implementation follows §5: Zod schemas in `validators/`, services take an `Actor` and audit
writes, existing middleware (`auth.ts`, `rateLimits.ts`, `originCheck.ts`) — no separate
`validate` middleware.

### 13.5 Inquiry flow (primary business goal)

1. Visitor submits the Bulk Supply Inquiry (any page CTA or the Contact tab).
2. API validates (Zod), checks captcha + honeypot + rate limit, stores `Inquiry` (status `new`).
3. Email to `CONTACT_INBOX` (+ optional `INQUIRY_CC`) and an auto-reply in the visitor's language.
4. Admin moves it through `contacted → quoted → won / lost` (or `spam`); CSV export for follow-up.

### 13.6 Seed

`seed/assay.seed.ts` loads `docs/content/data/assay_data.json`; a unit test recomputes the
length-weighted averages (Fe 23.48 / Fe₂O₃ 33.59 / SiO₂ 53.05, ±0.02). Seeds also create the
Katujpani Deposit, the hematite Product and the Founder. Mine lat/lng stays empty until WGS-84
coordinates are confirmed (the report uses a local grid).

### 13.7 How it was built (differences from the plan)

- **Routing:** `/en` and `/ne` are static route prefixes (not a `:lang` param) so vite-react-ssg
  prerenders both trees; `useLang()` reads the prefix and `useT(ns)` binds `t` with
  `getFixedT`, so both languages render in one prerender process. `/` and pre-4.5 URLs are
  prerendered redirect pages (inline script: saved choice → browser language → default; no-JS
  meta refresh). Public `Link`/`NavLink` come from `components/common/LangLink.tsx`.
- **Admin API shape:** admin reads keep English strings in the existing fields and add
  `translations` (full `{ en, ne }`) instead of replacing strings with objects — existing
  clients and tests keep working.
- **Data flow:** `features/assay/useAssay.ts` → `GET /assay/summary` with a local fallback built
  from the same `assay_data.json` (imported by `content/katujpani.ts`), so the prerendered stats
  and tables equal the API values. Sample rows are fetched only when `publicAssayDetail` is on.
- **Prerender:** `onPageRendered` strips vite-react-ssg's blanket image/font preloads and keeps
  Manrope Latin (+ Mukta 400 on `/ne`).

### 13.8 Decisions to record as ADRs

| Proposed ADR | Decision                               | Reason                                                                        |
| ------------ | -------------------------------------- | ----------------------------------------------------------------------------- |
| 0005         | Keep Manrope; add Mukta for Nepali     | Manrope already shipped and fits the same industrial style as the suggestions |
| 0006         | Path-prefix i18n (`/en`, `/ne`)        | Best for SEO and prerendering vs. query/cookie switching                      |
| 0007         | LocalizedString sub-schema + migration | Additive; existing content preserved as `en`                                  |
| 0008         | Assay data as models, not images       | Searchable, sortable, chartable, accessible; scans kept only as reference     |
| 0009         | Mine pin waits for WGS-84 coordinates  | Guessing a grid conversion risks a wrong public location                      |

The incoming v2.0 numbered these 0007–0011; renumbered here to follow the existing 0001–0004.

## 14. Phase 5 — admin panel (built 2026-10-11)

- **Boundary:** everything admin lives in `frontend/src/admin/`; `/admin/*` is a lazy route beside
  the `/:lang` tree with its own providers and `noindex`. `scripts/check-admin-boundary.mjs` fails
  the build if public code imports `@/admin`, so TipTap, cmdk and the admin pages never reach a
  public chunk.
- **Auth flow:** httpOnly cookies only. `useMe()` gates routes (`RequireAuth` → login with a safe
  `?next=`, forced password change; `RequireRole` → "You don't have access"). The single-flight
  refresh interceptor in `lib/api.ts` retries after a 401; if the refresh fails, the open form's
  draft is kept in memory and restored after sign-in in the same tab.
- **Resource pattern:** each content type is a `ResourceConfig` (`admin/resources/config.ts`:
  fields, Zod schema mirroring `validators/content.ts`, columns, filters, `localized` list from
  `localized.json`, checked against the backend by `tests/localized-sync.test.ts`).
  `ResourceList` / `ResourceEdit` render any config; `form.ts` and `localize.ts` convert between
  API docs, form values and request bodies (only dirty fields; `{ en }` unless Nepali was edited).
  The deposit uses a custom edit page with the map pin.
- **Backend additions:** captcha after 3 failed logins; dashboard counts; scheduled publishing
  (`schedulable` content: a future `publishedAt` hides an item from public lists, detail pages and
  the sitemap); inquiry search + per-status counts; assay admin writes and CSV import
  (validate the whole file first, then replace or append in a transaction where supported);
  `import` audit action.
- **Known gap:** a scheduled item appears on the static site only after the next rebuild — the
  rebuild hook runs on save, not at `publishedAt` (Phase 7: timed rebuild).
