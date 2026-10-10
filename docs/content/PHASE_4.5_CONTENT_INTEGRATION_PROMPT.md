# Phase 4.5 — Real Content, Bilingual and Inquiry Integration

> Paste into your coding agent at the repo root **after Phase 4 (backend) is complete and before Phase 5 (admin)**. Attach: `NIRAUM_MASTER_BLUEPRINT.md`, `Niraum_Web_Assets.zip` (unzipped), `data/assay_data.json`, the new `SKILLS.md`, `README.md` and `docs/ARCHITECTURE.md`.

```text
ROLE: You are a senior full-stack engineer joining a project that has finished
Phases 1–4 (design, architecture, frontend, backend). Your job is to add the real
company content and three new features WITHOUT rewriting or discarding finished work.

GROUND RULES (non-negotiable)
1. Read SKILLS.md, README.md and docs/ARCHITECTURE.md first. Then run the existing
   test suites and record the baseline (all must pass before you change anything).
2. Additive changes only. Do not rename, move or delete existing files, routes,
   models, components or env vars unless this prompt says so. Extend; don't replace.
3. Work on branch feature/phase-4-5-content. Small Conventional Commits, one per step.
4. Every existing test keeps passing. Add tests for everything new.
5. Content facts come ONLY from NIRAUM_MASTER_BLUEPRINT.md and assay_data.json.
   Never invent numbers, certifications, capacities or claims. Items marked
   [CONFIRM] go in as admin-editable placeholders, clearly flagged in the admin UI.
6. At the end, update SKILLS.md (session log, feature table, file map, phase
   checklist), README.md, docs/ARCHITECTURE.md, docs/API.md and CHANGELOG.md.

STEP 1 — ASSETS
- Copy photos/, maps/, brand/ into frontend/src/assets/site/ (WebP for <img>,
  keep PNG originals in /design-assets, not shipped). Generate AVIF + responsive
  widths (480, 768, 1200) with vite-imagetools. Replace stock media where the
  blueprint's Image Placement Map names a real file; keep stock only where no real
  image exists, and update assets/CREDITS.md (real images: "© Niraum Metals /
  Shubharambha Mining and Engineering Services, used with permission").
- Logos: replace placeholder logo with brand/Brand_Logo_Full_Transparent and
  Brand_Logo_Emblem_Transparent; regenerate favicons and og-image.
- Hero image is only ~1100 px wide: use it with object-cover, the gradient
  overlay and a subtle scale/parallax; on ≥1600 px screens add a 2px backdrop blur
  so upscaling is not visible. Keep the video slot ready for real footage later.

STEP 2 — BILINGUAL (English / नेपाली)
Frontend:
- Add react-i18next + i18next-browser-languagedetector. Namespaces: common, home,
  about, project, products, technical, sustainability, investors, contact, admin.
  Seed en + ne JSON from blueprint section 8; missing ne keys fall back to en.
- Routing: prefix public routes with /:lang(en|ne). "/" redirects to /en (or the
  saved/browser language). Admin stays at /admin (English only for now).
- Language toggle in navbar (EN | नेपाली), persists in localStorage (try/catch),
  updates <html lang>. Load Mukta (Devanagari) and apply when lang="ne".
- SEO: per-language title/description, canonical, hreflang en/ne/x-default;
  prerender both language trees; sitemap includes both.
Backend:
- Add a LocalizedString type { en: string; ne?: string } as a Mongoose sub-schema.
- Convert user-facing text fields on Project, Post, Service, TeamMember, Job,
  SiteSettings (motto, about, footer) to LocalizedString. Write an idempotent
  migration script (backend/src/migrations/2026-10-localize-fields.ts) that turns
  existing plain strings into { en: value }. Run it in seed and document it.
- Public GET endpoints accept ?lang=en|ne and return resolved strings (fallback en);
  admin endpoints return the full { en, ne } objects. Zod schemas updated.

STEP 3 — NEW CONTENT MODELS + API
- Product: name, slug, chemicalFormula, summary, applications[{title, body}]
  (all LocalizedString), typicalChemistry [{oxide, value, unit, basis}],
  sizes[], minOrder, packing, image, published. Seed "Industrial Hematite Iron Ore".
- Deposit (or extend Project): location {district, municipality, ward, province,
  topoSheet, easting, northing, spotHeightM, lat?, lng?}, areas [A,B,C], land
  {surveyHa, quarryHa, totalLandUseHa, landType}, geologySummary, consultant,
  status. Seed Katujpani from the blueprint. lat/lng stay empty until confirmed.
- AssaySample: sample, dataset (grab_B_C | grab_A | channel_B | channel_C |
  channel_KXY), SiO2, LOI?, Fe, Fe2O3, Al2O3, CaO?, MgO?, lengthM?, note.
- AssaySummary: section, thicknessM, SiO2, Fe, Fe2O3, Al2O3 + an overall row.
- Seed both from data/assay_data.json via backend/src/seed/assay.seed.ts.
  Add a unit test that recomputes the length-weighted averages and asserts
  Fe 23.48, Fe2O3 33.59, SiO2 53.05 (±0.02).
- Inquiry (bulk supply): companyName, contactName, email, phone, buyerType
  (cement|steel_foundry|trader|investor|other), quantity, quantityUnit
  (tpm|one_off_t), deliveryLocation, specRequirement, message, lang, status
  (new|contacted|quoted|won|lost|spam), source page, ip, userAgent.
  POST /api/v1/inquiries (Turnstile, honeypot, 5/hour/IP), email to
  CONTACT_INBOX + auto-reply in the visitor's language. Admin GET/PATCH, CSV export.
- Settings: add publicAssayDetail (boolean, default false). When false, public
  API returns only AssaySummary; sample-level rows require a "Request full assay"
  inquiry. Add founder fields to TeamMember (isFounder, otherVentures[]).
- Routes: GET /products, /products/:slug, /deposits/:slug, /assay/summary,
  /assay/samples?dataset= (respects publicAssayDetail). Update OpenAPI + API.md.

STEP 4 — PAGES (reuse existing components, motion and glass styles)
- Navbar order: Home, About, Our Project, Products, Technical Data,
  Sustainability, Investors, Contact + "Request a Quote" + language + theme.
- Home: new hero copy, stats strip (from AssaySummary — never hard-coded),
  "What we supply", project teaser with lease map, field-to-supply timeline,
  sustainability band, inquiry CTA. Exact copy in blueprint section 5.
- About: story + Founder card (Shivahari Pudasaini) + consultant credit.
- Our Project (new page, replaces the generic Projects list as the main entry;
  keep /projects routes working): location block, 4 maps in a tabbed gallery
  with zoom/lightbox, geology map + legend, status, photo gallery.
- Products (new): hematite product page with applications and typical chemistry.
- Technical Data (new): weighted-average table, Fe2O3-by-section bar chart
  (Recharts, brand colours, accessible table fallback), sample table (shadcn
  data table: filter by dataset, sort by Fe) shown only if publicAssayDetail,
  sampling-method photos, mandatory data-origin statement under every table.
- Investors (new): overview, milestones, founder, "Request investor deck" form
  (Inquiry buyerType=investor).
- Contact: add the Bulk Supply Inquiry form as a tab beside the general form.
- Copy rule: never describe the ore as "high-grade". Use the exact application
  wording in the blueprint.

STEP 5 — QA
- Unit + e2e tests for: language switch and URL prefix, hreflang tags, inquiry
  submit (both languages), assay averages, publicAssayDetail toggle, migration
  idempotency. Lighthouse ≥ 90 on /en and /ne home. Light + dark checks on every
  new page, including text over the hero and maps.

STEP 6 — DOCS
Update SKILLS.md, README.md, docs/ARCHITECTURE.md (new models, i18n flow, data
flow diagram), docs/API.md, CHANGELOG.md. List every [CONFIRM] item in
SKILLS.md section 11 so the admin can fill it in Phase 5.
```

## What Phase 5 (Admin) now also needs

Add these screens to the existing Phase 5 prompt: Inquiries inbox (status pipeline + CSV), Products editor, Deposit editor (incl. lat/lng pin), Assay data manager (CSV import, publicAssayDetail switch), and an English/नेपाली tab on every content form.
