# 0005 — Hosting: Vercel (site), Render (API), MongoDB Atlas, Cloudflare DNS

- Status: Accepted · 2026-10-11

## Decision

- **Site:** Vercel, Git integration on `main`, root directory `frontend` (`frontend/vercel.json`).
  It serves the prerendered pages, the `/admin` app shell, the retired-page 301s and the root
  `404.html`. Previews are built per PR. Its deploy hook is the API's `REBUILD_HOOK_URL`.
- **API:** Render web service `niraum-api` from `backend/Dockerfile` (`render.yaml`), region
  Singapore, paid instance, one replica, on `api.<domain>`. It deploys only through the deploy
  hook after CI passes (`deploy-backend.yml`), and runs migrations as `preDeployCommand`.
- **Database:** MongoDB Atlas in AWS Singapore, next to the API rather than Mumbai: every page
  view makes API→DB round trips, but only one browser→API trip.
- **DNS:** Cloudflare, DNS only.

## Consequences

- The API is on a subdomain of the same registrable domain, so cookies stay same-site and
  SameSite=Strict works (ADR-0003). Cookies are host-only on `api.<domain>`; `COOKIE_DOMAIN`
  stays empty. The API must send CORS with credentials for the site origin (`CLIENT_URL`).
- Vercel previews (`*.vercel.app`) are cross-site, so the admin can't sign in there.
- One API replica: rate limits, the settings cache and the scheduled-publish watcher are
  in-process. Add a shared store before scaling out.
- Vercel deploys the site from `main` without waiting for CI; branch protection on `main` is
  what keeps broken code out.
- `frontend/nginx.conf` and the Dockerfiles stay as the self-hosting path and are still built in
  CI.
