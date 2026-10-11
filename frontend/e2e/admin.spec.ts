import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type Page,
  type PlaywrightWorkerArgs,
} from '@playwright/test';

/**
 * Admin flows against the e2e API (backend `e2e:server`: in-memory MongoDB, seeded with the
 * normal seed plus e2e users from src/seed/e2e-admin.seed.ts). Run with:
 *
 *   E2E_ADMIN_PASSWORD=<12+ chars> pnpm --filter frontend exec playwright test --project=admin
 *
 * Every test undoes what it changes (settings restored, product trashed, throwaway user
 * deactivated), so a reused server stays as seeded.
 */

const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@niraum.local';
const EDITOR_EMAIL = 'e2e-editor@niraum.local';
const SUPERADMIN_EMAIL = 'e2e-superadmin@niraum.local';

test.skip(
  !PASSWORD,
  'Admin e2e skipped: set E2E_ADMIN_PASSWORD (12+ characters) to start the in-memory e2e API ' +
    'and run these tests (E2E_ADMIN_EMAIL optional, default e2e-admin@niraum.local).',
);

/**
 * The login route allows 10 attempts per IP per 15 minutes. The API trusts one proxy hop (here
 * Vite's dev proxy), so each test acts as its own client IP — browser and API helpers alike.
 */
const clientIp = () => `10.${[0, 0, 0].map(() => Math.floor(Math.random() * 254) + 1).join('.')}`;
test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ 'X-Forwarded-For': clientIp() });
});

interface Address {
  line1: string;
  city: string;
  district: string;
  province: string;
  country: string;
  postalCode: string;
}
interface Social {
  platform: string;
  url: string;
  isActive: boolean;
  order: number;
}
interface AdminSettings {
  address: Address;
  location: { lat: number; lng: number; zoom: number; manualOverride: boolean };
  social: Social[];
}

/**
 * An API client signed in as `email`. Auth cookies are `Secure`; they are passed on explicitly
 * so the plain-http e2e origin works whatever the request context's cookie jar does with them.
 */
async function apiAs(
  playwright: PlaywrightWorkerArgs['playwright'],
  baseURL: string,
  email: string,
): Promise<APIRequestContext> {
  const headers = { 'X-Forwarded-For': clientIp() };
  const anon = await playwright.request.newContext({ baseURL, extraHTTPHeaders: headers });
  const res = await anon.post('/api/v1/auth/login', { data: { email, password: PASSWORD } });
  expect(res.status(), `API login as ${email}: ${await res.text()}`).toBe(200);
  const cookie = res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === 'set-cookie')
    .map((h) => h.value.split(';')[0])
    .join('; ');
  await anon.dispose();
  return playwright.request.newContext({ baseURL, extraHTTPHeaders: { ...headers, cookie } });
}

async function getSettings(api: APIRequestContext): Promise<AdminSettings> {
  const res = await api.get('/api/v1/admin/settings');
  expect(res.status()).toBe(200);
  return ((await res.json()) as { data: AdminSettings }).data;
}

async function putSettings(api: APIRequestContext, body: Record<string, unknown>) {
  const res = await api.put('/api/v1/admin/settings', { data: body });
  expect(res.status(), await res.text()).toBe(200);
  return (await res.json()) as { data: AdminSettings; meta?: { warnings?: { code: string }[] } };
}

/** Restores address and pin as they were (address first: it may re-geocode). */
async function restoreLocation(api: APIRequestContext, original: AdminSettings) {
  await putSettings(api, { address: original.address });
  const { lat, lng, zoom, manualOverride } = original.location;
  await putSettings(api, { location: { lat, lng, zoom, manualOverride } });
}

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function signInAndWait(page: Page, email: string) {
  await signIn(page, email);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
}

/** A public visitor in a fresh browser context (own HTTP cache, no admin session). */
async function asVisitor(browser: Browser, baseURL: string, fn: (page: Page) => Promise<void>) {
  const context = await browser.newContext({ baseURL });
  try {
    await fn(await context.newPage());
  } finally {
    await context.close();
  }
}

const footerInstagram = (page: Page) =>
  page.getByRole('contentinfo').getByRole('link', { name: /instagram/i });

test('login → dashboard', async ({ page }) => {
  await signIn(page, ADMIN_EMAIL);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
  // Admin sees System → Settings but not the superadmin-only Users section.
  const sidebar = page.getByRole('navigation').first();
  await expect(sidebar.getByRole('link', { name: 'Settings' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Users' })).toHaveCount(0);
});

test('lockout after 5 wrong passwords', async ({ page, playwright, baseURL }) => {
  const superadmin = await apiAs(playwright, baseURL!, SUPERADMIN_EMAIL);
  const email = `e2e-lockout-${Date.now()}@niraum.local`;
  const created = await superadmin.post('/api/v1/admin/users', {
    data: { name: 'E2E Lockout', email, role: 'editor', password: 'throwaway-pass-1234' },
  });
  expect(created.status(), await created.text()).toBe(201);
  const { id } = ((await created.json()) as { data: { id: string } }).data;

  try {
    const alert = page.getByRole('alert');
    for (let attempt = 1; attempt <= 5; attempt++) {
      const answered = page.waitForResponse((r) => r.url().endsWith('/api/v1/auth/login'));
      await signIn(page, email, `wrong-password-${attempt}`);
      const res = await answered;
      if (attempt < 5) {
        expect(res.status()).toBe(401);
        await expect(alert).toHaveText('Email or password is incorrect');
      } else {
        expect(res.status()).toBe(423);
        await expect(alert).toHaveText(/locked/i);
      }
    }
    // Locked means locked: the right password is refused too.
    const answered = page.waitForResponse((r) => r.url().endsWith('/api/v1/auth/login'));
    await signIn(page, email, 'throwaway-pass-1234');
    expect((await answered).status()).toBe(423);
    await expect(alert).toHaveText(/too many attempts/i);
    await expect(page).toHaveURL(/\/admin\/login/);
  } finally {
    // Users are never hard-deleted (audit history keeps the reference): deactivate it.
    const res = await superadmin.delete(`/api/v1/admin/users/${id}`);
    expect(res.status(), await res.text()).toBe(200);
    await superadmin.dispose();
  }
});

test('settings address change moves the map pin', async ({ page, playwright, baseURL }, info) => {
  const admin = await apiAs(playwright, baseURL!, ADMIN_EMAIL);
  const original = await getSettings(admin);
  try {
    // The pin follows the address only while it isn't set manually.
    if (original.location.manualOverride) {
      await putSettings(admin, { location: { ...original.location, manualOverride: false } });
    }
    const before = await getSettings(admin);
    expect(before.address.city).not.toBe('Pokhara');

    await signInAndWait(page, ADMIN_EMAIL);
    await page.goto('/admin/settings?tab=address');
    await expect(page.locator('.leaflet-marker-icon')).toBeVisible();
    const latInput = page.getByLabel('Latitude');
    const lngInput = page.getByLabel('Longitude');
    await expect(latInput).toHaveValue(String(before.location.lat));
    await expect(lngInput).toHaveValue(String(before.location.lng));

    await page.getByLabel('City').fill('Pokhara');
    const saved = page.waitForResponse(
      (r) => r.url().endsWith('/api/v1/admin/settings') && r.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Save address & map' }).click();
    const res = await saved;
    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      data: AdminSettings;
      meta?: { warnings?: { code: string }[] };
    };
    expect(body.data.address.city).toBe('Pokhara');
    await expect(page.getByText('Settings saved')).toBeVisible();

    const failed = body.meta?.warnings?.some((w) => w.code === 'GEOCODE_FAILED') ?? false;
    if (failed) {
      // Outcome B (Nominatim unreachable — the e2e API's default): warning, previous pin kept.
      info.annotations.push({ type: 'geocode', description: 'GEOCODE_FAILED → pin kept' });
      await expect(
        page.getByText(
          "Couldn't find that address — the pin wasn't moved. Drag it to set the location.",
        ),
      ).toBeVisible();
      expect(body.data.location).toMatchObject({
        lat: before.location.lat,
        lng: before.location.lng,
      });
      await expect(latInput).toHaveValue(String(before.location.lat));
      await expect(lngInput).toHaveValue(String(before.location.lng));
      await expect(page.locator('.leaflet-marker-icon')).toBeVisible();
    } else {
      // Outcome A (geocoded): the pin moved to the new address.
      info.annotations.push({ type: 'geocode', description: 'geocoded → pin moved' });
      const moved =
        body.data.location.lat !== before.location.lat ||
        body.data.location.lng !== before.location.lng;
      expect(moved, 'pin coordinates changed').toBe(true);
      await expect(latInput).toHaveValue(String(body.data.location.lat));
      await expect(lngInput).toHaveValue(String(body.data.location.lng));
    }
  } finally {
    await restoreLocation(admin, original);
    await admin.dispose();
  }
});

test('turning Instagram off hides the footer icon', async ({
  page,
  browser,
  playwright,
  baseURL,
}) => {
  const admin = await apiAs(playwright, baseURL!, ADMIN_EMAIL);
  const original = await getSettings(admin);
  try {
    // An active Instagram row to switch off (added if missing).
    const others = original.social.filter((s) => s.platform !== 'instagram');
    const instagram = original.social.find((s) => s.platform === 'instagram');
    await putSettings(admin, {
      social: [
        ...others,
        {
          platform: 'instagram',
          url: instagram?.url || 'https://www.instagram.com/niraum-e2e',
          isActive: true,
          order: instagram?.order ?? others.length,
        },
      ],
    });

    // Baseline: the footer shows the icon while the link is active.
    await asVisitor(browser, baseURL!, async (home) => {
      await home.goto('/en');
      // The first visit to the public site compiles it in the dev server: allow for that.
      await expect(footerInstagram(home)).toHaveCount(1, { timeout: 20_000 });
    });

    await signInAndWait(page, ADMIN_EMAIL);
    await page.goto('/admin/settings?tab=social');
    const toggle = page.getByRole('switch', { name: 'Instagram active' });
    await expect(toggle).toBeChecked();
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    const saved = page.waitForResponse(
      (r) => r.url().endsWith('/api/v1/admin/settings') && r.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Save social links' }).click();
    expect((await saved).status()).toBe(200);
    await expect(page.getByText('Settings saved')).toBeVisible();

    // The public site no longer links to Instagram. Checked as a fresh visitor: the admin's
    // own browser already holds GET /settings/public (the Logo uses it), which is served with
    // `max-age=60, stale-while-revalidate=300`, so it may show the old links for a while.
    await asVisitor(browser, baseURL!, async (home) => {
      const publicSettings = home.waitForResponse((r) =>
        r.url().includes('/api/v1/settings/public'),
      );
      await home.goto('/en');
      const res = await publicSettings;
      const socials = ((await res.json()) as { data: { social: Social[] } }).data.social;
      expect(socials.some((s) => s.platform === 'instagram')).toBe(false);
      await expect(home.getByRole('contentinfo')).toBeVisible();
      await expect(footerInstagram(home)).toHaveCount(0);
    });
  } finally {
    await putSettings(admin, { social: original.social });
    await admin.dispose();
  }
});

test('create and publish a product', async ({ page, playwright, baseURL, request }) => {
  const admin = await apiAs(playwright, baseURL!, ADMIN_EMAIL);
  const stamp = Date.now();
  const nameEn = `E2E test product ${stamp}`;
  const nameNe = `परीक्षण उत्पादन ${stamp}`;
  let id: string | undefined;
  try {
    await signInAndWait(page, ADMIN_EMAIL);
    await page.goto('/admin/products/new');
    await expect(page.getByRole('heading', { name: 'New product', level: 1 })).toBeVisible();

    await page.getByLabel('Name (English)').fill(nameEn);
    await page
      .getByRole('tablist', { name: 'Name language' })
      .getByRole('tab', { name: /नेपाली/ })
      .click();
    await page.getByLabel('Name (Nepali)').fill(nameNe);

    await page.getByRole('combobox', { name: 'Status' }).click();
    await page.getByRole('option', { name: 'Published' }).click();

    const created = page.waitForResponse(
      (r) => r.url().endsWith('/api/v1/admin/products') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const res = await created;
    expect(res.status(), await res.text()).toBe(201);
    id = ((await res.json()) as { data: { id: string } }).data.id;
    await expect(page).toHaveURL(new RegExp(`/admin/products/${id}$`));
    await expect(page.getByRole('heading', { name: nameEn, level: 1 })).toBeVisible();

    // Published on the public API, with the Nepali name in Nepali.
    const ne = await request.get('/api/v1/products?lang=ne');
    expect(ne.status()).toBe(200);
    const list = ((await ne.json()) as { data: { name: string }[] }).data;
    expect(list.map((p) => p.name)).toContain(nameNe);
  } finally {
    // Into the trash (soft delete, the only delete the API offers): gone from the public site.
    if (id) {
      const del = await admin.delete(`/api/v1/admin/products/${id}`);
      expect(del.ok(), await del.text()).toBe(true);
      const after = await request.get('/api/v1/products?lang=ne');
      const names = ((await after.json()) as { data: { name: string }[] }).data.map((p) => p.name);
      expect(names).not.toContain(nameNe);
    }
    await admin.dispose();
  }
});

test('editor cannot open settings', async ({ page }) => {
  await signInAndWait(page, EDITOR_EMAIL);
  const sidebar = page.getByRole('navigation').first();
  await expect(sidebar.getByRole('link', { name: 'Products' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Settings' })).toHaveCount(0);

  // A stale bookmark: the page says so instead of rendering a blank screen or looping.
  await page.goto('/admin/settings');
  await expect(
    page.getByRole('heading', { name: "You don't have access", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toHaveCount(0);

  // And the API refuses too.
  const res = await page.request.get('/api/v1/admin/settings');
  expect(res.status()).toBe(403);
});
