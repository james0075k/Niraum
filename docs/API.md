# API — /api/v1

> Implemented in Phase 4. Interactive reference (non-production only): **`/api/docs`**
> (Swagger UI) and **`/api/docs.json`** (OpenAPI 3, generated from the same Zod schemas the
> controllers validate with — `backend/src/docs/openapi.ts`).

## Conventions

| Topic      | Rule                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format     | JSON only (except multipart uploads). Body limit 1 MB.                                                                                                                                                                                                                                                                                                           |
| Success    | `{ data }` or, for lists, `{ data: [], meta: { page, limit, total, pages } }`. Settings updates add `meta.warnings`.                                                                                                                                                                                                                                             |
| Error      | `{ error: { code, message, details? } }` — never a stack trace in production.                                                                                                                                                                                                                                                                                    |
| Codes      | `VALIDATION_ERROR` 400 · `CAPTCHA_FAILED` 400/503 · `CAPTCHA_REQUIRED` 400 · `UNAUTHENTICATED` 401 · `FORBIDDEN` 403 · `PASSWORD_CHANGE_REQUIRED` 403 · `NOT_FOUND` 404 · `CONFLICT` 409 · `PAYLOAD_TOO_LARGE` 413 · `UNSUPPORTED_MEDIA_TYPE` 415 · `ACCOUNT_LOCKED` 423 · `RATE_LIMITED` 429 · `INTERNAL` 500 · `STORAGE_ERROR` 502 · `STORAGE_UNAVAILABLE` 503 |
| Validation | `details` is Zod's `flatten()` → `{ formErrors: [], fieldErrors: { field: [msg] } }`. Unknown fields in update bodies are rejected.                                                                                                                                                                                                                              |
| Lists      | `?page=1&limit=20` (`limit ≤ 50`), `?sort=-publishedAt` (allow-listed fields; unknown → default order), `?q=` full-text search (title + summary/excerpt), plus per-resource filters.                                                                                                                                                                             |
| IDs        | Every document is returned with `id` (no `_id`, no `__v`). Admin routes address documents by `id`, public routes by `slug`.                                                                                                                                                                                                                                      |
| Caching    | Public GETs: `Cache-Control: public, max-age=60, stale-while-revalidate=300`. `/settings/public` adds a strong `ETag` (→ `304` on `If-None-Match`). Admin responses: `no-store`.                                                                                                                                                                                 |
| Tracing    | Every response carries `X-Request-Id` (incoming well-formed IDs from the proxy are kept). Logs are pino JSON with the same id.                                                                                                                                                                                                                                   |
| CSRF       | `SameSite=Strict` cookies + state-changing requests with a foreign `Origin` are refused (`403`).                                                                                                                                                                                                                                                                 |

## Authentication

Cookies, never headers or local storage ([ADR-0003](./adr/0003-auth-httponly-cookies.md)):

| Cookie  | Contents            | Lifetime | Path           | Flags                               |
| ------- | ------------------- | -------- | -------------- | ----------------------------------- |
| `na_at` | access JWT (HS256)  | 15 min   | `/api`         | HttpOnly · Secure · SameSite=Strict |
| `na_rt` | refresh JWT (HS256) | 7 days   | `/api/v1/auth` | HttpOnly · Secure · SameSite=Strict |

Both tokens carry the user's `refreshTokenVersion`; logout, password change/reset, role change
and deactivation bump it, which ends **every** session of that user at once. The access cookie
is checked against the database on each request, so revocation is immediate.

| Method | Path                    | Body                                 | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------ | ----------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/login`           | `{ email, password, captchaToken? }` | 10 / 15 min / IP. Every `401` has `details.captcha` (true once the account has ≥ `LOGIN_CAPTCHA_AFTER` = 3 failures; always false for unknown emails, so they stay indistinguishable). With a captcha secret set, login at that point without `captchaToken` → `400 CAPTCHA_REQUIRED` (`details.captcha: true`); bad token → `CAPTCHA_FAILED`. 5 wrong passwords → `423 ACCOUNT_LOCKED` for 15 min (checked before the captcha). Audit-logged. |
| POST   | `/auth/refresh`         | — (cookie `na_rt`)                   | Rotates: issues a new access **and** refresh token.                                                                                                                                                                                                                                                                                                                                                                                            |
| POST   | `/auth/logout`          | —                                    | `204`. Clears both cookies, bumps the version.                                                                                                                                                                                                                                                                                                                                                                                                 |
| POST   | `/auth/forgot`          | `{ email }`                          | Always `202`. Emails a single-use token (only its SHA-256 is stored), valid 30 min. 5 / h / IP.                                                                                                                                                                                                                                                                                                                                                |
| POST   | `/auth/reset`           | `{ token, password }`                | Password ≥ 12 chars. Token is cleared atomically on use.                                                                                                                                                                                                                                                                                                                                                                                       |
| POST   | `/auth/change-password` | `{ currentPassword, newPassword }`   | Signed in. Re-issues cookies for this session, ends the others.                                                                                                                                                                                                                                                                                                                                                                                |
| GET    | `/auth/me`              | —                                    | Current user (`mustChangePassword` tells the admin UI to force the change screen).                                                                                                                                                                                                                                                                                                                                                             |

While `mustChangePassword` is true (seeded superadmin, users created by a superadmin), every
authenticated route except `me`, `change-password` and `logout` answers
`403 PASSWORD_CHANGE_REQUIRED`.

## Public endpoints

| Method | Path                      | Query / body                                                                    | Notes                                                                      |
| ------ | ------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| GET    | `/health`                 | —                                                                               | `{ data: { status, uptime, db, commit } }` (`commit` = Render release SHA) |
| GET    | `/settings/public`        | —                                                                               | Public projection; `social` = active only, sorted by `order`. ETag, 60 s.  |
| GET    | `/services`               | `page limit sort q`                                                             | Ordered by `order`.                                                        |
| GET    | `/services/:slug`         |                                                                                 |                                                                            |
| GET    | `/projects`               | `page limit sort q status mineral featured`                                     | Default order: featured, then newest published.                            |
| GET    | `/projects/:slug`         |                                                                                 |                                                                            |
| GET    | `/posts`                  | `page limit sort q tag`                                                         | Newest `publishedAt` first.                                                |
| GET    | `/posts/:slug`            |                                                                                 |                                                                            |
| GET    | `/jobs`                   | `page limit sort q department type`                                             | `isOpen` and deadline not passed.                                          |
| GET    | `/jobs/:slug`             |                                                                                 |                                                                            |
| GET    | `/team`                   | `page limit sort`                                                               | Ordered by `order`. No detail route.                                       |
| POST   | `/contact`                | `{ name, email, phone?, company?, subject, message, website?, captchaToken? }`  | 5 / hour / IP. See below.                                                  |
| POST   | `/applications`           | multipart: `name email phone message? job? website? captchaToken?` + `cv` (PDF) | 5 / hour / IP. CV ≤ 5 MB, checked by magic bytes.                          |
| POST   | `/newsletter`             | `{ email, source?, website? }`                                                  | Always `202`. Double opt-in. 5 / 10 min / IP.                              |
| GET    | `/newsletter/confirm`     | `?token=`                                                                       | `303` → `CLIENT_URL/?newsletter=confirmed` (or `invalid`).                 |
| GET    | `/newsletter/unsubscribe` | `?token=`                                                                       | `303` → `CLIENT_URL/?newsletter=unsubscribed` (or `invalid`).              |
| GET    | `/seo/sitemap-data`       | —                                                                               | `{ projects, posts, jobs: [{ slug, updatedAt }], generatedAt }`            |

Public responses only include published / open, non-deleted documents and never expose
`isDeleted`, `deletedAt`, `createdBy`, `updatedBy`.

**Contact flow.** Zod → honeypot (`website` filled ⇒ stored as `spam`, same `201`, no email) →
Turnstile/reCAPTCHA verification (`captchaToken`; skipped only when no secret is configured,
which production does not allow) → `Message` saved with IP and user agent → notification to
`CONTACT_INBOX` (reply-to = sender) and an auto-reply to the sender. Email failures are logged,
never surfaced.

**Applications.** Optional `job` is the job **slug**; it must be open and before its deadline,
otherwise `400`. Without `job` it is a general application. The CV is uploaded to Cloudinary as
a **private** raw file (`niraum/applications/`); admins get a short-lived signed URL. HR
(`HR_INBOX`, default `CONTACT_INBOX`) is emailed; the applicant gets an acknowledgement.

## Admin endpoints (`/admin`, cookie auth)

| Resource                                        | Routes                                                                                                                                       | Roles      |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `projects`, `posts`, `jobs`, `team`, `services` | `GET /` · `POST /` · `GET /:id` · `PUT /:id` · `DELETE /:id` (soft) · `POST /:id/restore`                                                    | editor+    |
| `media`                                         | `GET /?type=image\|video\|document` · `POST /` (multipart `file`, `alt`) · `PATCH /:id { alt }` · `DELETE /:id`                              | editor+    |
| `settings`                                      | `GET /` · `PUT /` · `POST /geocode { address }`                                                                                              | admin+     |
| `messages`                                      | `GET /?status=` · `PATCH /:id { status: new\|read\|replied\|spam }`                                                                          | admin+     |
| `applications`                                  | `GET /?status=` · `GET /:id` (+ signed `cvUrl`) · `PATCH /:id { status }`                                                                    | admin+     |
| `dashboard`                                     | `GET /` — content counts + assay summary; admin+ also get `inbox` (new inquiries/messages/applications) and `recent` (last 10 audit entries) | editor+    |
| `audit`                                         | `GET /?entity=&entityId=&user=`                                                                                                              | admin+     |
| `rebuild`                                       | `POST /` — call the frontend deploy hook now                                                                                                 | admin+     |
| `users`                                         | `GET /` · `POST /` · `PUT /:id { name?, role?, isActive? }` · `DELETE /:id` (deactivate)                                                     | superadmin |

Roles: **editor** — content and media · **admin** — + settings, inbox, audit, rebuild ·
**superadmin** — + users. The last active superadmin can't be demoted or deactivated, and
nobody can deactivate themselves.

**Content lists** accept `state=all|draft|published` (default `all`) and `trash=true` (soft-
deleted items) in addition to the public filters.

**Writes.** Slugs are generated from the title on create (`slugify`, lowercase, then `-2`,
`-3`…). Editing a title does **not** change the slug (stable URLs); send `slug` to change it.
Soft-deleted items keep their slug reserved. Rich-text fields (`body`, job `description`) are
sanitised with an allow-list on every write. Turning `published`/`isOpen` on sets `publishedAt`
the first time (unless one is sent). **Scheduling:** projects and posts accept a future
`publishedAt`; until then a published item is left out of public lists, detail pages (`404`) and
`/seo/sitemap-data`. Every create / update / delete / restore / publish / unpublish writes an
`AuditLog` entry with a field diff (secrets omitted), and changes to public content schedule a
debounced call to `REBUILD_HOOK_URL`.

**Media.** jpg / png / webp / avif ≤ 8 MB (alt text required), pdf ≤ 5 MB, mp4 ≤ 50 MB. The
declared MIME type must match the file's magic bytes. Files go to `CLOUDINARY_FOLDER/{images,
documents,videos}`; the record stores `url`, `publicId`, `alt`, size and dimensions. Delete
removes the Cloudinary asset first and keeps the record if that fails (`502`).

### Settings and the map pin

`PUT /admin/settings` accepts any subset of the settings sections (nested objects are merged).
When `address` changes and `location.manualOverride` is `false`, the API geocodes it:

1. Nominatim `search?format=json&limit=1&countrycodes=np` with `NOMINATIM_USER_AGENT`,
   at most 1 request/second process-wide, results cached for 30 days (Mongo TTL collection).
2. No match for the full address → retry without line 1 (city level) and return the warning
   `GEOCODE_APPROXIMATE`.
3. No match or the service is down → **keep the previous coordinates** and return
   `GEOCODE_FAILED` so the admin can drop the pin manually.

```json
{
  "data": { "...": "full settings" },
  "meta": { "warnings": [{ "code": "GEOCODE_FAILED", "message": "…" }] }
}
```

Dropping a pin = `PUT { location: { lat, lng, manualOverride: true } }`; from then on address
edits never move it. `POST /admin/settings/geocode { address }` previews coordinates without
saving: `{ ok, lat, lng, displayName, approximate, cached, query }` or `{ ok: false, reason }`.
Public settings are cached in memory for 60 s and the cache is cleared on every update.

## Phase 4.5 — languages, assay data, inquiries

### Languages (`?lang=`)

Every public GET accepts `?lang=en|ne` (unknown values → `en`). Text fields are stored as
`LocalizedString { en, ne? }`; public responses return plain strings in the requested language,
falling back to English per field, so response shapes are unchanged.

Admin responses keep the English strings in the same fields **and** add `translations` with the
full objects, e.g. `{ "title": "Iron Hills", "translations": { "title": { "en": "Iron Hills",
"ne": "फलाम पहाड" } } }`. Admin writes accept either a string (English) or `{ en, ne? }`; writing
`en` alone keeps the stored Nepali (send `ne: ""` to clear it).

`GET /settings/public?lang=` is cached and ETagged per language and now includes
`publicAssayDetail` and `defaultLanguage`.

### Products and deposits (content resources)

| Method | Path                                 | Notes                                             |
| ------ | ------------------------------------ | ------------------------------------------------- |
| GET    | `/products`, `/products/:slug`       | Hematite product, applications, typical chemistry |
| GET    | `/deposits`, `/deposits/:slug`       | Katujpani: location (local grid), areas, land     |
| CRUD   | `/admin/products`, `/admin/deposits` | Same pattern as projects (soft delete + restore)  |

Deposit `location.easting/northing` are the report's local grid; `lat/lng` stay `null` until
WGS-84 coordinates are confirmed. `land.confirmed: false` marks figures read from a scan.

### Assay data

| Method | Path                            | Access                                                 |
| ------ | ------------------------------- | ------------------------------------------------------ |
| GET    | `/assay/summary`                | Public: Table 14 sections, deposit average, highlights |
| GET    | `/assay/samples?dataset=&sort=` | Public **only** if `publicAssayDetail`; else `403`     |
| GET    | `/admin/assay/samples`          | editor+ (always)                                       |

`dataset` ∈ `grab_B_C | grab_A | channel_B | channel_C | channel_KXY`; `sort` ∈ `order | Fe |
-Fe | Fe2O3 | -Fe2O3 | SiO2 | -SiO2`. Responses include `source` (consultant, DMG basis,
"not a JORC/NI 43-101 reserve statement").

#### Assay admin writes (Phase 5, editor+)

| Method | Path                                 | Notes                                                           |
| ------ | ------------------------------------ | --------------------------------------------------------------- |
| POST   | `/admin/assay/samples`               | One sample → `201`; optional oxides default to `null`           |
| PUT    | `/admin/assay/samples/:id`           | Partial → `200`                                                 |
| DELETE | `/admin/assay/samples/:id`           | Hard delete → `204`; the audit entry keeps the old values       |
| GET    | `/admin/assay/summary`               | Every summary row (5 sections + deposit average) with ids       |
| PUT    | `/admin/assay/summary/:id`           | Partial numbers only (`section`, `isOverall` stay fixed)        |
| POST   | `/admin/assay/import?dataset=&mode=` | `text/csv` body ≤ 1 MB → `200 { data: { inserted, replaced } }` |

Sample body: `sample` (≤ 30 chars, unique per dataset), `dataset`, `SiO2`, `Fe`, `Fe2O3`, `Al2O3`
(required, 0–100), `LOI`, `CaO`, `MgO` (0–100 or `null`), `lengthM` (≥ 0 or `null`), `note`
(≤ 300), `order`. Summary body: `thicknessM`, `SiO2`, `Fe`, `Fe2O3`, `Al2O3`, `order`. Duplicate
samples → `409 CONFLICT`; unknown fields → `400`.

**CSV import.** `mode` = `replace` (default: the dataset's rows are swapped for the file) or
`append` (added after the existing rows; samples already in the dataset are errors). Header row
required; columns are case-sensitive, in any order: `sample,SiO2,LOI,Fe,Fe2O3,Al2O3,CaO,MgO,lengthM,note`
— `sample`, `SiO2`, `Fe`, `Fe2O3`, `Al2O3` must be present; blank optional cells → `null`.
Quoted fields, CRLF and a UTF-8 BOM are accepted. The import is all-or-nothing: the whole file
is validated first and nothing is written unless every row is valid (Mongo transaction where the
deployment supports one). Errors come back as
`400 VALIDATION_ERROR` with `details: { formErrors: string[], rows: [{ line, errors: string[] }] }`
— `line` is the file line (header = 1), e.g. `{ line: 2, errors: ["Fe must be ≤ 100"] }`. Other
statuses: `413` over 1 MB, `415` when the body isn't `text/csv`.

Every write is audit-logged (`entity: AssaySample | AssaySummary`; imports use
`action: "import"` with `{ dataset, mode, inserted, replaced }`) and schedules the rebuild hook.

### Bulk supply inquiries

`POST /inquiries` — `companyName`, `contactName`, `email`, `phone`, `buyerType`
(`cement | steel_foundry | trader | investor | other`), `topic` (`supply | technical_report |
investor_deck`), optional `quantity` + `quantityUnit` (`tpm | one_off_t`, required with a
quantity), `deliveryLocation`, `specRequirement`, `message`, `lang`, `sourcePage`, honeypot
`website`, `captchaToken`. → `201 { data: { id } }`. Emails `CONTACT_INBOX` (+ `INQUIRY_CC`) and
auto-replies in `lang`. Honeypot hits are stored as `spam` without email.

| Method | Path                          | Access | Notes                                             |
| ------ | ----------------------------- | ------ | ------------------------------------------------- |
| GET    | `/admin/inquiries`            | admin+ | `?status=&buyerType=&q=&page=&limit=` (1)         |
| GET    | `/admin/inquiries/export.csv` | admin+ | same filters; UTF-8 BOM; formulas neutralised     |
| GET    | `/admin/inquiries/:id`        | admin+ |                                                   |
| PATCH  | `/admin/inquiries/:id`        | admin+ | `{ status: new→contacted→quoted→won/lost, spam }` |

(1) `q` matches company, contact name or email (case-insensitive). `meta.counts` holds the
number per status for the same `q`/`buyerType`, ignoring `status` (admin pipeline header).

### Migration

`pnpm --filter backend migrate` (also run by `pnpm seed`) converts pre-4.5 plain-string fields to
`{ en }` and drops the old text indexes. It is idempotent.

## Rate limits

| Scope                        | Limit             |
| ---------------------------- | ----------------- |
| All `/api`                   | 300 / 15 min / IP |
| `POST /auth/login`           | 10 / 15 min / IP  |
| `POST /auth/forgot`, `reset` | 5 / hour / IP     |
| `POST /contact`              | 5 / hour / IP     |
| `POST /applications`         | 5 / hour / IP     |
| `POST /newsletter`           | 5 / 10 min / IP   |
| `POST /inquiries`            | 5 / hour / IP     |

Standard `RateLimit` / `RateLimit-Policy` headers are sent. Counters are in memory per API
instance — use a shared store before running more than one replica.
