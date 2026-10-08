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
