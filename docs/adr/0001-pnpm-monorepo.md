# 0001 — pnpm workspace monorepo

- Status: Accepted · 2026-10-08

## Context

Frontend and backend share Zod schema shapes, lint/format rules and CI. They deploy separately.

## Decision

One repository, pnpm workspaces (`frontend`, `backend`). Shared `tsconfig.base.json`,
`eslint.config.js` (flat config), Prettier, Husky + lint-staged + Commitlint at the root.
Each package keeps its own Dockerfile (build context = repo root, `pnpm deploy` for the API).

## Consequences

- One PR can change an API contract and its consumer together.
- Schemas are duplicated by shape (backend `validators/`, frontend `features/*/schema.ts`), not
  shared by import, to keep the frontend bundle free of server code. A `packages/shared` package
  can be introduced later if drift becomes a problem.
