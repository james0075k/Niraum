# Niraum Metals — Website Build Prompt Pack

Oct 8, 2026 · @Nima Yolmo

## How to use this pack and the brand brief

This pack is eight copy-paste prompts, one per build phase, for the Niraum Metals website. Paste the Brand Brief below at the top of every prompt so each tool works from the same facts.

1. Phase 1 goes into Google Stitch to produce the screen designs.
2. Phases 2 to 8 go into your coding agent (Claude Code, Cursor or similar), one phase per session, in order.
3. After each phase, the agent updates `SKILLS.md` and `README.md` (Phase 8 defines both) before you move on.

### Brand Brief (paste at the top of every prompt)

```text
BRAND BRIEF — NIRAUM METALS PVT. LTD.

Company name: Niraum Metals Pvt. Ltd. (short: Niraum Metals)
Motto / tagline: "Strength Forged For Generations"
Registered address: Lalitpur-13, Nepal
Industry: Mining and metals — iron ore, metal minerals and stone/aggregate supply in Nepal
Audience: construction companies, steel and cement plants, government and infrastructure
projects, investors, job seekers and local communities in Nepal and South Asia.
Tone: solid, trustworthy, modern, engineering-led. Short confident sentences. No hype.

LOGO: a hexagonal shield. Top half = dark mountain peaks with a silver/white snow face
(Himalayan mountains). Bottom half = interlocked "N" (copper gradient) and "M" (charcoal).
Wordmark "NIRAUM" bold geometric sans: "N" copper, "IRAUM" charcoal. "METALS" below in
spaced copper capitals. Use the supplied logo files; never redraw or recolour the mark.

BRAND COLOURS (sampled from the logo — keep exactly):
  Charcoal (primary dark)   #2B2F36
  Graphite (deep bg, dark)  #14171C
  Copper (primary accent)   #B8754A
  Copper light (highlight)  #DDA27C
  Copper deep (shadow)      #8A5236
  Copper gradient           linear-gradient(135deg, #8A5236 0%, #DDA27C 50%, #A9663F 100%)
  Silver (snow face)        #C9CDD3
  Off-white (light bg)      #F6F4F1
  Rule line (letterhead)    #C27A44
Use copper for CTAs, active states, links and key numbers only. Charcoal for text and
structure. Silver for secondary lines and icons.

TYPOGRAPHY: Manrope only (variable, weights 300–800).
  Display/H1 800, H2 700, H3 600, body 400, labels 500 uppercase with 0.12em tracking.
  Source: github.com/terrapkg/pkg-manrope-fonts (self-host via @fontsource-variable/manrope).

SIGNATURE STYLE: glassmorphism panels over dark mountain/mine photography and video,
copper glow accents, subtle brushed-metal and rock-grain textures, smooth scroll motion.
Light and dark themes, both first-class.

DESIGN REFERENCE: https://gmining.com (G Mining Services, Canada) — copy its feel, not its
content: branded loading animation, smooth page transitions, hover reveals on project
cards, scroll-driven storytelling, large project views, clean team page.

UNKNOWN FACTS (keep as clearly marked placeholders, never invent): founding year, licences,
site names, tonnage, staff count, phone, email, social links, registration numbers.
```

One thing to fix before launch: the letterhead says "Pvt. Ltd." but its footer says "Niraum Metals Limited". Pick one legal name and use it everywhere.

## Phase 1 — Google Stitch design prompt

Paste the Brand Brief, then this prompt, into Stitch. Generate desktop first, then ask Stitch for the mobile (390 px) and tablet (834 px) versions of each screen. Export to Figma or HTML so Phase 3 can match it.

```text
ROLE: You are a senior UI/UX designer for heavy-industry brands.

TASK: Design a complete, responsive website for Niraum Metals Pvt. Ltd., a mining and
metals company in Lalitpur, Nepal. Motto: "Strength Forged For Generations".

REFERENCE: Study https://gmining.com and match its level of polish: branded preloader,
smooth page transitions, large full-bleed imagery, hover reveals on project cards,
scroll-led storytelling and a clean team grid. Do not copy its layout pixel for pixel or
any of its content.

VISUAL SYSTEM
- Colours: exactly the Brand Brief palette. Copper gradient only on CTAs, key numbers,
  active nav underline and the preloader.
- Font: Manrope everywhere. H1 64–88 px / 800 desktop, 40 px mobile.
- Glassmorphism: panels with background rgba(20,23,28,0.45) in dark and
  rgba(255,255,255,0.55) in light, backdrop blur 18–24 px, 1 px border
  rgba(221,162,124,0.25), radius 20 px, soft shadow 0 20px 60px rgba(0,0,0,0.35).
- Texture: very subtle rock-grain noise (3–5% opacity) on section backgrounds and a
  brushed-metal sheen on the copper buttons.
- Imagery: Himalayan ridgelines, open-pit and quarry sites, ore close-ups, machinery,
  workers in PPE. Dark gradient overlay (bottom 70%) behind ALL text on photos so words
  stay readable in both themes.
- Themes: design every screen in Light and Dark. Toggle (sun/moon) in the navbar.
- Grid: 12 columns, 1280 px max container, 24 px gutters; 4 columns on mobile.

SCREENS TO DESIGN (each in light + dark, desktop + mobile)
1. Preloader: hexagon logo draws in, copper line fills, fades to hero.
2. Home:
   a. Glass navbar (sticky, shrinks on scroll): logo left; Home, About, Operations,
      Projects, Sustainability, News, Careers, Contact; theme toggle; "Get a Quote" CTA.
   b. Hero: full-screen looping mine/mountain video, H1 "Strength Forged For
      Generations", one-line sub, two CTAs (Explore Operations / Contact Us),
      scroll cue.
   c. Stats strip in glass cards with count-up numbers (placeholders).
   d. "What we do" — 4 glass cards: Iron Ore, Metal Minerals, Stone & Aggregates,
      Logistics & Supply.
   e. Featured projects — horizontal scroll gallery, hover reveals name, location, mineral.
   f. Process timeline: Exploration → Extraction → Processing → Delivery.
   g. Sustainability and safety band with image.
   h. Latest news (3 cards). i. Partner/client logo marquee. j. Big contact CTA band.
3. About: story, mission/vision/values, leadership grid, timeline, certifications.
4. Operations: one section per operation with stats and image gallery.
5. Projects list (filter by mineral/status) and Project detail (hero, facts table,
   gallery, map, related projects).
6. Sustainability & Safety: ESG pillars, community, environment, safety record.
7. News list + article page. 8. Careers list + job detail with apply form.
9. Contact: glass form (name, email, phone, company, subject, message), address,
   phone, email, social icons, embedded map pin at the company address, office hours.
10. Legal: Privacy Policy, Terms of Use, Cookie Policy (simple text layout).
11. 404 page with mountain illustration and "Back home".
12. Footer (all public pages): logo + motto, quick links, operations links, legal
    links, address, phone, email, social icons, newsletter field, copyright
    "© 2026 Niraum Metals Pvt. Ltd.".
13. Admin: Login (glass card, logo, email + password, "forgot password"),
    Dashboard (cards: messages, projects, news, jobs), Settings (company info,
    address + live map preview, social links each with on/off switch), content
    tables (Projects, News, Jobs, Team, Media), Messages inbox.

MOTION NOTES (annotate on frames): preloader, page fade/slide transitions,
scroll-reveal (fade-up 24 px, 0.6 s), parallax on hero, magnetic hover on CTAs,
count-up stats, card tilt on hover, marquee logos. Respect reduced-motion.

ACCESSIBILITY: WCAG 2.2 AA contrast in both themes, 44 px touch targets, visible focus
rings in copper.

DELIVER: named frames per page/theme/breakpoint, a component sheet (buttons, inputs,
cards, badges, nav, footer, glass panel) and a colour + type style guide.
```

## Phase 2 — System design, architecture and repo layout

The site is a React front end and an Express + MongoDB API, kept in two separate folders in one repository. Public pages are prerendered for SEO; the admin area is a protected single-page app.

&#91;embedded content: system architecture · frontend, API, data and services\]

Visitors and admin staff both go through the same API; only the API touches the database, media store, geocoder and email.

```text
ROLE: You are a senior full-stack architect. Before writing any feature code, set up
the project skeleton and write docs/ARCHITECTURE.md.

STACK (fixed — do not substitute)
Frontend: React 18 + Vite + TypeScript, React Router v6, Tailwind CSS v3, shadcn/ui
(Radix), Framer Motion, GSAP + ScrollTrigger, Lenis smooth scroll, TanStack Query,
React Hook Form + Zod, react-helmet-async, Leaflet + react-leaflet (OpenStreetMap),
lucide-react icons, @fontsource-variable/manrope, next-themes-style ThemeProvider.
Prerender public routes at build time (vite-plugin-prerender or vite-react-ssg).
Backend: Node 20 LTS + Express 4 + TypeScript, Mongoose 8 (MongoDB Atlas), Zod
validation, argon2 password hashing, JWT (access 15 min + refresh 7 days, httpOnly
Secure SameSite=Strict cookies), helmet, cors, express-rate-limit, hpp,
express-mongo-sanitize, multer + Cloudinary for media, Nodemailer (SMTP) or Resend for
email, pino logging, node-geocoder/Nominatim for address → coordinates.
Tooling: pnpm workspaces, ESLint + Prettier, Husky + lint-staged, Commitlint
(Conventional Commits), Vitest + React Testing Library, Supertest, Playwright e2e,
Docker + docker-compose, GitHub Actions.

REPOSITORY LAYOUT
niraum-metals/
├─ frontend/
│  ├─ public/ (favicons, robots.txt, og-image.jpg, logo files)
│  ├─ src/
│  │  ├─ app/ (router.tsx, providers.tsx, App.tsx)
│  │  ├─ pages/ (public/ Home, About, Operations, Projects, ProjectDetail,
│  │  │          Sustainability, News, Article, Careers, Job, Contact, Legal, NotFound;
│  │  │          admin/ Login, Dashboard, Settings, Projects, News, Jobs, Team,
│  │  │          Media, Messages, Users)
│  │  ├─ components/ (ui/ = shadcn; layout/ Navbar, Footer, AdminShell;
│  │  │   sections/ Hero, Stats, Services, ProjectGallery, Timeline, NewsGrid,
│  │  │   LogoMarquee, CtaBand, ContactForm, MapCard; motion/ Reveal, Parallax,
│  │  │   CountUp, PageTransition, Preloader, MagneticButton; seo/ Seo, JsonLd)
│  │  ├─ features/ (settings, projects, news, jobs, contact — api hooks + types)
│  │  ├─ lib/ (api.ts axios instance, utils.ts, motion.ts presets, seo.ts)
│  │  ├─ styles/ (globals.css tokens, glass.css, textures.css)
│  │  └─ assets/ (images, video posters, textures)
│  ├─ tests/ ; e2e/ ; .env.example ; vite.config.ts ; tailwind.config.ts ; Dockerfile
├─ backend/
│  ├─ src/
│  │  ├─ config/ (env.ts with Zod, db.ts, cloudinary.ts, mailer.ts, logger.ts)
│  │  ├─ models/ ; routes/ ; controllers/ ; services/ ; middlewares/
│  │  │  (auth, requireRole, validate, rateLimit, errorHandler, upload)
│  │  ├─ validators/ (Zod schemas shared shape with frontend types)
│  │  ├─ utils/ ; jobs/ (sitemap regeneration) ; seed/ (first admin + demo data)
│  │  ├─ app.ts ; server.ts
│  ├─ tests/ ; .env.example ; Dockerfile
├─ docs/ (ARCHITECTURE.md, API.md, SECURITY.md, DEPLOYMENT.md, adr/)
├─ .github/workflows/ (ci.yml, deploy-frontend.yml, deploy-backend.yml)
├─ docker-compose.yml ; SKILLS.md ; README.md ; CHANGELOG.md ; LICENSE

DATA MODELS (Mongoose, all with timestamps)
User: name, email (unique, lowercase), passwordHash, role (superadmin|admin|editor),
  isActive, lastLoginAt, failedLoginCount, lockUntil, refreshTokenVersion.
SiteSettings (single document): companyName, legalName, motto, logo {light, dark},
  contact {phone[], email[], whatsapp}, address {line1, city, district, province,
  country, postalCode}, location {lat, lng, zoom, manualOverride}, officeHours,
  social [{platform, url, isActive, order}] for facebook, instagram, linkedin,
  youtube, x, tiktok, whatsapp, viber; seo {defaultTitle, defaultDescription,
  ogImage, keywords[]}; footer {about, links[]}; theme {defaultMode}.
Project: title, slug, mineral, status (exploration|development|operating|completed),
  location {name, district, lat, lng}, summary, body (rich text), facts
  [{label, value}], coverImage, gallery[], featured, seo {...}, published.
Post (news): title, slug, excerpt, body, coverImage, tags[], author, publishedAt,
  published, seo {...}.
Job: title, slug, department, location, type, description, requirements[],
  deadline, isOpen.
Application: job ref, name, email, phone, cvUrl, message, status.
TeamMember: name, role, bio, photo, order, linkedin.
Service/Operation: title, slug, icon, summary, body, image, order.
Message (contact): name, email, phone, company, subject, message, ip, userAgent,
  status (new|read|replied|spam).
Media: url, publicId, alt, type, size, uploadedBy.
AuditLog: user, action, entity, entityId, diff, ip, at.

API (REST, /api/v1, JSON)
Public: GET settings/public, services, projects, projects/:slug, posts, posts/:slug,
  jobs, jobs/:slug, team; POST contact, applications, newsletter.
Auth: POST auth/login, auth/refresh, auth/logout, auth/forgot, auth/reset;
  GET auth/me.
Admin (role-guarded): full CRUD for projects, posts, jobs, team, services, media,
  users; GET/PUT settings; POST settings/geocode; GET/PATCH messages; GET audit.
All list endpoints paginate (?page, ?limit≤50), filter and sort; responses
{data, meta} or {error:{code,message,details}}.

NON-FUNCTIONAL TARGETS
Lighthouse ≥ 90 (Performance, Accessibility, Best Practices, SEO) on mobile;
LCP < 2.5 s, CLS < 0.1, INP < 200 ms; API p95 < 300 ms; works on Chrome, Safari,
Firefox, Edge, Samsung Internet; 320 px to 2560 px wide.

OUTPUT: the folder skeleton, both package.json files, tsconfig, lint/format config,
.env.example files, docker-compose with MongoDB for local dev, and ARCHITECTURE.md with
a component diagram, the data models above and the request flow. Then update
SKILLS.md and README.md.
```

## Phase 3 — Frontend build prompt

Run this in the `frontend/` folder after Phase 2. Attach the Stitch exports so the agent matches them.

```text
ROLE: You are a senior React engineer and motion designer. Build the public website in
/frontend exactly to the attached Stitch designs and the Brand Brief.

1. DESIGN TOKENS (src/styles/globals.css + tailwind.config.ts)
- CSS variables for both themes on :root and .dark — --background, --foreground,
  --card, --glass-bg, --glass-border, --primary (copper #B8754A), --primary-foreground,
  --muted, --ring (copper), --charcoal, --silver, --copper-gradient.
- Font: import '@fontsource-variable/manrope'; set fontFamily.sans = ['Manrope Variable',
  'system-ui', 'sans-serif']. Fluid type with clamp(): h1 clamp(2.5rem, 6vw, 5.5rem).
- Utilities: .glass (backdrop-blur-xl, glass bg, 1px glass border, rounded-2xl,
  shadow), .glass-strong for navbar/forms, .text-copper (gradient text via
  bg-clip-text), .grain (SVG noise overlay at 4% opacity), .metal-sheen (animated
  linear-gradient highlight on hover). Provide @supports fallback when backdrop-filter
  is unavailable (solid 92% opacity background).

2. THEME
- ThemeProvider with light | dark | system, stored in localStorage (wrapped in
  try/catch), class strategy on <html>, no flash (inline script in index.html).
- Theme toggle in navbar (sun/moon morph animation). Admin's default mode from
  SiteSettings is used when the visitor has no saved choice.
- Every photo and video that has text on it gets a gradient overlay
  (from-black/70 via-black/40 to-transparent) in BOTH themes so text is always
  readable; check contrast ≥ 4.5:1.

3. SHADCN/UI COMPONENTS (install via CLI, then theme with tokens)
button, card, input, textarea, label, select, checkbox, switch, form, dialog, sheet
(mobile nav), navigation-menu, dropdown-menu, tabs, accordion, badge, separator,
tooltip, toast/sonner, skeleton, carousel (embla), table, pagination, avatar,
scroll-area, alert-dialog, breadcrumb, command (admin search).
Wrap shadcn primitives with Framer Motion where motion helps (motion.div asChild).

4. ANIMATION SYSTEM (src/components/motion + src/lib/motion.ts)
- Preloader: SVG hexagon stroke-draw (pathLength 0→1), logo fade, copper progress
  line; shows once per session, max 1.8 s, skippable.
- PageTransition: AnimatePresence on route change — copper panel wipe + content
  fade-up (0.5 s, ease [0.22,1,0.36,1]).
- Lenis smooth scroll synced with GSAP ScrollTrigger.
- Reveal: fade-up 24 px + slight blur on enter viewport, staggered children.
- Parallax hero background; pinned horizontal-scroll project gallery (GSAP pin).
- CountUp stats on view; split-text heading reveal (word by word) on hero/H2.
- Hover: card 3D tilt (max 6°), image zoom 1.05, MagneticButton on CTAs, copper
  underline sweep on nav links, cursor-follow glow on glass cards (desktop only).
- Logo marquee (infinite, pause on hover).
- prefers-reduced-motion: disable parallax, pin, tilt, split-text; keep simple fades.
- Performance: animate only transform/opacity, lazy-load GSAP sections, no layout
  thrash, 60 fps on mid-range Android.

5. LAYOUT AND DIVS (semantic, one clear wrapper per section)
Every page: <header> (Navbar) → <main id="main"> → <section> blocks, each with
id, aria-labelledby, an inner .container (max-w-7xl mx-auto px-4 sm:px-6 lg:px-8)
and a single H2 → <footer>. One H1 per page. Skip-to-content link. Breadcrumbs on
inner pages.

6. PAGES AND SECTIONS (data from the API via TanStack Query; skeletons while loading)
- Navbar: glass, sticky, shrinks + darkens after 40 px scroll; logo (light/dark
  versions from settings); links with active state; theme toggle; "Get a Quote";
  mobile = shadcn Sheet with staggered links; navigation-menu dropdown for Operations.
- Home: Hero (video bg, poster image, H1 = motto), Stats, What We Do (services),
  Featured Projects (horizontal pin), Process Timeline, Sustainability band, Latest
  News, Partners marquee, Contact CTA.
- About: Story, Mission/Vision/Values cards, Leadership (TeamMember grid with hover
  bio), Milestones timeline, Certifications.
- Operations: list + detail sections from Service model.
- Projects: filter tabs (mineral, status), grid with hover reveal; detail page with
  facts table, gallery lightbox, Leaflet map of site location, related projects.
- Sustainability & Safety, News list/article, Careers list/job + apply form (CV upload
  PDF ≤ 5 MB).
- Contact: glass form (RHF + Zod, honeypot field, success toast), contact details,
  ACTIVE social icons only (from settings.social where isActive), office hours, and
  MapCard: Leaflet map centred on settings.location.lat/lng with a copper hexagon
  marker and popup showing the address, "Get directions" link
  (https://www.google.com/maps/dir/?api=1&destination=lat,lng). Map updates whenever
  admin changes the address.
- Footer: logo + motto, short about, Quick Links (About, Operations, Projects,
  Sustainability, News, Careers, Contact), Legal (Privacy, Terms, Cookies, Sitemap),
  contact block (address, phone, email), active social icons, newsletter input,
  "© {year} Niraum Metals Pvt. Ltd. All rights reserved.", back-to-top button.
- Legal pages, 404, cookie consent banner (essential vs analytics).

7. SEO (every public page)
- <Seo> component: unique title (≤ 60 chars, pattern "Page | Niraum Metals Nepal"),
  meta description (≤ 155 chars), canonical, Open Graph + Twitter tags, hreflang en
  (and ne when Nepali is added).
- JSON-LD: Organization (name, logo, address Lalitpur-13 Nepal, sameAs = active
  socials), LocalBusiness on Contact, BreadcrumbList on inner pages, Article on news,
  JobPosting on jobs.
- Prerender all public routes; generate sitemap.xml and robots.txt at build; images
  with width/height, alt text, AVIF/WebP via vite-imagetools, loading="lazy" except
  LCP image (fetchpriority="high").
- Copywriting: natural keywords — "mining company in Nepal", "iron ore supplier
  Nepal", "metal minerals Lalitpur", "stone and aggregate supplier Kathmandu Valley",
  "construction aggregates Nepal". One primary keyword per page, used in H1, first
  paragraph, title and URL slug. No keyword stuffing; write for people first.

8. RESPONSIVE + UX
- Breakpoints: 360, 390, 768, 1024, 1280, 1536+. Test portrait and landscape.
- Touch targets ≥ 44 px, no hover-only info on touch, sticky mobile CTA (Call /
  WhatsApp) on small screens, forms with correct input types and autocomplete.
- Accessibility: WCAG 2.2 AA, keyboard nav, focus-visible rings, aria labels on icon
  buttons, reduced motion, alt text from Media.alt.

9. TESTS: Vitest + RTL for components (Navbar, ThemeToggle, ContactForm, MapCard);
Playwright e2e for home load, theme switch, contact submit, admin login.

OUTPUT: working pages, no placeholder lorem ipsum except the clearly marked unknown
business facts. Update SKILLS.md and README.md when done.
```

## Phase 4 — Backend build prompt

Run this in the `backend/` folder. It builds the API that powers every dynamic part of the site, including the admin-controlled social links and map.

```text
ROLE: You are a senior Node.js backend engineer. Build the API in /backend from
docs/ARCHITECTURE.md (Phase 2). TypeScript strict mode, no 'any'.

1. BOOTSTRAP
- config/env.ts: load and validate env with Zod; crash on missing values.
  Vars: NODE_ENV, PORT, MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET,
  CLIENT_URL, ADMIN_URL, CLOUDINARY_*, SMTP_* (or RESEND_API_KEY), CONTACT_INBOX,
  NOMINATIM_USER_AGENT, RECAPTCHA_SECRET or TURNSTILE_SECRET, LOG_LEVEL.
- db.ts: mongoose.connect with retry + graceful shutdown on SIGTERM/SIGINT.
- app.ts middleware order: requestId → pino-http → helmet (strict CSP) → cors
  (allowlist CLIENT_URL, ADMIN_URL; credentials true) → compression →
  express.json({limit:'1mb'}) → cookie-parser → mongo-sanitize → hpp → rate limits →
  routes → 404 → errorHandler.
- GET /api/v1/health returns {status, uptime, db}.

2. MODELS: implement every model in ARCHITECTURE.md with indexes (unique slug,
email; text index on Project/Post title+summary; publishedAt desc). Slugs auto-generated
from title (slugify, unique suffix). Soft-delete flag on content models.

3. AUTH
- POST /auth/login: Zod-validated; argon2.verify; on 5 failures lock 15 min;
  issue access (15 min) + refresh (7 d) JWTs in httpOnly, Secure, SameSite=Strict
  cookies; record lastLoginAt; audit log.
- POST /auth/refresh rotates refresh token (refreshTokenVersion check).
- POST /auth/logout clears cookies and bumps version.
- Forgot/reset password: single-use token (hashed, 30 min expiry) emailed.
- Middlewares: requireAuth, requireRole('superadmin'|'admin'|'editor').
  Editors: content only. Admins: content + settings + messages. Superadmin: users.
- Seed script creates the first superadmin from env (SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD) and forces password change on first login.

4. SITE SETTINGS + MAP (single-document pattern)
- GET /settings/public returns only public fields; social array filtered to
  isActive === true and sorted by order.
- PUT /settings (admin): Zod schema; when the address changes and
  location.manualOverride is false, call services/geocode.ts:
  Nominatim search (format=json, limit=1, countrycodes=np, custom User-Agent,
  1 request/second, cache results 30 days) → save lat/lng. If geocoding fails,
  keep the old coordinates and return a warning so admin can drop a pin manually.
- POST /settings/geocode (admin): preview coordinates for an address without saving.
- Default seed location: Lalitpur-13, Nepal (geocode on seed; admin confirms pin).
- Bust frontend cache: respond with ETag; settings cached in memory 60 s.

5. CONTENT CRUD (projects, posts, jobs, team, services)
Controller → service → model layers. List endpoints: pagination, filters, sort,
search, published-only for public routes. Admin routes include drafts.
Every create/update/delete writes an AuditLog entry.

6. MEDIA: multer memory storage, accept jpg/png/webp/avif/pdf/mp4 by MIME and
magic bytes, max 8 MB images / 5 MB PDF / 50 MB video, upload to Cloudinary
folder niraum/, store url + publicId + alt; delete removes from Cloudinary too.

7. CONTACT + APPLICATIONS + NEWSLETTER
- POST /contact: Zod, honeypot, Turnstile/reCAPTCHA verify, rate limit 5/hour/IP,
  save Message, email CONTACT_INBOX and an auto-reply to the sender.
- POST /applications with CV upload; email HR.
- POST /newsletter (double opt-in email).

8. SEO SUPPORT: GET /seo/sitemap-data returns slugs + updatedAt for projects, posts,
jobs so the frontend build can generate sitemap.xml; webhook to trigger a frontend
rebuild when content is published (Vercel/Netlify deploy hook URL in env).

9. ERRORS + LOGGING: central errorHandler maps Zod, Mongoose, JWT and custom
AppError to {error:{code, message, details}}; never leak stack traces in production;
pino JSON logs with requestId; redact passwords, tokens, cookies.

10. TESTS: Vitest + Supertest + mongodb-memory-server — auth flow, role guards,
settings update + geocode (mock Nominatim), contact rate limit, CRUD happy/error paths.
Target ≥ 80% coverage on services and controllers.

11. DOCS: generate OpenAPI 3 spec (zod-to-openapi) served at /api/docs in
non-production only; write docs/API.md. Update SKILLS.md and README.md.
```

## Phase 5 — Admin panel prompt

The admin panel lives inside the frontend at `/admin`, lazy-loaded and never prerendered or indexed. It is where the company turns social links on or off, changes the address that drives the map, and manages all content.

```text
ROLE: You are a senior React engineer. Build the admin panel at /admin in /frontend,
using the Phase 4 API. Same brand tokens, glass style and Manrope, but calmer motion.

1. ROUTING + ACCESS
- /admin/login public; everything else behind <ProtectedRoute> that calls
  GET /auth/me; redirect to login on 401; silent refresh via /auth/refresh before
  retrying once.
- Role-aware sidebar (editor sees content only; admin adds Settings + Messages;
  superadmin adds Users + Audit Log).
- <meta name="robots" content="noindex,nofollow"> on all admin routes; excluded from
  sitemap and prerender; admin bundle code-split from public bundle.

2. LOGIN PAGE
Centered glass card over dark mountain photo; logo; email + password (show/hide);
"Remember this device"; "Forgot password"; Turnstile challenge after 3 failed tries;
clear error messages without revealing which field was wrong; lockout message.
First login forces password change (min 12 chars, strength meter).

3. SHELL: collapsible sidebar (icons + labels), top bar with search (shadcn Command,
Ctrl/Cmd+K), theme toggle, profile menu, logout. Breadcrumbs. Toasts for every
save/delete. Unsaved-changes guard on forms.

4. DASHBOARD: cards for new messages, published projects, posts, open jobs, recent
applications; recent activity from AuditLog; quick actions.

5. SETTINGS (tabs)
- Company: name, legal name, motto, logos (light + dark upload with preview).
- Contact: phones, emails, WhatsApp, office hours.
- Address & Map: address fields + "Find on map" button (POST /settings/geocode) →
  live Leaflet preview with a draggable copper marker; dragging sets
  manualOverride = true and saves exact lat/lng; zoom slider; "Reset to geocoded".
  Saved location is what the public Contact page map and footer use.
- Social Media: one row per platform (Facebook, Instagram, LinkedIn, YouTube, X,
  TikTok, WhatsApp, Viber) with URL input (validated), shadcn Switch for Active,
  drag handle to reorder. Only active rows with a valid URL show on the site
  (navbar/footer/contact).
- SEO: default title, description, keywords, OG image, Google Search Console
  verification code, analytics ID (loaded only after cookie consent).
- Footer: short about text, extra links list.
- Appearance: default theme (light/dark/system).

6. CONTENT MANAGERS (Projects, News, Jobs, Team, Services)
shadcn data table: search, filter, sort, pagination, bulk publish/unpublish/delete
(with AlertDialog confirm). Editor form: RHF + Zod, rich text (TipTap) with headings,
lists, links, images; slug auto + editable; SEO fields with live Google snippet
preview and character counters; cover image + gallery from Media library; draft /
publish / schedule; preview in new tab.

7. MEDIA LIBRARY: grid, drag-and-drop upload with progress, required alt text,
copy URL, delete (blocked if in use), filter by type.

8. MESSAGES + APPLICATIONS: inbox list (new/read/replied/spam), detail drawer,
mark status, reply via mailto, export CSV, download CV.

9. USERS (superadmin): invite by email, set role, deactivate, reset password, force
logout. AUDIT LOG: filterable table (who, what, when, IP).

10. TESTS: Playwright — login, lockout, edit settings address → public map moves,
toggle Instagram off → icon disappears from footer, create + publish a project.
Update SKILLS.md and README.md.
```

## Phase 6 — Security hardening prompt

Run this as a dedicated review pass across both folders before the first deploy, and again before each major release.

```text
ROLE: You are an application security engineer. Audit and harden /frontend and
/backend against the OWASP Top 10 (2021) and OWASP API Security Top 10, then write
docs/SECURITY.md listing every control and how to verify it.

AUTHENTICATION + SESSIONS
- argon2id (memoryCost ≥ 19 MiB, timeCost 2); password min 12 chars, checked
  against a common-password list.
- JWTs in httpOnly + Secure + SameSite=Strict cookies only — never localStorage.
- Refresh token rotation + reuse detection (bump version, revoke all sessions).
- Account lockout after 5 failures for 15 min; generic login error messages.
- Optional TOTP 2FA for admin/superadmin (otplib) — recommended ON for superadmin.
- CSRF: SameSite=Strict + double-submit CSRF token header on all state-changing
  admin requests.

AUTHORIZATION: role check on every admin route server-side (never trust the UI);
object-level checks; deny by default; tests for each role.

INPUT + OUTPUT
- Zod validation on every body, query and param; reject unknown keys.
- express-mongo-sanitize + no $where/$regex from user input; escape regex in search.
- Rich text sanitized server-side with sanitize-html (allowlist tags) and rendered
  with DOMPurify on the client.
- File uploads: MIME + magic-byte check, size limits, random filenames, stored on
  Cloudinary (not the app server), no SVG uploads from users.

HEADERS + TRANSPORT
- helmet: strict CSP (self + Cloudinary + OpenStreetMap tiles + Turnstile + fonts
  self-hosted), HSTS 1 year + preload, frame-ancestors 'none', referrer-policy
  strict-origin-when-cross-origin, permissions-policy minimal.
- HTTPS everywhere; redirect HTTP → HTTPS; CORS allowlist only.

ABUSE PROTECTION
- Rate limits: global 300/15 min/IP; login 10/15 min/IP; contact 5/hour/IP;
  geocode 30/hour/admin. Turnstile on contact, apply and login after failures.
- Honeypot fields; request body limit 1 MB; slow-loris protection via proxy timeouts.

SECRETS + DATA
- No secrets in git; .env in .gitignore; GitHub Actions secrets + host env vars.
- MongoDB Atlas: dedicated least-privilege DB user, IP access list (host egress IPs),
  TLS, encrypted at rest, daily backups with 7-day retention + monthly restore test.
- Logs redact passwords, tokens, cookies, emails in error traces.
- Privacy: collect only needed contact data; retention policy (delete messages after
  24 months); cookie consent before analytics.

SUPPLY CHAIN + MONITORING
- pnpm audit + GitHub Dependabot + CodeQL in CI; fail build on high/critical.
- Pin Node version (.nvmrc), lockfile committed.
- Uptime monitor on /api/v1/health (UptimeRobot or Better Stack), Sentry for
  frontend + backend errors, alert email to admin.

DELIVER: fixes applied, SECURITY.md checklist with pass/fail, and a short
penetration-test script (OWASP ZAP baseline scan in CI). Update SKILLS.md.
```

## Phase 7 — CI/CD, deployment and hosting prompt

The default path is the cheapest reliable one: frontend on Vercel, backend on Render, database on MongoDB Atlas. A VPS option is included if you prefer a Nepal-based host.

| Part | Recommended host | Alternative | Notes |
| --- | --- | --- | --- |
| Frontend (static + prerendered) | Vercel | Netlify, Cloudflare Pages | Free tier is enough to start; custom domain + HTTPS included |
| Backend API | Render (web service) | Railway, Fly.io, VPS | Free tier sleeps when idle; use a paid instance for production |
| Database | MongoDB Atlas | Self-hosted MongoDB on VPS | Pick the Mumbai (ap-south-1) region for lowest latency from Nepal |
| Media | Cloudinary | Cloudflare R2 | Image resizing and AVIF/WebP delivery |
| Domain + DNS | Cloudflare DNS | Your registrar | Use `niraummetals.com` or a `.com.np` domain |

```text
ROLE: You are a DevOps engineer. Set up CI/CD and production deployment for the
monorepo (/frontend, /backend). Write docs/DEPLOYMENT.md step by step for a
non-expert.

1. BRANCHING: main = production, develop = staging, feature/* → PR into develop.
Branch protection: PR review + green CI required; Conventional Commits; release
Please (or changesets) generates CHANGELOG.md and version tags.

2. GITHUB ACTIONS
- ci.yml (on PR + push): pnpm install with cache → lint → typecheck → unit tests
  (frontend + backend, with coverage) → build both → Playwright e2e against
  docker-compose stack → Lighthouse CI on built frontend (fail < 90) → CodeQL +
  pnpm audit → OWASP ZAP baseline on staging.
  Use path filters so only the changed folder's jobs run.
- deploy-frontend.yml: on push to main (frontend/** changed) → build → deploy to
  Vercel production; on develop → Vercel preview/staging.
- deploy-backend.yml: on push to main (backend/** changed) → build Docker image →
  push to GHCR → trigger Render deploy hook; run DB migrations/seed-if-empty; smoke
  test /api/v1/health; auto-rollback to previous image on failure.
- Secrets only in GitHub Actions secrets / host env vars.

3. DOCKER: multi-stage Dockerfiles (node:20-alpine), non-root user, healthcheck,
.dockerignore. docker-compose.yml for local dev: mongo, backend, frontend.

4. ENVIRONMENTS: development (local), staging (develop branch, separate Atlas DB),
production (main). Different secrets per environment.

5. DOMAIN + DNS: frontend at https://www.<domain>, API at https://api.<domain>,
admin at https://www.<domain>/admin. Cloudflare DNS, proxy on, SSL Full (strict),
redirect apex → www.

6. ALTERNATIVE: VPS / Nepali hosting (cPanel or Ubuntu VPS)
- Ubuntu 24.04, ufw (22, 80, 443), fail2ban, unattended-upgrades, SSH keys only.
- Nginx reverse proxy: serve frontend/dist as static with long cache headers for
  hashed assets; proxy /api to Node on 127.0.0.1:5000; gzip/brotli; Certbot TLS.
- Run backend with PM2 (cluster mode, startup script) or Docker Compose.
- GitHub Actions deploy via SSH (appleboy/ssh-action): pull, build, pm2 reload.
- On cPanel shared hosting: upload frontend/dist to public_html with an .htaccess
  SPA fallback; host the API on Render/Railway since most shared hosts lack Node.

7. POST-DEPLOY: submit sitemap to Google Search Console and Bing Webmaster; create
Google Business Profile for the Lalitpur office; set up UptimeRobot and Sentry
alerts; verify Lighthouse and security headers (securityheaders.com).

DELIVER: workflows, Dockerfiles, nginx.conf sample, DEPLOYMENT.md, and a rollback
runbook. Update SKILLS.md and README.md.
```

## Phase 8 — SKILLS.md, README, free media and final QA

`SKILLS.md` is the agent's running memory of the project, so every new session knows what exists and what is next. `README.md` is the human front door.

```text
ROLE: You are the tech lead. Create and maintain these files at the repo root.
Update them at the END of every phase and every working session.

SKILLS.md — project tracker for humans and AI agents
# Niraum Metals — SKILLS & Progress Tracker
## 1. Project snapshot (one paragraph: what it is, stack, live URLs)
## 2. Conventions (naming, folder rules, commit style, branch rules, code style,
##    how to add a page / section / API route / model — step by step)
## 3. File map (every important file/folder with one-line purpose; keep current)
## 4. Phase checklist
- [ ] Phase 1 Design (Stitch) - [ ] Phase 2 Architecture - [ ] Phase 3 Frontend
- [ ] Phase 4 Backend - [ ] Phase 5 Admin - [ ] Phase 6 Security
- [ ] Phase 7 CI/CD + Deploy - [ ] Phase 8 Docs + QA
## 5. Feature status table (feature | owner | status | files | tests)
## 6. Session log (date | what changed | files touched | open issues) newest first
## 7. Known issues / tech debt
## 8. Next steps (top 5, ordered)
## 9. Environment variables (name | where used | example — never real values)
## 10. Placeholders still to replace (business facts, media, legal text)

README.md
- Logo + motto, one-line description, badges (CI, coverage, license).
- Tech stack table. Architecture overview + link to docs/ARCHITECTURE.md.
- Prerequisites (Node 20, pnpm 9, Docker). Quick start: clone → pnpm i →
  copy .env.example → docker compose up → pnpm dev (frontend :5173, API :5000).
- Scripts table for both folders. Seeding the first admin.
- Folder structure tree. Testing. Deployment summary + link to DEPLOYMENT.md.
- Security summary + link to SECURITY.md. Contributing (branch + commit rules).
- Media credits and licences. License. Contact.

Also keep: CHANGELOG.md (auto), docs/API.md, docs/adr/0001-*.md for key decisions.
```

### Free media to use for now

These libraries allow free commercial use without attribution, but they are royalty-free, not public domain. Check each item's licence page, avoid photos showing other companies' logos or identifiable people in sensitive contexts, and replace them with real Niraum site photos as soon as you have them.

| Library | Type | Licence | Search terms to use |
| --- | --- | --- | --- |
| [Pexels](https://www.pexels.com/license/) | Photos + video | Pexels License | open pit mine, quarry, iron ore, excavator, Himalaya, mining worker |
| [Unsplash](https://unsplash.com/license) | Photos | Unsplash License | mining, rock texture, Nepal mountains, heavy machinery, steel |
| [Pixabay](https://pixabay.com/service/license-summary/) | Photos + video | Pixabay Content License | quarry, ore, mining truck, drone mine |
| [Mixkit](https://mixkit.co/license/) | Video | Mixkit License | industrial, construction, mountains aerial |
| [Coverr](https://coverr.co/license) | Video | Coverr License | mining, machinery, mountain drone |

Add this to the Phase 3 prompt when building:

```text
MEDIA RULES: Use only Pexels, Unsplash, Pixabay, Mixkit or Coverr assets for now.
Store source URL, author and licence for each file in frontend/src/assets/CREDITS.md.
Hero video: 1080p, ≤ 8 MB, muted, loop, playsinline, with a poster image; serve a
720p version on mobile and a static image when Save-Data or reduced motion is on.
Compress images to AVIF/WebP, max 2400 px wide, ≤ 300 KB for full-bleed photos.
Rock and metal textures: tileable, ≤ 60 KB, used at low opacity.
```

### Final QA checklist (run before go-live)

- [ ] All pages match Stitch designs in light and dark, at 360, 390, 768, 1024, 1280 and 1536 px
- [ ] Text on every photo and video is readable in both themes (contrast ≥ 4.5:1)
- [ ] Lighthouse mobile ≥ 90 on Home, Projects, Contact; no console errors
- [ ] Unique title, description, canonical and JSON-LD on every public page; sitemap.xml and robots.txt live
- [ ] Admin: login, lockout, password reset and role permissions all work
- [ ] Changing the address in admin moves the Contact page map pin
- [ ] Turning a social platform off in admin removes its icon from navbar, footer and contact
- [ ] Contact form delivers email, saves to inbox and blocks spam
- [ ] Security headers grade A on securityheaders.com; ZAP baseline has no high alerts
- [ ] Backups configured and one restore tested
- [ ] Legal name consistent everywhere; placeholders replaced with real facts
- [ ] SKILLS.md, README.md and CREDITS.md up to date
