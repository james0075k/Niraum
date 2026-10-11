import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4173';

/**
 * Admin project (e2e/admin.spec.ts): the client-only admin needs the Vite dev server (API proxy)
 * and the e2e API on an in-memory MongoDB (backend `e2e:server`), on their own ports so an
 * already running `pnpm dev` (which may point at a real database) is never reused.
 * The servers start only when E2E_ADMIN_PASSWORD is set; without it the admin tests skip.
 */
const adminPort = Number(process.env.E2E_ADMIN_PORT ?? 5174);
const apiPort = Number(process.env.E2E_API_PORT ?? 4100);
const adminURL = `http://localhost:${adminPort}`;
const adminEnabled = !!process.env.E2E_ADMIN_PASSWORD;
// Opt-in: reusing whatever answers on these ports could mean a server on a real database.
const reuseAdmin = process.env.E2E_REUSE_SERVERS === '1';

/** `playwright test --project=admin` needs neither the prerender build nor its preview. */
const projectArgs = process.argv.flatMap((a, i, all) =>
  a === '--project' ? [all[i + 1] ?? ''] : a.startsWith('--project=') ? [a.slice(10)] : [],
);
const adminOnly = projectArgs.length > 0 && projectArgs.every((p) => p === 'admin');

const siteServer = {
  // Full prerender build so e2e exercises the same HTML that ships.
  command: 'pnpm build && pnpm preview',
  url: baseURL,
  reuseExistingServer: !process.env.CI,
  // The prerender build alone takes over a minute.
  timeout: 300_000,
};

const adminServers = [
  {
    command: 'pnpm --filter backend e2e:server',
    url: `http://localhost:${apiPort}/api/v1/health`,
    reuseExistingServer: reuseAdmin,
    timeout: 180_000,
    env: {
      E2E_API_PORT: String(apiPort),
      E2E_WEB_URL: adminURL,
      E2E_ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD ?? '',
      E2E_ADMIN_EMAIL: process.env.E2E_ADMIN_EMAIL ?? '',
    },
  },
  {
    command: `pnpm exec vite --port ${adminPort} --strictPort`,
    url: `${adminURL}/admin/login`,
    reuseExistingServer: reuseAdmin,
    timeout: 120_000,
    env: {
      API_PROXY_TARGET: `http://localhost:${apiPort}`,
      // Override any local .env: same-origin API through the proxy, no Turnstile widget.
      VITE_API_URL: '/api/v1',
      VITE_TURNSTILE_SITE_KEY: '',
      VITE_SITE_URL: adminURL,
    },
  },
];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    // Optional: point at a preinstalled Chromium instead of Playwright's download.
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  projects: [
    { name: 'chromium', testIgnore: /admin\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testIgnore: /admin\.spec\.ts/, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testIgnore: /admin\.spec\.ts/, use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', testIgnore: /admin\.spec\.ts/, use: { ...devices['Pixel 7'] } },
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts/,
      // Tests share the settings singleton: run them one after another.
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        // System Chrome unless a Chromium path is given (no browser download needed).
        channel: process.env.PW_CHROMIUM_PATH ? undefined : 'chrome',
        baseURL: adminURL,
      },
    },
  ],
  webServer: [
    ...(process.env.E2E_BASE_URL || adminOnly ? [] : [siteServer]),
    ...(adminEnabled ? adminServers : []),
  ],
});
