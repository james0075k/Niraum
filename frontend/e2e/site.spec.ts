import { expect, test, type Page } from '@playwright/test';

/** Skip the once-per-session preloader and the cookie banner so tests start on content. */
async function quietStart(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('niraum-preloaded', '1');
      localStorage.setItem(
        'niraum-consent',
        JSON.stringify({ essential: true, analytics: false, at: '2026-01-01' }),
      );
    } catch {
      /* ignore */
    }
  });
}

test.beforeEach(async ({ page }) => {
  await quietStart(page);
});

test('home loads with the motto, operations and footer', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/Mining Company in Nepal/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Strength Forged For Generations',
  );
  await expect(
    page.getByRole('heading', { name: 'Iron Ore', level: 3, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('contentinfo')).toContainText(
    `© ${new Date().getFullYear()} Niraum Metals Pvt. Ltd.`,
  );
  // Prerendered HTML hydrates without mismatches.
  expect(errors).toEqual([]);
});

test('theme toggle switches and remembers the theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).not.toHaveClass(/\bdark\b/);

  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(html).toHaveClass(/\bdark\b/);

  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
});

test('contact form validates, submits and confirms', async ({ page }) => {
  let payload: Record<string, string> | null = null;
  // The API lands in Phase 4 — stub it here.
  await page.route('**/api/v1/contact', async (route) => {
    payload = route.request().postDataJSON() as Record<string, string>;
    await route.fulfill({ status: 201, json: { data: { ok: true } } });
  });

  await page.goto('/contact?subject=Quote%20request');
  const form = page.getByRole('form', { name: 'Contact form' });
  await expect(form.getByLabel('Subject *')).toHaveValue('Quote request');

  await form.getByRole('button', { name: /Send message/ }).click();
  await expect(form.getByText('Please enter your name.')).toBeVisible();

  await form.getByLabel('Full name *').fill('Sita Sharma');
  await form.getByLabel('Email *').fill('sita@example.com');
  await form.getByLabel('Message *').fill('We need 200 m3 of 20 mm aggregate in Lalitpur.');
  await form.getByRole('button', { name: /Send message/ }).click();

  await expect(page.getByText('Thank you — your message has been sent.')).toBeVisible();
  expect(payload).toMatchObject({
    name: 'Sita Sharma',
    email: 'sita@example.com',
    subject: 'Quote request',
    website: '',
  });
});

test('unknown pages show the branded 404', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This path leads off the map.');
  await expect(page.getByRole('link', { name: 'Back home' })).toBeVisible();
});

// Admin login is built in Phase 5; this spec is the acceptance test it must pass.
test.fixme('admin can sign in', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('change-me-on-first-login');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
