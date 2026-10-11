# Deployment

Hosting is decided in [ADR-0005](adr/0005-hosting-vercel-render-atlas.md):

```text
visitor ─▶ https://<domain>        Vercel        static prerendered site + /admin app shell
        └▶ https://api.<domain>    Render        niraum-api (backend/Dockerfile), Singapore
                                     └─▶ MongoDB Atlas (AWS Singapore) · Cloudinary · Resend
DNS: Cloudflare (DNS only, grey cloud)
```

`<domain>` is the company domain. It isn't registered or confirmed yet, so every value below
that uses it is a placeholder until it is.

## Files

| File                                      | What it does                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `frontend/vercel.json`                    | Vercel build (pnpm workspace), retired-page 301s, `/admin` app shell, cache + security headers |
| `render.yaml`                             | Render Blueprint for `niraum-api`: Docker, health check, migrations before deploy, env vars    |
| `.github/workflows/ci.yml`                | format, lint, typecheck, unit tests, build, e2e, Docker builds (every PR and push to main)     |
| `.github/workflows/deploy-backend.yml`    | after CI passes on main: Render deploy hook, then waits until `/health` shows the new commit   |
| `.github/workflows/deploy-frontend.yml`   | manual: rebuild the site through the Vercel deploy hook, then smoke-check key URLs             |
| `frontend/nginx.conf`, `docker-compose.*` | self-hosted alternative and local production check (not used on Vercel/Render)                 |

## How a release flows

1. A PR runs CI. Vercel builds a **preview** of the site for it.
2. Merge to `main` (branch protection: CI must pass first).
   - **Vercel** builds and deploys the site from `main` through its Git integration. The
     prerender fetches published content from the production API (`SSG_API_URL`).
   - **CI** runs on `main`, and then `deploy-backend.yml` deploys that exact commit to Render.
     Render runs `node dist/migrations/run.js` (idempotent) before the new container takes
     traffic. If the health check fails, Render keeps the old one.
3. Content edits in `/admin` call the Vercel deploy hook (`REBUILD_HOOK_URL`, debounced
   `REBUILD_DEBOUNCE_SECONDS`). Scheduled projects and posts trigger it when their `publishedAt`
   arrives (`jobs/publishWatch.ts`, every `PUBLISH_CHECK_MINUTES`).

Keep API changes **backward compatible** (additive fields, new endpoints). The site and the API
deploy separately, and the site may go live a few minutes before the API.

## First-time setup

Do these steps in order. Each account should belong to the company email, not a personal one.

### 1. MongoDB Atlas

1. Create a project `niraum` and a cluster in **AWS Singapore (ap-southeast-1)**, next to the API.
   Use **Flex or M10** for production: M0 (free) has no backups.
2. Database user `niraum-api` with `readWrite` on database `niraum` only.
3. Network access: add Render's **outbound IP ranges** for Singapore (Render → niraum-api →
   Connect → Outbound). Don't use `0.0.0.0/0`.
4. Copy the SRV string as `MONGODB_URI`, with `/niraum` as the database name, e.g.
   `mongodb+srv://niraum-api:…@cluster.xxxxx.mongodb.net/niraum?retryWrites=true&w=majority`.
5. Turn on backups (daily snapshots; point-in-time restore on M10+).

### 2. Cloudinary, email and captcha

- **Cloudinary:** cloud name + API key/secret (`CLOUDINARY_*`), folder `niraum`.
- **Resend:** add `<domain>` and publish the SPF/DKIM records it shows in Cloudflare. Add a DMARC
  record (`_dmarc` TXT `v=DMARC1; p=none; rua=mailto:<inbox>` to start). Then set `RESEND_API_KEY`
  and `MAIL_FROM="Niraum Metals <no-reply@<domain>>"`.
  `CONTACT_INBOX` stays `niraummetals@gmail.com` until a domain mailbox exists ([CONFIRM]).
- **Cloudflare Turnstile:** widget for `<domain>` → site key (`VITE_TURNSTILE_SITE_KEY`,
  Vercel) and secret (`TURNSTILE_SECRET`, Render). Both are needed: with only one, the forms
  answer 400 or show no captcha.

### 3. Render (API)

1. Render → New → **Blueprint** → this repository. It reads `render.yaml` and asks for every
   `sync: false` value. JWT secrets are generated for you.
2. Use these values:

   | Key                      | Value                                                        |
   | ------------------------ | ------------------------------------------------------------ |
   | `CLIENT_URL`             | `https://<domain>`                                           |
   | `ADMIN_URL`              | `https://<domain>`                                           |
   | `CORS_ORIGINS`           | `https://www.<domain>` (if www is also served), else empty   |
   | `API_PUBLIC_URL`         | `https://api.<domain>`                                       |
   | `NOMINATIM_USER_AGENT`   | `NiraumMetalsWebsite/1.0 (<contact email>)`                  |
   | `REBUILD_HOOK_URL`       | the Vercel deploy hook from step 4 (fill it in after step 4) |
   | `SEED_ADMIN_*`           | first admin email + a 12+ character temporary password       |
   | `HR_INBOX`, `INQUIRY_CC` | optional, leave empty if not needed                          |

3. Settings → Custom Domains → add `api.<domain>`. Render shows the CNAME target.
4. Settings → **Deploy Hook** → copy it into the GitHub secret `RENDER_DEPLOY_HOOK_URL`.
5. After the first deploy is healthy, seed once: Render → Shell → `node dist/seed/index.js`.
   It creates the superadmin (forced password change), geocoded settings, the Katujpani deposit,
   product, founder and assay data. It only fills empty collections or upserts, so running it
   again is safe.
6. Sign in at `https://<domain>/admin`, change the password, then remove `SEED_ADMIN_PASSWORD`
   from Render.

### 4. Vercel (site)

1. Vercel → Add New → Project → import this repository. Set **Root Directory** to `frontend`,
   framework **Other**, Node.js **20.x**. Build, install and output settings come from
   `frontend/vercel.json`.
2. Environment variables (Production, and Preview where noted):

   | Key                       | Production                     | Preview                     |
   | ------------------------- | ------------------------------ | --------------------------- |
   | `VITE_SITE_URL`           | `https://<domain>`             | same (canonical URLs)       |
   | `VITE_API_URL`            | `https://api.<domain>/api/v1`  | same                        |
   | `SSG_API_URL`             | `https://api.<domain>/api/v1`  | same                        |
   | `VITE_TURNSTILE_SITE_KEY` | Turnstile site key             | Turnstile test key or empty |
   | `VITE_DEFAULT_LANG`       | `en`                           | `en`                        |
   | `VITE_MAP_TILE_URL`       | tile provider URL (OSM policy) | same                        |

3. Domains: add `<domain>` and `www.<domain>`, and pick one as primary. Vercel redirects the
   other to it. The primary one must match `CLIENT_URL` and `VITE_SITE_URL`.
4. Settings → Git → **Deploy Hooks** → create one for branch `main` → put it in Render's
   `REBUILD_HOOK_URL` and in the GitHub secret `VERCEL_DEPLOY_HOOK_URL`.

Previews run on `*.vercel.app`, which is cross-site to the API. Public pages render from the
prerendered HTML and local fallback content, but `/admin` sign-in does not work there
(SameSite=Strict, ADR-0003). Test the admin on production or locally.

### 5. Cloudflare DNS

All records are **DNS only** (grey cloud). Vercel and Render handle TLS. Proxying would add a
second proxy (change `TRUST_PROXY` to 2) and can break certificate renewal.

| Type  | Name  | Target                                    |
| ----- | ----- | ----------------------------------------- |
| A     | `@`   | `76.76.21.21` (or the value Vercel shows) |
| CNAME | `www` | `cname.vercel-dns.com`                    |
| CNAME | `api` | `niraum-api.onrender.com` (as shown)      |
| TXT   | …     | Resend SPF/DKIM, `_dmarc`                 |

### 6. GitHub

- Environment **production**: secrets `RENDER_DEPLOY_HOOK_URL`, `VERCEL_DEPLOY_HOOK_URL`;
  variables `API_URL=https://api.<domain>`, `SITE_URL=https://<domain>`.
- Branch protection on `main`: require the CI checks (`quality`, `e2e`, `docker`) and a PR.

## Staging

Staging uses **Vercel preview deployments** (one per PR) against the production API, read-only.
A separate staging API isn't set up, to keep costs down. If you need one: add a second service to
`render.yaml` (`niraum-api-staging`, branch `staging`, its own Atlas database and Cloudinary
folder) on `api-staging.<domain>`, plus a Vercel environment for `staging.<domain>`.

## Rollback runbook

| What broke                    | Do this                                                                                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site (bad build, broken page) | Vercel → Deployments → the last good production deployment → **Instant Rollback**. It takes seconds. Automatic deploys from `main` pause until you promote a new one.                               |
| API (errors, failed health)   | A failed health check keeps the old container on its own. For a bad release that is healthy: Render → niraum-api → Events → the last good deploy → **Rollback**. Then revert the commit on `main`.  |
| Bad migration / data          | Migrations are additive and idempotent. Restore the Atlas snapshot from before the deploy into a **new** cluster, check it, then point `MONGODB_URI` at it (or restore in place in a quiet window). |
| Secret leaked                 | Rotate it at the provider and update Render/Vercel. For JWT secrets, changing them signs everyone out. Redeploy.                                                                                    |
| Content mistake published     | Fix or unpublish it in `/admin` (soft delete can be restored). The rebuild hook refreshes the site in about `REBUILD_DEBOUNCE_SECONDS` + build time, or run **Deploy frontend** by hand.            |

After any rollback: write down what happened, revert or fix on a branch, and redeploy through CI.

## Go-live checklist

- [ ] Domain registered; DNS as above; HTTPS works on `<domain>`, `www`, `api`
- [ ] `/api/v1/health` → `{ status: "ok", db: "up", commit: <sha> }`
- [ ] Seeded; superadmin password changed; `SEED_ADMIN_PASSWORD` removed
- [ ] Contact, inquiry and newsletter forms deliver mail (check spam; SPF/DKIM/DMARC pass)
- [ ] Turnstile works on the forms; a media upload in `/admin` lands in Cloudinary
- [ ] Publishing in `/admin` triggers a Vercel build (Render log: "Frontend rebuild triggered")
- [ ] All `[PLACEHOLDER …]` facts replaced (`grep -r PLACEHOLDER frontend/dist` returns nothing)
- [ ] `robots.txt` and `sitemap.xml` show the production domain; submit the sitemap to Search Console
- [ ] `/en/projects` → 301 `/en/our-project`; an unknown URL → branded 404
- [ ] Lighthouse mobile ≥ 90 on Home, Our Project, Contact (SKILLS §8)
- [ ] Atlas backups on; Render instance is paid (no sleeping)
- [ ] Phase 6 security review done (CSP, ZAP scan) — **pending: deployed before Phase 6**
