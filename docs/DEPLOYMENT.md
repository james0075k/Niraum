# Deployment

> Skeleton — hosting targets are an open question (ARCHITECTURE.md §12).

## Requirements

- **Static site:** any host that serves `frontend/dist` with nested `index.html` directories and
  a fallback to `/index.html` for `/admin/*` (see `frontend/nginx.conf`), and exposes a build
  deploy hook (→ `REBUILD_HOOK_URL`).
- **API:** container running `backend/Dockerfile` (Node 20, port 4000) reachable **same-site** as
  the website (ADR-0003). `TRUST_PROXY` set to the number of proxies in front.
- **Database:** MongoDB Atlas, IP allow-list restricted to the API egress, dedicated DB user with
  `readWrite` on the app database only, daily backups enabled.
- **Media:** Cloudinary account (`CLOUDINARY_*`).
- **Email:** SMTP credentials; SPF, DKIM and DMARC records on the company domain.

## Pipeline

`ci.yml` runs format, lint, typecheck, unit tests, build, Playwright e2e and Docker builds on
every PR. `deploy-frontend.yml` / `deploy-backend.yml` are manual placeholders until the hosts
are chosen.

## Go-live checklist

- [ ] All `[PLACEHOLDER …]` facts replaced (`grep -r PLACEHOLDER frontend/dist` returns nothing)
- [ ] Real logo files in `frontend/public/logo/`, favicons and `og-image.jpg` generated
- [ ] `robots.txt` sitemap URL and `VITE_SITE_URL` set to the production domain
- [ ] Strong `JWT_*` secrets; first superadmin password changed after seed
- [ ] Lighthouse mobile ≥ 90 on Home, Projects, ProjectDetail, Contact
