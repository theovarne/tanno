const { test, expect } = require('@playwright/test');
const baseUrl = process.env.TANNO_URL || 'http://127.0.0.1:4190/';

test('all 25 archive anchors remain reachable from Index without console errors or missing assets', async ({ page }) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', (request) => errors.push(`${request.url()} ${request.failure()?.errorText}`));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  const ids = await page.locator('section[id]').evaluateAll((sections) => sections.map((section) => section.id));
  expect(ids).toHaveLength(25);
  for (const id of ids) {
    await page.locator('#index-toggle').click();
    await page.locator(`#archive-index a[href="#${id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator('#archive-index')).toBeHidden();
    await expect.poll(() => page.locator(`#${id}`).evaluate((node) => Math.round(node.getBoundingClientRect().top)), { timeout: 5000 }).toBeGreaterThanOrEqual(38);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
});
