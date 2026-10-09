import { expect, test } from '@playwright/test';

test('home renders brand heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Niraum Metals');
});
