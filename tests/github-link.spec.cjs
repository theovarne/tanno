const { test, expect } = require('@playwright/test');

const baseUrl = process.env.TANNO_URL || 'http://127.0.0.1:4190/';

test('hero GitHub entry keeps the metadata row and opens the real repository safely', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  const row = page.locator('header .links').first();
  const link = row.locator('a[href="https://github.com/theovarne/tanno"]');
  await expect(link).toHaveText('github');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  const geometry = await row.evaluate((element) => {
    const links = Array.from(element.querySelectorAll('a, span'));
    return {
      heights: links.map((item) => Math.round(item.getBoundingClientRect().top)),
      widths: links.map((item) => item.getBoundingClientRect().width),
    };
  });
  expect(Math.max(...geometry.heights) - Math.min(...geometry.heights)).toBeLessThanOrEqual(2);
  expect(geometry.widths.every((width) => width > 0)).toBe(true);
});
