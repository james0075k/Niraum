# Changelog

All notable changes to this project are documented here. Format:
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- pnpm workspace skeleton (`frontend`, `backend`) with shared TypeScript, ESLint, Prettier,
  Husky, lint-staged and Commitlint configuration.
- Frontend: Vite + React 18 + vite-react-ssg prerendering, Tailwind brand tokens (light/dark),
  glass and texture utilities, theme provider, axios client with refresh handling, motion and
  SEO presets, Vitest and Playwright setup.
- Backend: Express app factory with security middleware, Zod-validated env, pino logging,
  MongoDB connection, error envelope, health endpoint and Supertest test.
- docker-compose (MongoDB 7, Mailpit; optional app profile), Dockerfiles, CI workflow.
- Docs: ARCHITECTURE, API, SECURITY, DEPLOYMENT, ADRs 0001–0004, SKILLS.md.
