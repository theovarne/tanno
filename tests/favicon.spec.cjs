const { test, expect } = require('@playwright/test');

const baseUrl = process.env.TANNO_URL || 'http://127.0.0.1:4190/';

test('browser favicon uses the supplied amber ghost image', async ({ page }) => {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  const iconPath = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(iconPath).toBe('./assets/images/sevra/amber-ghost.png');
  const response = await page.request.get(new URL(iconPath, baseUrl).href);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^image\/png/);
  const dimensions = await page.evaluate(async (src) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  }, iconPath);
  expect(dimensions).toEqual([1254, 1254]);
});
