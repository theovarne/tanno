const { test, expect } = require('@playwright/test');

const baseUrl = process.env.TANNO_URL || 'http://127.0.0.1:4190/';

test('both Twitter/X links use the configured tanno_token account', async ({ page }) => {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await expect(page.locator('a[href="https://x.com/tanno_token"]')).toHaveCount(2);
  await expect(page.locator('a[href="https://x.com/Tanno_1ot"]')).toHaveCount(0);
  const config = await page.request.get(new URL('config/project.json', baseUrl).href);
  expect((await config.json()).X_URL).toBe('https://x.com/tanno_token');
});
