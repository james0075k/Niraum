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

/** Waits until the prerendered page has hydrated (see App.tsx). */
const hydrated = (page: Page) =>
  page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');

test('home loads with the motto, what we supply and footer', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // Phase 4.5: `/` redirects to the visitor's language.
  await page.goto('/');
  await expect(page).toHaveURL(/\/en$/);
  await expect(page).toHaveTitle(/Iron Ore Supplier in Nepal/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Strength Forged For Generations',
  );
  await expect(
    page.getByRole('heading', { name: 'Hematite ore for cement plants', level: 3 }),
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
  await hydrated(page);
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

  await page.goto('/en/contact?tab=message&subject=Quote%20request');
  await hydrated(page);
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

// ── Phase 4.5 ───────────────────────────────────────────────────────────────

test('language toggle switches /en ↔ /ne, keeps the page and sets <html lang>', async ({
  page,
}) => {
  await page.goto('/en/technical-data');
  await hydrated(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page
    .getByRole('navigation', { name: 'Language' })
    .first()
    .getByRole('link', { name: 'Switch to नेपाली' })
    .click();
  await expect(page).toHaveURL(/\/ne\/technical-data$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ne');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('परीक्षण र ग्रेड विवरण।');
  // The choice is remembered: `/` now opens Nepali.
  await page.goto('/');
  await expect(page).toHaveURL(/\/ne$/);
});

test('every page declares hreflang en, ne and x-default', async ({ page }) => {
  await page.goto('/ne/products');
  const href = (l: string) => page.locator(`link[rel="alternate"][hreflang="${l}"]`);
  await expect(href('en')).toHaveAttribute('href', /\/en\/products$/);
  await expect(href('ne')).toHaveAttribute('href', /\/ne\/products$/);
  await expect(href('x-default')).toHaveAttribute('href', /\/en\/products$/);
});

for (const lang of ['en', 'ne'] as const) {
  test(`bulk supply inquiry submits (${lang})`, async ({ page }) => {
    let payload: Record<string, unknown> | null = null;
    await page.route('**/api/v1/inquiries', async (route) => {
      payload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 201, json: { data: { id: 'x' } } });
    });
    const L =
      lang === 'en'
        ? {
            company: 'Company name *',
            contact: 'Contact person *',
            email: 'Email *',
            phone: 'Phone *',
            buyer: 'Buyer type *',
            qty: 'Required quantity',
            unit: 'Unit',
            submit: 'Send inquiry',
            done: 'Thank you — your inquiry has been sent.',
          }
        : {
            company: 'कम्पनीको नाम *',
            contact: 'सम्पर्क व्यक्ति *',
            email: 'इमेल *',
            phone: 'फोन *',
            buyer: 'खरिदकर्ताको प्रकार *',
            qty: 'आवश्यक परिमाण',
            unit: 'एकाइ',
            submit: 'सोधपुछ पठाउनुहोस्',
            done: 'धन्यवाद — तपाईंको सोधपुछ पठाइयो।',
          };

    await page.goto(`/${lang}/contact`);
    await hydrated(page);
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: L.submit }) });
    await form.getByLabel(L.company).fill('Himal Cement');
    await form.getByLabel(L.contact).fill('Sita Sharma');
    await form.getByLabel(L.email).fill('sita@example.com');
    await form.getByLabel(L.phone).fill('+977 1 5555555');
    await form.getByLabel(L.buyer).selectOption('cement');
    await form.getByLabel(L.qty).fill('500');
    await form.getByLabel(L.unit).selectOption('tpm');
    await form.getByRole('button', { name: L.submit }).click();

    await expect(page.getByText(L.done)).toBeVisible();
    expect(payload).toMatchObject({
      companyName: 'Himal Cement',
      buyerType: 'cement',
      quantity: 500,
      quantityUnit: 'tpm',
      lang,
      sourcePage: `/${lang}/contact`,
    });
  });
}

test('technical data shows Table 14, the chart and the data-origin note', async ({ page }) => {
  await page.goto('/en/technical-data');
  await hydrated(page);
  const table = page.getByRole('table', { name: /Length-weighted average grade/ });
  await expect(table.getByRole('row', { name: /Weighted average/ })).toContainText('33.59');
  await expect(page.getByRole('figure', { name: 'Fe₂O₃ by section' })).toBeVisible();
  await expect(page.getByText(/not a JORC\/NI 43-101 reserve statement/).first()).toBeVisible();
  await expect(page.getByText(/high[- ]grade/i)).toHaveCount(0);
});

test('new pages render in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  for (const path of ['/en/our-project', '/ne/products', '/en/investors']) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
});

test('retired pages redirect to their replacement in the same language', async ({ page }) => {
  for (const [from, to] of [
    ['/en/projects', '/en/our-project'],
    ['/ne/operations', '/ne/products'],
    ['/en/news/how-iron-ore-exploration-starts', '/en/about'],
    ['/careers', '/en/contact'],
  ] as const) {
    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(`${to}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
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
