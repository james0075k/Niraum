# Phase 5 — Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A client-only, role-aware admin panel at `/admin` that manages every piece of content
the Phase 4/4.5 API already serves — settings, products, deposit, team, assay data, inquiries,
messages, applications, media, users and audit — with English/नेपाली tabs on every content form.

**Architecture:** `/admin/*` is a lazy route tree outside the `/:lang` public tree, never
prerendered (already excluded in `vite.config.ts` `includedRoutes`) and `noindex`. Auth is the
existing httpOnly-cookie API (`/auth/*`) plus the single-flight refresh interceptor in
`src/lib/api.ts`; a `useMe()` query gates routes. Every resource screen is built from two generic
pieces — `ResourceTable` (list) and `ResourceForm` (RHF + Zod, with `LocalizedField` EN/NE tabs)
— driven by a small per-resource config, so adding a resource is configuration, not a new page.
The backend gains only what the admin needs and the API lacks: captcha after 3 failed logins,
scheduled publishing, assay write + CSV import, and a dashboard stats endpoint.

**Tech Stack:** React 18, React Router 6 (via vite-react-ssg route table), TanStack Query 5,
React Hook Form 7 + Zod 3, shadcn/ui (Radix), cmdk, Leaflet/react-leaflet, TipTap 2 (new),
sonner toasts (already in `components/ui/sonner.tsx`), Vitest + Testing Library, Playwright
(system Chrome). Backend: Express 4, Mongoose 8, Zod, Vitest + supertest + in-memory Mongo.

**Spec:** Prompt pack section "Phase 5 — Admin panel prompt" (lines 432–497) +
`docs/content/PHASE_4.5_CONTENT_INTEGRATION_PROMPT.md` (admin additions) + `docs/API.md`
(the contract every screen calls).

## Global Constraints

- Do not push. Commit after each task (commitlint: lowercase subject, no trailing full stop; end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`).
- Never print, log or commit `backend/.env` values (Atlas credentials live only there).
- Facts only from `docs/content/NIRAUM_MASTER_BLUEPRINT.md` and `docs/content/data/assay_data.json`; never call ore "high-grade"; never invent numbers; unknown facts → `[CONFIRM]`.
- `/admin` is never prerendered, never in the sitemap, `<meta name="robots" content="noindex,nofollow">`, and its code is not in any public page's chunk graph (check with the build manifest in Task 1).
- Auth stays cookie-only: no token in localStorage/sessionStorage; every request uses `api` from `src/lib/api.ts` (`withCredentials: true`).
- Password floor 12 characters, ceiling 128 (mirrors `backend/src/validators/auth.ts`).
- Roles: editor = content + media + assay; admin = + settings, inquiries, messages, applications, audit, rebuild; superadmin = + users. UI hides what a role can't do; the API remains the authority (403s are shown as toasts, never crash).
- Every content form that edits a localized field (`resources.ts` `localized:` lists, settings `motto` and `footer.about`) shows **English | नेपाली** tabs; English is required, Nepali optional; saving English alone must not wipe existing Nepali (API merges — send `{ en, ne }` only for fields the user touched in the NE tab).
- Admin UI copy is English only (no i18n keys needed); Devanagari input must render with the Mukta font already loaded by `globals.css`.
- Lint, typecheck, `pnpm --filter backend test`, `pnpm --filter frontend test` and `pnpm --filter frontend build` must pass at the end of every task; a failure after 3 fix attempts = stop and ask.
- Public-site Lighthouse must not regress: admin deps (TipTap, cmdk, dnd) only imported under `src/admin/**`.

## Review Focus

1. **Session expiry mid-edit** — a 15-min access token expires while a long form is open; Save must refresh silently and succeed, and an expired refresh token must send the user to login _without losing the draft_ (draft kept in memory → restored after login in the same tab). Test in Task 3.
2. **Saving English only must keep Nepali** — editing a product's English summary and saving must leave `translations.summary.ne` unchanged. Test in Task 7.
3. **Assay CSV with bad rows** — wrong headers, `Fe` > 100, empty `sample`, duplicate sample in the same dataset: import must be all-or-nothing and report each bad row with its line number. Test in Task 11.
4. **Role downgrade while signed in** — an editor's stale sidebar link to `/admin/settings` (bookmarked or role changed) shows a "You don't have access" page, not a blank screen or loop. Test in Task 4.
5. **Map pin after a failed geocode** — `GEOCODE_FAILED` warning must keep the previous pin, show the warning toast and let the admin drag the marker (which sets `manualOverride: true`). Test in Task 6.

---

## File Structure

```
backend/src/
  services/auth.service.ts            + captcha required after N fails (Task 2)
  validators/auth.ts                  + optional captchaToken on login (Task 2)
  services/content.service.ts         + publishedAt ≤ now for public reads (Task 8)
  services/assay.service.ts           + upsert/delete/importCsv (Task 11)
  validators/assay.ts                 + assaySampleBody, assaySummaryBody, csv row schema (Task 11)
  controllers/assay.controller.ts     + admin write handlers (Task 11)
  controllers/dashboard.controller.ts NEW counts for dashboard cards (Task 5)
  routes/index.ts                     + new admin routes
  docs/openapi.ts                     + new routes
backend/tests/
  auth-captcha.test.ts  schedule.test.ts  assay-admin.test.ts  dashboard.test.ts   NEW

frontend/src/admin/                   everything admin; never imported by public code
  routes.tsx            admin route table (lazy pages, RequireAuth, RequireRole)
  auth/
    useMe.ts            useMe(), useLogin(), useLogout(), useChangePassword()
    RequireAuth.tsx     gate: loading → spinner, 401 → /admin/login?next=, mustChangePassword → /admin/change-password
    RequireRole.tsx     gate per role list → <NoAccess/>
    roles.ts            Role type, can(role, area) matrix
  layout/
    AdminLayout.tsx     sidebar + topbar + <Outlet/> + <Toaster/>
    Sidebar.tsx         nav items filtered by can()
    Topbar.tsx          breadcrumbs, Cmd+K button, ThemeToggle, profile menu, logout
    CommandPalette.tsx  cmdk dialog over nav items + recent records
    Breadcrumbs.tsx
    NoAccess.tsx
  hooks/
    useUnsavedGuard.ts  beforeunload + react-router useBlocker
    useAdminList.ts     generic list query (page, limit, q, sort, filters, state, trash)
    useAdminMutation.ts create/update/delete/restore with toasts + invalidation
  components/
    ResourceTable.tsx   search, filters, sortable headers, pagination, row select, bulk actions
    ResourceForm.tsx    RHF wrapper: dirty tracking, Save / Publish / Schedule, guard
    LocalizedField.tsx  EN | नेपाली tabs for Input / Textarea / RichText
    RichTextEditor.tsx  TipTap (StarterKit + Link), outputs HTML
    SlugField.tsx       auto from title until edited
    SeoPreview.tsx      Google snippet preview (title ≤ 60, description ≤ 160)
    MediaPicker.tsx     dialog over /admin/media with upload
    MapPinPicker.tsx    Leaflet map with draggable marker (settings + deposit)
    StatusBadge.tsx  CsvButton.tsx  ConfirmDialog.tsx  PasswordStrength.tsx
  resources/
    config.ts           ResourceConfig type + configs: products, deposits, team, services, projects, posts, jobs
    localize.ts         toFormValues(doc) / toPayload(values, dirty) for localized fields
  pages/
    Login.tsx  ForgotPassword.tsx  ResetPassword.tsx  ChangePassword.tsx
    Dashboard.tsx
    Settings.tsx (+ settings/{CompanyTab,ContactTab,AddressMapTab,SocialTab,SeoTab,FooterTab,AppearanceTab}.tsx)
    ResourceList.tsx  ResourceEdit.tsx          generic, read :resource param → config
    DepositEdit.tsx                             custom (location pin, areas, land, maps)
    Assay.tsx                                   samples + summary tables, CSV import, public switch
    Inquiries.tsx  InquiryDetail.tsx
    Messages.tsx  Applications.tsx
    Media.tsx  Users.tsx  Audit.tsx
frontend/src/app/router.tsx           + `{ path: '/admin/*', lazy: … }`
frontend/tests/admin/*.test.tsx       unit/component tests
frontend/e2e/admin.spec.ts            Playwright (needs API on :4000 with seed)
```

**Why `src/admin/` and not `src/pages/admin/`:** the admin has its own layout, hooks and
components that the public site must never import; one folder makes that boundary greppable
(`rg "from '@/admin" src --glob '!src/admin/**'` must return nothing — checked in Task 1).
`src/pages/admin/` (currently empty) is removed.

---

### Task 1: Admin route tree, noindex and bundle boundary

**Files:**

- Create: `frontend/src/admin/routes.tsx`, `frontend/src/admin/AdminRoot.tsx`
- Modify: `frontend/src/app/router.tsx` (add admin route), `frontend/package.json` (script `check:admin-boundary`)
- Delete: `frontend/src/pages/admin/` (empty dir)
- Test: `frontend/tests/admin/routes.test.tsx`

**Interfaces:**

- Produces: `adminRoutes: RouteObject[]` (children of `/admin`), `AdminRoot` component (Helmet noindex + QueryClient already provided by App).

- [ ] **Step 1: Failing test** — rendering `/admin/login` via `createMemoryRouter([{ path: '/admin/*', lazy }])` shows a heading "Sign in" and `document.querySelector('meta[name=robots]')?.content === 'noindex,nofollow'`.

```tsx
// frontend/tests/admin/routes.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { adminRoute } from '@/app/router';

it('serves /admin/login client-side with noindex', async () => {
  const router = createMemoryRouter([adminRoute], { initialEntries: ['/admin/login'] });
  render(
    <HelmetProvider>
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </HelmetProvider>,
  );
  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  await waitFor(() =>
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex,nofollow',
    ),
  );
});
```

- [ ] **Step 2:** `pnpm --filter frontend test admin/routes` → FAIL (`adminRoute` not exported).
- [ ] **Step 3: Implement**

```tsx
// frontend/src/app/router.tsx — add and export, then include in the root routes array
export const adminRoute: RouteRecord = {
  path: '/admin/*',
  lazy: () => import('@/admin/AdminRoot').then((m) => ({ Component: m.default })),
};
```

```tsx
// frontend/src/admin/AdminRoot.tsx
import { Helmet } from 'react-helmet-async';
import { useRoutes } from 'react-router-dom';
import { adminRoutes } from './routes';

/** Client-only admin app (never prerendered — vite.config.ts includedRoutes drops /admin). */
export default function AdminRoot() {
  const element = useRoutes(adminRoutes);
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
        <title>Admin · Niraum Metals</title>
      </Helmet>
      {element}
    </>
  );
}
```

`routes.tsx` starts with `login` → `pages/Login.tsx` (a stub with `<h1>Sign in</h1>`, filled in Task 3) and `*` → `<Navigate to="/admin" />`. All later pages are added with `lazy()` wrappers:

```tsx
const lazyPage = (load: () => Promise<{ default: React.ComponentType }>) => {
  const C = React.lazy(load);
  return (
    <Suspense fallback={<PageSpinner />}>
      <C />
    </Suspense>
  );
};
```

The admin route must render without the public `Layout` (Navbar/Footer): place it beside the `/:lang` tree in the root route list, not inside it. If `App.tsx` wraps all routes in the public layout, branch on `pathname.startsWith('/admin')` there.

- [ ] **Step 4:** add `frontend/scripts/check-admin-boundary.mjs` and script `"check:admin-boundary": "node scripts/check-admin-boundary.mjs"`:

```js
// Fails if public code imports the admin app (only router.tsx may, lazily).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
const root = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const bad = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = relative(root, p).split('\\').join('/');
    if (rel === 'admin' || rel === 'app/router.tsx') continue;
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(name) && readFileSync(p, 'utf8').includes('@/admin'))
      bad.push(rel);
  }
})(root);
if (bad.length) {
  console.error(`Public code imports @/admin:\n${bad.join('\n')}`);
  process.exit(1);
}
```

Run it + the test → PASS. `pnpm --filter frontend build`, then `grep -c AdminRoot dist/en/index.html` → `0`.

- [ ] **Step 5: Commit** `feat(admin): lazy client-only admin route with noindex`

---

### Task 2: Backend — captcha after 3 failed logins

**Files:**

- Modify: `backend/src/validators/auth.ts`, `backend/src/services/auth.service.ts`, `backend/src/controllers/auth.controller.ts`, `backend/src/config/env.ts` (`LOGIN_CAPTCHA_AFTER`, default 3), `backend/src/docs/openapi.ts`, `docs/API.md`
- Test: `backend/tests/auth-captcha.test.ts`

**Interfaces:**

- Produces: `POST /auth/login { email, password, captchaToken? }`. After `failedLoginCount >= LOGIN_CAPTCHA_AFTER` and a captcha secret is configured, a missing/invalid token → `400 CAPTCHA_REQUIRED` with `details: { captcha: true }`. Every `401 INVALID_CREDENTIALS` response carries `details: { captcha: boolean }` so the UI knows to render Turnstile next time. `423 ACCOUNT_LOCKED` keeps `details.retryAt`.

- [ ] **Step 1: Failing test**

```ts
// backend/tests/auth-captcha.test.ts
import request from 'supertest';
import { vi } from 'vitest';
import { createApp } from '../src/app.js';
import { captchaService } from '../src/services/captcha.service.js';
import { env } from '../src/config/env.js';
import { createUser, PASSWORD } from './helpers.js';

const app = createApp();
const login = (email: string, password: string, captchaToken?: string) =>
  request(app).post('/api/v1/auth/login').send({ email, password, captchaToken });

it('asks for a captcha after 3 wrong passwords and requires it when configured', async () => {
  const user = await createUser('editor');
  for (let i = 1; i <= 3; i += 1) {
    const res = await login(user.email, 'wrong-password-xx');
    expect(res.status).toBe(401);
    expect(res.body.error.details.captcha).toBe(i >= 3);
  }
  vi.spyOn(env, 'TURNSTILE_SECRET', 'get').mockReturnValue('secret');
  const verify = vi.spyOn(captchaService, 'verify');
  const noToken = await login(user.email, PASSWORD);
  expect(noToken.status).toBe(400);
  expect(noToken.body.error.code).toBe('CAPTCHA_REQUIRED');
  verify.mockResolvedValueOnce();
  expect((await login(user.email, PASSWORD, 'tok')).status).toBe(200);
});

it('does not require a captcha before the threshold', async () => {
  const user = await createUser('editor');
  expect((await login(user.email, PASSWORD)).status).toBe(200);
});
```

(If `env` is a frozen object, expose `captchaConfigured()` from `captcha.service.ts` and spy on that instead — check `config/env.ts` first.)

- [ ] **Step 2:** `pnpm --filter backend test auth-captcha` → FAIL.
- [ ] **Step 3: Implement** — `loginBody` gains `captchaToken: z.string().max(2048).optional()`. In `authService.login(email, password, actor, captchaToken?)`, after the lock check and before `argon2.verify`:

```ts
const needsCaptcha = user.failedLoginCount >= env.LOGIN_CAPTCHA_AFTER;
if (needsCaptcha && captchaConfigured()) {
  if (!captchaToken) {
    throw new AppError(400, 'CAPTCHA_REQUIRED', 'Please complete the verification', {
      captcha: true,
    });
  }
  await captchaService.verify(captchaToken, actor.ip ?? '');
}
```

`invalidCredentials(captcha: boolean)` adds `{ captcha }` to details; for unknown emails pass `false` (no enumeration: unknown email and below-threshold wrong password look identical). Controller passes `captchaToken`. Add `CAPTCHA_REQUIRED 400` to the codes row in `docs/API.md` and the login row note.

- [ ] **Step 4:** test → PASS; run whole backend suite (auth.test.ts must still pass).
- [ ] **Step 5: Commit** `feat(auth): require captcha after three failed logins`

---

### Task 3: Auth client, login, forced password change, forgot/reset

**Files:**

- Create: `frontend/src/admin/auth/{useMe.ts,RequireAuth.tsx,roles.ts}`, `frontend/src/admin/pages/{Login,ChangePassword,ForgotPassword,ResetPassword}.tsx`, `frontend/src/admin/components/PasswordStrength.tsx`
- Modify: `frontend/src/admin/routes.tsx`, `frontend/src/lib/api.ts` (emit `auth:expired` event when refresh fails)
- Test: `frontend/tests/admin/login.test.tsx`, `frontend/tests/admin/require-auth.test.tsx`

**Interfaces:**

- Consumes: `api` (`src/lib/api.ts`), `Captcha` + `captchaEnabled` (`src/components/common/Captcha.tsx`), Task 2 error codes.
- Produces:
  ```ts
  export type Role = 'editor' | 'admin' | 'superadmin';
  export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: Role;
    mustChangePassword: boolean;
    lastLoginAt?: string;
  }
  export const ME_KEY = ['admin', 'me'] as const;
  export function useMe(): UseQueryResult<AdminUser | null>; // null on 401, retry: false, staleTime 60 s
  export function useLogin(): UseMutationResult<
    AdminUser,
    AxiosError<ApiErrorBody>,
    { email: string; password: string; captchaToken?: string }
  >;
  export function useLogout(): UseMutationResult<void>;
  export function useChangePassword(): UseMutationResult<
    AdminUser,
    AxiosError<ApiErrorBody>,
    { currentPassword: string; newPassword: string }
  >;
  export type Area = 'content' | 'media' | 'assay' | 'settings' | 'inbox' | 'audit' | 'users';
  export function can(role: Role | undefined, area: Area): boolean;
  export function passwordScore(pw: string): 0 | 1 | 2 | 3 | 4; // length-based (NIST): <12→0, 12–15→2, 16–19→3, ≥20→4, minus 1 if all one class or in a 20-word common list
  ```
- `RequireAuth` — loading → full-page spinner; `null` → `<Navigate to={`/admin/login?next=${encodeURIComponent(path)}`} replace/>`; `mustChangePassword` and path ≠ `/admin/change-password` → navigate there; else `<Outlet/>`. Listens to `window` event `niraum:auth-expired` (dispatched by the api interceptor when `/auth/refresh` fails) → `queryClient.setQueryData(ME_KEY, null)`; forms keep their RHF state because the redirect only happens when the user next navigates — instead show a modal "Session expired — sign in again" with an inline login form (`<ReauthDialog/>`) so the draft survives (Review Focus 1).

- [ ] **Step 1: Failing tests**

```tsx
// frontend/tests/admin/login.test.tsx (mock api with vi.mock('@/lib/api'))
it('shows the lockout message with the retry time on 423', async () => {
  apiPost.mockRejectedValueOnce(
    axiosError(423, 'ACCOUNT_LOCKED', { retryAt: '2026-10-10T10:15:00.000Z' }),
  );
  renderAdmin('/admin/login');
  await user.type(screen.getByLabelText('Email'), 'a@b.co');
  await user.type(screen.getByLabelText('Password'), 'whatever-password');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/locked/i);
});

it('renders the captcha after the API says captcha: true', async () => {
  apiPost.mockRejectedValueOnce(axiosError(401, 'UNAUTHENTICATED', { captcha: true }));
  // …submit once…
  expect(await screen.findByTestId('captcha')).toBeInTheDocument(); // Captcha renders a test id when captchaEnabled is mocked true
});

it('toggles password visibility', async () => {
  /* type, click "Show password", input type === 'text' */
});

it('redirects to change-password when mustChangePassword', async () => {
  apiGet.mockResolvedValueOnce({ data: { data: { ...editor, mustChangePassword: true } } });
  renderAdmin('/admin');
  expect(await screen.findByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument();
});

it('change-password blocks < 12 chars and mismatched confirmation', async () => {
  /* expect field errors, no api call */
});
```

```tsx
// frontend/tests/admin/require-auth.test.tsx
it('sends anonymous users to login with ?next=', async () => {
  apiGet.mockRejectedValueOnce(axiosError(401, 'UNAUTHENTICATED'));
  const { router } = renderAdmin('/admin/products');
  await waitFor(() => expect(router.state.location.pathname).toBe('/admin/login'));
  expect(router.state.location.search).toBe('?next=%2Fadmin%2Fproducts');
});

it('keeps form input when the session expires and the user signs in again', async () => {
  // render a page with a text input inside RequireAuth, type "draft text",
  // dispatch new Event('niraum:auth-expired'), expect dialog "Session expired",
  // complete inline login (mock 200), dialog closes, input still has "draft text".
});
```

Put shared helpers (`renderAdmin(path)` → `{ router }`, `axiosError(status, code, details?)`, `editor`/`admin`/`superadmin` fixtures) in `frontend/tests/admin/utils.tsx`.

- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3: Implement.** Login page: centred glass card (`bg-background/70 backdrop-blur border`), `Logo`, fields Email / Password (eye toggle button `aria-label="Show password"`), "Remember this device" checkbox (stores only the email in `localStorage['niraum-admin-email']` — no tokens; the cookie lifetime is server-side), "Forgot password?" link, `Captcha` when `captchaRequired` state, `role="alert"` error area mapping codes: `UNAUTHENTICATED` → "Email or password is incorrect", `ACCOUNT_LOCKED` → "Too many attempts. Try again after {local time of retryAt}", `CAPTCHA_REQUIRED`/`CAPTCHA_FAILED` → "Please complete the verification", `RATE_LIMITED` → "Too many attempts from this network — wait a few minutes". On success: `setQueryData(ME_KEY, user)` then navigate to `next` (only if it starts with `/admin`, else `/admin`). ChangePassword: current, new (+ `PasswordStrength` bar with 5 segments and label Weak/Fair/Good/Strong), confirm; Zod `newPassword.min(12).max(128)`, refine confirm match, refine differs from current; on success toast "Password updated". Forgot: email → always shows the same "If that email belongs to an account…" message. Reset: reads `?token=`, new + confirm → `/auth/reset` → navigate to login with toast.

In `src/lib/api.ts`, in the refresh failure path: `if (typeof window !== 'undefined') window.dispatchEvent(new Event('niraum:auth-expired'));` — public site ignores it.

- [ ] **Step 4:** tests → PASS; `pnpm --filter frontend lint typecheck`.
- [ ] **Step 5: Commit** `feat(admin): sign-in, forced password change and password reset`

---

### Task 4: Admin shell — sidebar, topbar, Cmd+K, breadcrumbs, unsaved guard

**Files:**

- Create: `frontend/src/admin/layout/{AdminLayout,Sidebar,Topbar,CommandPalette,Breadcrumbs,NoAccess}.tsx`, `frontend/src/admin/auth/RequireRole.tsx`, `frontend/src/admin/hooks/useUnsavedGuard.ts`, `frontend/src/admin/nav.ts`
- Modify: `frontend/src/admin/routes.tsx`
- Test: `frontend/tests/admin/shell.test.tsx`

**Interfaces:**

- Consumes: `useMe`, `can`, `useLogout`, `ThemeToggle` (`components/layout/ThemeToggle.tsx`), `components/ui/{command,sheet,dropdown-menu,breadcrumb,sonner}`.
- Produces:
  ```ts
  export interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    area: Area;
    group: 'Overview' | 'Content' | 'Data' | 'Inbox' | 'System';
  }
  export const NAV: NavItem[]; // Dashboard, Products, Deposit, Team, Services, Projects, Posts, Jobs, Media, Assay data, Inquiries, Messages, Applications, Settings, Users, Audit log
  export function RequireRole(props: { area: Area; children: ReactNode }): JSX.Element;
  export function useUnsavedGuard(dirty: boolean): void; // beforeunload + useBlocker → ConfirmDialog "Discard unsaved changes?"
  export function useBreadcrumb(label: string): void; // pages set their last crumb (e.g. a product name)
  ```
- Projects/Posts/Jobs sit in a collapsed "Archived sections" group with a note "Not shown on the public site (retired in Phase 4.5)".
- `useBlocker` needs a data router: the app uses `vite-react-ssg` which creates one on the client — verify with a quick test; if not, fall back to `beforeunload` + intercepting in-app `Link` clicks via a context.

- [ ] **Step 1: Failing tests**

```tsx
it('editor sees content items but not Settings, Inquiries or Users', async () => {
  mockMe(editor);
  renderAdmin('/admin');
  const nav = await screen.findByRole('navigation', { name: 'Admin' });
  expect(within(nav).getByRole('link', { name: 'Products' })).toBeInTheDocument();
  expect(within(nav).queryByRole('link', { name: 'Settings' })).toBeNull();
  expect(within(nav).queryByRole('link', { name: 'Users' })).toBeNull();
});
it('superadmin sees Users and Audit log', async () => {
  /* … */
});
it('editor opening /admin/settings directly sees No access', async () => {
  mockMe(editor);
  renderAdmin('/admin/settings');
  expect(await screen.findByRole('heading', { name: "You don't have access" })).toBeInTheDocument();
});
it('Ctrl+K opens the command palette and Enter navigates', async () => {
  mockMe(admin);
  const { router } = renderAdmin('/admin');
  await user.keyboard('{Control>}k{/Control}');
  await user.type(await screen.findByPlaceholderText('Search admin…'), 'inquir');
  await user.keyboard('{Enter}');
  await waitFor(() => expect(router.state.location.pathname).toBe('/admin/inquiries'));
});
it('sidebar collapse persists', async () => {
  /* click "Collapse sidebar", expect localStorage niraum-admin-sidebar === 'collapsed' */
});
it('unsaved guard asks before leaving a dirty page', async () => {
  /* page with useUnsavedGuard(true), click a nav link, expect dialog, Cancel keeps location */
});
```

- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3: Implement.** Layout: desktop sidebar `w-60` / collapsed `w-16` (icons + tooltips), mobile `Sheet`; topbar with breadcrumbs (from `NAV` + `useBreadcrumb`), search button showing `⌘K`/`Ctrl K`, `ThemeToggle`, avatar dropdown (name, role badge, "Change password", "Sign out"). `<Toaster richColors position="top-right"/>` once in `AdminLayout`. Global 403 handling: `QueryCache`/`MutationCache` `onError` in an admin-scoped `QueryClientProvider`? — no, reuse the app client; add `meta: { admin: true }` and a single `useEffect` subscriber in `AdminLayout` that toasts `FORBIDDEN` → "You don't have permission for that".
- [ ] **Step 4:** PASS + lint.
- [ ] **Step 5: Commit** `feat(admin): role-aware shell with command palette and unsaved-changes guard`

---

### Task 5: Dashboard (+ backend stats endpoint)

**Files:**

- Create: `backend/src/controllers/dashboard.controller.ts`, `backend/tests/dashboard.test.ts`, `frontend/src/admin/pages/Dashboard.tsx`
- Modify: `backend/src/routes/index.ts` (`admin.get('/dashboard', content, dashboardController.stats)`), `backend/src/docs/openapi.ts`, `docs/API.md`
- Test: `frontend/tests/admin/dashboard.test.tsx`

**Interfaces:**

- Produces `GET /admin/dashboard` →

  ```ts
  { data: {
      content: { products: { published: number; draft: number }; deposits: {…}; team: {…}; services: {…} };
      inbox?: { inquiriesNew: number; messagesNew: number; applicationsNew: number }; // admin+ only
      assay: { samples: number; summaries: number; publicDetail: boolean };
      recent?: AuditEntry[]; // admin+ only, last 10
  } }
  ```

  Editors get no `inbox`/`recent` keys (not 403 — the dashboard is shared).

- [ ] **Step 1: Failing backend test** — seed 2 products (1 published), 1 new inquiry; as editor: `inbox` undefined, `content.products` = `{ published: 1, draft: 1 }`; as admin: `inbox.inquiriesNew === 1`, `recent.length > 0`. Soft-deleted items are not counted.
- [ ] **Step 2:** FAIL. **Step 3:** implement with `countDocuments` in `Promise.all` (`isDeleted: { $ne: true }`; status `'new'` for inbox models — check exact enum names in `Inquiry.ts`, `Message.ts`, `Application.ts`). **Step 4:** PASS.
- [ ] **Step 5: Frontend failing test** — mocked response renders cards "Products 1 published · 1 draft", "New inquiries 1" (links to `/admin/inquiries?status=new`), recent activity list "admin 1 updated Product …"; for editor the inbox cards are absent. Implement with `Card` grid (`sm:grid-cols-2 xl:grid-cols-4`), skeletons while loading, plus a "Rebuild public site" button (admin+, `POST /admin/rebuild`, toast).
- [ ] **Step 6: Commit** `feat(admin): dashboard with content, inbox and activity summary`

---

### Task 6: Settings — tabs, address & map pin, social rows

**Files:**

- Create: `frontend/src/admin/pages/Settings.tsx`, `frontend/src/admin/pages/settings/{CompanyTab,ContactTab,AddressMapTab,SocialTab,SeoTab,FooterTab,AppearanceTab}.tsx`, `frontend/src/admin/components/MapPinPicker.tsx`, `frontend/src/admin/settings/schema.ts`
- Test: `frontend/tests/admin/settings.test.tsx`

**Interfaces:**

- Consumes: `GET/PUT /admin/settings`, `POST /admin/settings/geocode`, `LocalizedField` (Task 7 — build that component **in this task** if Task 7 isn't done; it is listed in Task 7's Produces and must keep that signature).
- Produces:
  ```ts
  export function MapPinPicker(props: {
    lat: number | null;
    lng: number | null;
    zoom?: number;
    onChange(p: { lat: number; lng: number }): void;
    height?: number;
  }): JSX.Element;
  // Leaflet loaded with React.lazy (map chunk), draggable Marker, click-to-place, shows "lat, lng" to 6 dp.
  ```
- Settings form state = one RHF form per tab; Save sends **only that tab's section(s)** (`PUT` accepts partial). Tabs: Company (`companyName`, `legalName`, `motto` EN/NE, logo light/dark via MediaPicker), Contact (phones[], emails[], whatsapp, officeHours), Address & Map (address fields, "Find on map" → geocode preview → moves pin without saving, map with draggable pin, "Pin set manually" switch = `manualOverride`, zoom slider 1–20, "Reset to address" = `manualOverride: false` + save address), Social (rows: platform select, URL, active switch, up/down reorder buttons, delete; `order` = row index on save), SEO (title ≤ 70 with counter, description ≤ 170, og image, keywords chips + `SeoPreview`), Footer (`about` EN/NE, links rows), Appearance (default theme radio, default language radio, **"Show sample-level assay data publicly"** switch = `publicAssayDetail` with an explanation and a `[CONFIRM]` reminder that client permission is pending).
- Response `meta.warnings` → toast per warning: `GEOCODE_APPROXIMATE` (info: "Pin placed at city level — drag it to the exact spot"), `GEOCODE_FAILED` (warning: "Couldn't find that address — the pin wasn't moved. Drag it to set the location.").

- [ ] **Step 1: Failing tests**

```tsx
it('dragging the pin saves lat/lng with manualOverride', async () => {
  // MapPinPicker is mocked to a button "move pin" calling onChange({ lat: 27.7, lng: 85.3 })
  mockSettings(base);
  renderAdmin('/admin/settings?tab=address');
  await user.click(await screen.findByRole('button', { name: 'move pin' }));
  await user.click(screen.getByRole('button', { name: 'Save address & map' }));
  expect(apiPut).toHaveBeenCalledWith(
    '/admin/settings',
    expect.objectContaining({
      location: expect.objectContaining({ lat: 27.7, lng: 85.3, manualOverride: true }),
    }),
  );
});
it('GEOCODE_FAILED keeps the old pin and shows a warning', async () => {
  apiPut.mockResolvedValueOnce({
    data: { data: base, meta: { warnings: [{ code: 'GEOCODE_FAILED', message: '…' }] } },
  });
  // change city, save → toast text /pin wasn't moved/i; MapPinPicker received base.location.lat
});
it('turning Instagram off sends isActive false and keeps order', async () => {
  /* … */
});
it('reordering moves a row down and saves order = index', async () => {
  /* … */
});
it('saving the Company tab sends only company fields', async () => {
  // expect(Object.keys(apiPut.mock.calls[0][1]).sort()).toEqual(['companyName','legalName','logo','motto'])
});
it('editor is blocked from settings', async () => {
  /* NoAccess */
});
```

- [ ] **Step 2:** FAIL. **Step 3:** implement; `?tab=` in the URL selects the tab (so links and tests can deep-link). Each tab uses `useUnsavedGuard(formState.isDirty)`. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(admin): settings with map pin, social links and assay visibility`

---

### Task 7: Generic resource list + form with EN/नेपाली tabs (Products first)

**Files:**

- Create: `frontend/src/admin/resources/{config.ts,localize.ts}`, `frontend/src/admin/hooks/{useAdminList,useAdminMutation}.ts`, `frontend/src/admin/components/{ResourceTable,ResourceForm,LocalizedField,SlugField,SeoPreview,StatusBadge,ConfirmDialog}.tsx`, `frontend/src/admin/pages/{ResourceList,ResourceEdit}.tsx`
- Test: `frontend/tests/admin/localize.test.ts`, `frontend/tests/admin/resource-products.test.tsx`

**Interfaces:**

- Produces:
  ```ts
  // localize.ts — admin docs arrive as English strings + `translations: { field: { en, ne? } }`
  export type Localized = { en: string; ne: string };
  export function toFormValues<T extends Record<string, unknown>>(
    doc: T & { translations?: Record<string, { en: string; ne?: string }> },
    fields: readonly string[],
  ): Record<string, unknown>;
  //   → each localized field becomes { en, ne: ne ?? '' }; array-of-localized (applications) handled per item
  export function toPayload(
    values: Record<string, unknown>,
    fields: readonly string[],
    dirty: Record<string, unknown>,
  ): Record<string, unknown>;
  //   → localized field: { en } if only EN dirty, { en, ne } if NE dirty; untouched fields omitted on update (all sent on create)

  export interface FieldDef {
    name: string;
    label: string;
    kind:
      | 'text'
      | 'textarea'
      | 'richtext'
      | 'number'
      | 'switch'
      | 'select'
      | 'date'
      | 'image'
      | 'images'
      | 'list'
      | 'pairs';
    localized?: boolean;
    required?: boolean;
    max?: number;
    options?: { value: string; label: string }[];
    help?: string;
    section?: string;
  }
  export interface ResourceConfig {
    key: 'products' | 'deposits' | 'team' | 'services' | 'projects' | 'posts' | 'jobs';
    label: string;
    singular: string;
    apiPath: string; // '/admin/products'
    titleField: string; // 'name' | 'title'
    visibleField: 'published' | 'isOpen';
    localized: readonly string[]; // mirror backend resources.ts exactly
    columns: { key: string; label: string; sortable?: boolean; render?: (row: any) => ReactNode }[];
    filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
    fields: FieldDef[];
    schema: z.ZodTypeAny; // client-side mirror of backend *Create
    seo?: boolean;
    slug?: boolean;
    schedulable?: boolean;
    publicUrl?: (doc: any, lang: 'en' | 'ne') => string;
  }
  export const RESOURCES: Record<ResourceConfig['key'], ResourceConfig>;

  export function useAdminList(
    cfg: ResourceConfig,
    params: {
      page: number;
      limit: number;
      q?: string;
      sort?: string;
      state?: 'all' | 'draft' | 'published';
      trash?: boolean;
      [filter: string]: unknown;
    },
  ): UseQueryResult<ApiList<any>>;
  export function useAdminMutation(cfg: ResourceConfig): { create; update; remove; restore }; // toasts + invalidate ['admin', cfg.key]

  export function LocalizedField(props: {
    name: string;
    label: string;
    as: 'input' | 'textarea' | 'richtext';
    max?: number;
    required?: boolean;
  }): JSX.Element;
  //   tabs "English" | "नेपाली"; NE tab shows a dot when empty; NE input lang="ne" class "font-[Mukta]"; reads/writes `${name}.en` / `${name}.ne` via useFormContext
  ```
- **The `localized` lists must equal `backend/src/services/resources.ts`** — product: `['name','summary','applications','typicalChemistry']`. Add a unit test that imports both lists? It can't import backend code; instead put the lists in `frontend/src/admin/resources/localized.json` and a backend test `tests/localized-sync.test.ts` that reads that JSON and compares with each resource's `localized` (so drift fails CI).
- List page: `ResourceTable` with debounced search (300 ms) `q`, state tabs All/Draft/Published, Trash toggle, filters, sortable column headers (`sort` / `-sort`), pagination (20 per page), row checkboxes + bulk "Publish", "Unpublish", "Move to trash" (sequential PUT/DELETE calls with one summary toast), "New {singular}" button, row click → edit. Empty state with CTA.
- Edit page: `ResourceForm` — left column fields grouped by `section`, right sidebar card: status (Draft / Published / Scheduled), "Publish at" datetime (if `schedulable`), slug field, "View on site" (EN/NE links from `publicUrl`, disabled while draft), "Preview" (opens public URL with `?preview=1` — the public page renders drafts only if the API returns them, which it won't; so Preview renders the form values in a `Dialog` using the public section component when one exists — for Products use `components/sections/SupplyCards` card; otherwise omit Preview), SEO preview, Save (`Ctrl+S`), Delete (ConfirmDialog). Unsaved guard on.

- [ ] **Step 1: Failing unit tests (localize)**

```ts
import { toFormValues, toPayload } from '@/admin/resources/localize';
const doc = {
  name: 'Iron ore lump',
  summary: 'S',
  translations: { name: { en: 'Iron ore lump', ne: 'फलाम' }, summary: { en: 'S' } },
};
it('fills empty Nepali', () => {
  expect(toFormValues(doc, ['name', 'summary'])).toMatchObject({
    name: { en: 'Iron ore lump', ne: 'फलाम' },
    summary: { en: 'S', ne: '' },
  });
});
it('sends only English when Nepali was not touched (keeps server Nepali)', () => {
  const values = { name: { en: 'Lump ore', ne: 'फलाम' }, summary: { en: 'S', ne: '' } };
  expect(toPayload(values, ['name', 'summary'], { name: { en: true } })).toEqual({
    name: { en: 'Lump ore' },
  });
});
it('sends both when Nepali was edited', () => {
  const values = { name: { en: 'Lump ore', ne: 'फलामको ढिका' } };
  expect(toPayload(values, ['name'], { name: { ne: true } })).toEqual({
    name: { en: 'Lump ore', ne: 'फलामको ढिका' },
  });
});
```

- [ ] **Step 2: Failing component test (products)** — list renders rows from mocked `GET /admin/products`; search types "lump" → request with `q=lump` (after debounce, use fake timers); edit page loads a product, switch to "नेपाली" tab, Nepali summary input shows `translations.summary.ne`; change English name only → Save → `PUT /admin/products/:id` body `{ name: { en: 'New' } }` (Review Focus 2); required English name empty → field error, no request.
- [ ] **Step 3:** FAIL → implement → PASS. Product `fields` from `backend/src/validators/content.ts` `productCreate` (read it; mirror every field and max length; `applications` = list of localized strings; `typicalChemistry` = pairs; `sizes`/`minOrder`/`packing`/`delivery` text with help "[CONFIRM] with client before publishing" if they exist in the model).
- [ ] **Step 4:** add `localized.json` + backend sync test; run both suites.
- [ ] **Step 5: Commit** `feat(admin): generic resource manager with english and nepali tabs`

---

### Task 8: Rich text, media picker, scheduling — and remaining content resources

**Files:**

- Create: `frontend/src/admin/components/{RichTextEditor,MediaPicker}.tsx`, `frontend/src/admin/pages/Media.tsx`, `backend/tests/schedule.test.ts`
- Modify: `frontend/package.json` (+ `@tiptap/react@2`, `@tiptap/starter-kit@2`, `@tiptap/extension-link@2`, `@tiptap/extension-placeholder@2` — exact versions pinned by pnpm), `frontend/src/admin/resources/config.ts` (team, services, projects, posts, jobs), `backend/src/services/content.service.ts`
- Test: `frontend/tests/admin/rich-text.test.tsx`, `frontend/tests/admin/media.test.tsx`

**Interfaces:**

- Produces:
  ```ts
  export function RichTextEditor(props: {
    value: string;
    onChange(html: string): void;
    label: string;
    lang?: 'en' | 'ne';
  }): JSX.Element; // toolbar: bold, italic, H2, H3, bullet, ordered, link, undo/redo
  export function MediaPicker(props: {
    value: { url: string; alt: string } | null;
    onChange(
      v: { url: string; alt: string; publicId?: string; width?: number; height?: number } | null,
    ): void;
    type?: 'image' | 'document' | 'video';
  }): JSX.Element;
  ```
  Media page: grid of `/admin/media` with type filter, upload (drag & drop, alt text required for images before upload enables — mirrors API), edit alt, delete with confirm; `STORAGE_UNAVAILABLE` 503 → banner "Media storage isn't configured (Cloudinary keys missing)".
- **Scheduling (backend):** public reads add `publishedAt: { $lte: new Date() }` when the model has `publishedAt` (projects, posts) so a published item with a future `publishedAt` is "scheduled". The service must keep setting `publishedAt` only when not provided. Products/deposits/team/services have no `publishedAt` → `schedulable: false` in config.

- [ ] **Step 1: Failing backend test**

```ts
it('hides published posts whose publishedAt is in the future', async () => {
  const cookies = await loginAs(app, 'editor');
  const future = new Date(Date.now() + 86_400_000).toISOString();
  await request(app)
    .post('/api/v1/admin/posts')
    .set('Cookie', cookies)
    .send({ title: 'Later', excerpt: 'x', body: '<p>x</p>', published: true, publishedAt: future })
    .expect(201);
  const pub = await request(app).get('/api/v1/posts').expect(200);
  expect(pub.body.data.find((p: { title: string }) => p.title === 'Later')).toBeUndefined();
  expect((await request(app).get('/api/v1/posts/later')).status).toBe(404);
});
```

(Check `postCreate` accepts `publishedAt`; if not, add `publishedAt: z.coerce.date().optional()` to project/post create validators.) Also verify `/seo/sitemap-data` excludes scheduled items.

- [ ] **Step 2:** FAIL → implement in `content.service.ts` public filter + `isVisible` → PASS.
- [ ] **Step 3: Failing frontend tests** — RichTextEditor: typing + Bold button produces `<p><strong>…</strong></p>` via onChange; MediaPicker: lists mocked media, selecting one calls onChange with url+alt; upload without alt keeps the Upload button disabled.
- [ ] **Step 4:** implement; add configs for team (`localized: ['role','bio','otherVentures']`, photo image), services, projects, posts, jobs (from `validators/content.ts`), run all tests.
- [ ] **Step 5: Commit** `feat(admin): rich text, media library, scheduling and remaining content types`

---

### Task 9: Deposit editor with lat/lng pin

**Files:**

- Create: `frontend/src/admin/pages/DepositEdit.tsx`
- Modify: `frontend/src/admin/resources/config.ts` (deposits uses custom edit page), `frontend/src/admin/routes.tsx`
- Test: `frontend/tests/admin/deposit.test.tsx`

**Interfaces:**

- Consumes: `MapPinPicker`, `LocalizedField`, `toFormValues`/`toPayload`, `MediaPicker` (maps), `useAdminMutation(RESOURCES.deposits)`.
- Deposit fields from `backend/src/validators/content.ts` `depositCreate` + `models/Deposit.ts`: name, summary (localized — confirm list in resources.ts), location { district, municipality, province (localized), ward, topoSheet, lat, lng }, areas, land { …, landType, confirmed }, consultant { name, address }, status, maps[], published. `land.confirmed` false shows a yellow note "Land figures are hidden on the public site until confirmed ([CONFIRM])".
- Pin: when `lat`/`lng` are null the map centres on Nepal (28.2, 84.0, zoom 7) with no marker and the note "WGS-84 pin not confirmed ([CONFIRM])"; clicking places the marker. Number inputs for lat/lng stay in sync both ways (6 dp, validated −90..90 / −180..180).

- [ ] **Step 1: Failing test** — load deposit with null lat/lng → note visible; mocked map `onChange({ lat: 27.9, lng: 84.6 })` → inputs show `27.900000`; Save → `PUT` body contains `location: { lat: 27.9, lng: 84.6 }` and **does not** include untouched localized fields; typing lat `95` → error "Latitude must be between -90 and 90".
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(admin): deposit editor with map pin`

---

### Task 10: Inquiries inbox (status pipeline + CSV), messages, applications

**Files:**

- Create: `frontend/src/admin/pages/{Inquiries,InquiryDetail,Messages,Applications}.tsx`, `frontend/src/admin/components/CsvButton.tsx`
- Test: `frontend/tests/admin/inbox.test.tsx`

**Interfaces:**

- Consumes: `GET /admin/inquiries?status=&q=&page=`, `GET /admin/inquiries/:id`, `PATCH /admin/inquiries/:id { status, note? }` (read `backend/src/validators/public.ts`/`inquiry` validators for the exact status enum and whether `note` exists — use the enum verbatim), `GET /admin/inquiries/export.csv` (download via `api.get(..., { responseType: 'blob' })` → object URL → `a.download = 'inquiries-YYYY-MM-DD.csv'`; a plain `<a href>` would also work same-origin but loses the 401 refresh), messages and applications endpoints from docs/API.md.
- Produces: `CsvButton({ path, filename, params })`.
- Inquiries page: pipeline header with a count per status (click filters), table (date, company, name, product, quantity, country, status badge), detail drawer/page with all fields, mailto/phone links, status select (moves through pipeline; any status selectable), activity from `/admin/audit?entity=Inquiry&entityId=`. Messages: list + status select (`new|read|replied|spam`), opening a `new` message marks it `read`. Applications: list + detail with "Open CV" (signed `cvUrl`, opens new tab, `rel="noopener noreferrer"`).

- [ ] **Step 1: Failing tests** — status chip "New 3" filters to `status=new`; changing status select sends PATCH and optimistic badge update, reverted with toast on error; CSV button calls `responseType: 'blob'` with current filters and creates a download; opening a new message PATCHes `read`.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(admin): inquiries pipeline with csv export, messages and applications`

---

### Task 11: Assay data manager — backend writes + CSV import, frontend screen

**Files:**

- Modify: `backend/src/validators/assay.ts`, `backend/src/services/assay.service.ts`, `backend/src/controllers/assay.controller.ts`, `backend/src/routes/index.ts`, `backend/src/docs/openapi.ts`, `docs/API.md`
- Create: `backend/tests/assay-admin.test.ts`, `frontend/src/admin/pages/Assay.tsx`
- Test: `frontend/tests/admin/assay.test.tsx`

**Interfaces:**

- Produces (editor+):

  ```
  POST   /admin/assay/samples            AssaySample body → 201
  PUT    /admin/assay/samples/:id        partial → 200
  DELETE /admin/assay/samples/:id        → 204 (hard delete; audit-logged with the old values)
  GET    /admin/assay/summary            all summary rows incl. unpublished fields
  PUT    /admin/assay/summary/:id        partial → 200
  POST   /admin/assay/import?dataset=<ASSAY_DATASETS value>&mode=replace|append   text/csv body (≤ 1 MB)
         → 200 { data: { inserted, replaced } } | 400 VALIDATION_ERROR details: { rows: [{ line, errors: string[] }] }
  ```

  CSV headers (case-sensitive, order-free): `sample,Fe,SiO2,Al2O3,LOI,P,S,CaO,MgO,lengthM,note` — mirror the exact numeric fields in `models/AssaySample.ts` (read it; include every oxide it defines). Blank optional cells → `null`. Percent fields 0–100. Import runs in a Mongo transaction if the deployment supports it; otherwise validate everything first, then `deleteMany` + `insertMany` (validation-first gives all-or-nothing for bad data — Review Focus 3). Every write invalidates the public summary cache if one exists and schedules the rebuild hook (like content writes).
  The public `/assay/summary` remains computed per `assay.service.ts`; summary edits are for the reported per-section rows only — note in UI: "Numbers come from the assay report — change them only to match the source document."

- [ ] **Step 1: Failing backend tests**

```ts
const csv = (rows: string[]) =>
  ['sample,Fe,SiO2,Al2O3,LOI,P,S,CaO,MgO,lengthM,note', ...rows].join('\n');
it('imports a valid CSV in replace mode', async () => {
  const res = await request(app)
    .post('/api/v1/admin/assay/import?dataset=<first ASSAY_DATASETS value>&mode=replace')
    .set('Cookie', editorCookies)
    .set('Content-Type', 'text/csv')
    .send(csv(['KJ-1,55.2,10.1,3.2,,0.05,0.01,,,1.5,', 'KJ-2,48.0,15.0,4.0,2.1,,,,,2,']));
  expect(res.status).toBe(200);
  expect(res.body.data.inserted).toBe(2);
});
it('rejects the whole file and lists bad lines', async () => {
  const before = await AssaySample.countDocuments();
  const res = await post(
    csv(['KJ-1,101,1,1,,,,,,,', ',50,1,1,,,,,,,', 'KJ-3,50,1,1,,,,,,,', 'KJ-3,51,1,1,,,,,,,']),
  );
  expect(res.status).toBe(400);
  expect(res.body.error.details.rows.map((r: { line: number }) => r.line)).toEqual([2, 3, 5]);
  expect(await AssaySample.countDocuments()).toBe(before);
});
it('rejects unknown headers', async () => {
  /* header "Iron" → 400 with formErrors mentioning Iron */
});
it('editor can edit a sample; anonymous cannot', async () => {
  /* PUT 200 / 401 */
});
```

Parse CSV with a small hand-written parser (quoted fields, CRLF) in `backend/src/utils/csv.ts` + unit tests — no new dependency; the files are tiny.

- [ ] **Step 2–4:** FAIL → implement → PASS (full backend suite).
- [ ] **Step 5: Frontend failing test** — Assay page shows dataset tabs, samples table with inline edit (Fe cell → number input → Enter saves PUT), Import dialog: choose file → preview first 10 rows client-side → "Replace all samples in {dataset}" confirm → POST; 400 response renders "Line 2: Fe must be ≤ 100" list; "Show sample-level data on the public site" switch (admin+ only; editors see read-only state) → `PUT /admin/settings { publicAssayDetail }`; "Download CSV" exports current rows client-side.
- [ ] **Step 6:** implement → PASS. **Commit** `feat(admin): assay data manager with csv import`

---

### Task 12: Users and audit log

**Files:**

- Create: `frontend/src/admin/pages/{Users,Audit}.tsx`
- Test: `frontend/tests/admin/users-audit.test.tsx`

**Interfaces:**

- Consumes: `GET/POST/PUT/DELETE /admin/users`, `GET /admin/audit?entity=&entityId=&user=&page=`.
- Users (superadmin): table (name, email, role, active, last login), "Invite user" dialog (name, email, role, temporary password ≥ 12 with "Generate" button using `crypto.getRandomValues` 20 chars, copy button; note "They must change it at first sign-in"), edit role / active switch, deactivate with confirm; API errors "last superadmin" / "yourself" (`CONFLICT`/`FORBIDDEN` messages) shown verbatim in a toast; own row's role and active controls disabled.
- Audit (admin+): table (time, user, action, entity, entity id link to the editor when the entity is a managed resource), filters entity/user, expandable row with the field diff rendered as before → after (`diff` object; secrets already omitted by API).

- [ ] **Step 1: Failing tests** — create user sends `{ name, email, role, password }`; generated password length 20; own row controls disabled; audit row expands to show `title: "Old" → "New"`.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(admin): user management and audit log`

---

### Task 13: Playwright end-to-end + docs

**Files:**

- Create: `frontend/e2e/admin.spec.ts`, `backend/src/seed/e2e-admin.seed.ts` (creates `e2e-admin@niraum.local` admin with `mustChangePassword: false` and a known password **only when `NODE_ENV !== 'production'` and `E2E_ADMIN_PASSWORD` is set** — the password comes from the environment, never committed)
- Modify: `frontend/playwright.config.ts` (admin project uses `pnpm dev` servers, `baseURL` 5173, since admin is client-only and needs the API proxy), `frontend/e2e/site.spec.ts` (remove the `fixme` admin login test — superseded), `SKILLS.md`, `README.md`, `docs/ARCHITECTURE.md` (§ admin), `docs/API.md`, `CHANGELOG.md`

- [ ] **Step 1: Write the tests** (they run against a local API with in-memory or dev DB — never Atlas production data; the spec reads `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` and skips with a clear message when unset):

```ts
test('login → dashboard', …);                         // fill, submit, heading "Dashboard"
test('lockout after 5 wrong passwords', …);           // uses a throwaway user created via API as superadmin; expects /locked/i
test('settings address change moves the map pin', …); // change city to "Pokhara", save, read marker position from Leaflet via page.evaluate(() => document.querySelector('.leaflet-marker-icon')?.getAttribute('style')) changed — or, with Nominatim unreachable offline, expect the GEOCODE_FAILED warning toast; assert one of the two outcomes explicitly
test('turning Instagram off hides the footer icon', …); // ensure an instagram row exists (add one if missing), switch off, save, open /en in the same context, expect getByRole('link', { name: /instagram/i }) count 0; restore afterwards
test('create and publish a product', …);              // new product EN name + NE name, publish, GET /api/v1/products?lang=ne via request fixture contains the NE name; delete it afterwards
test('editor cannot open settings', …);
```

Every test cleans up what it creates (afterEach via API) so the dev DB stays as it was.

- [ ] **Step 2:** `pnpm --filter frontend exec playwright test e2e/admin.spec.ts` with the dev servers running → all pass (Nominatim branch documented).
- [ ] **Step 3:** Full gates: `pnpm -r lint`, `pnpm -r typecheck`, backend + frontend unit tests, `pnpm --filter frontend build`, `node scripts/check-admin-boundary.mjs`, existing `e2e/site.spec.ts`. Quick Lighthouse spot check of `/en` mobile to confirm no regression (≥ previous 98).
- [ ] **Step 4:** Docs — SKILLS.md session log row + feature table (Admin panel: Done), file map (`src/admin/**`), known issues (Cloudinary keys needed for media; Turnstile site key needed for login captcha in production; e2e admin needs `E2E_ADMIN_*`); README "Admin panel" section (URL, first superadmin from seed, forced password change); ARCHITECTURE admin section (boundary, auth flow diagram, resource config pattern); API.md new endpoints; CHANGELOG.
- [ ] **Step 5: Commit** `test(admin): end-to-end admin flows and docs`

---

## Self-review notes

- Spec coverage: lazy/noindex/protected (T1, T3) · role sidebar (T4) · login extras incl. Turnstile after 3 fails, lockout, forced change + meter (T2, T3) · shell, Cmd+K, breadcrumbs, toasts, unsaved guard (T4) · dashboard + activity (T5) · settings tabs incl. geocode, draggable marker, manualOverride, zoom, reset, social switch + reorder, SEO, footer, appearance (T6) · content managers: table search/filter/sort/pagination/bulk, RHF+Zod, TipTap, slug, SEO preview, media picker, draft/publish/schedule, preview (T7, T8) · media library (T8) · messages + applications with CV (T10) · users + audit (T12) · Playwright login, lockout, settings → map, Instagram off → footer, create + publish (T13) · 4.5: inquiries pipeline + CSV (T10), products editor (T7), deposit with pin (T9), assay CSV import + publicAssayDetail (T11, T6), EN/नेपाली tabs everywhere (T7 `LocalizedField`, used in T6/T8/T9).
- Preview is limited to resources with a public card component (products); retired resources have no public page, so Preview is omitted there by design.
- Open questions to raise with the user only if they block a task: exact inquiry status enum (read from code), whether Cloudinary keys exist locally (media tests mock the API either way).
