const { test, expect } = require('@playwright/test');
const path = require('path');

const baseUrl = process.env.TANNO_URL || 'http://127.0.0.1:4190/';
const qaDir = path.resolve(__dirname, '..', 'qa');

test('amber theme preserves the archive geometry, art, and resource integrity', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  const values = await page.evaluate(() => {
    const css = (selector, property) => getComputedStyle(document.querySelector(selector))[property];
    return {
      background: css('body', 'backgroundColor'),
      body: css('body', 'color'),
      label: css('.sec', 'color'),
      number: css('.bignum', 'color'),
      link: css('.links a', 'color'),
      button: css('#vgo', 'backgroundColor'),
      codeKeyword: css('.syntax-keyword', 'color'),
      width: document.querySelector('section').getBoundingClientRect().width,
      font: css('body', 'fontFamily'),
      hero: document.querySelector('.hero-image-shell img').getAttribute('src'),
      heroFilter: css('.hero-image-shell img', 'filter'),
    };
  });
  expect(values).toEqual({
    background: 'rgb(5, 4, 2)', body: 'rgb(216, 210, 199)', label: 'rgb(204, 121, 13)',
    number: 'rgb(246, 160, 25)', link: 'rgb(155, 200, 255)', button: 'rgb(245, 154, 24)',
    codeKeyword: 'rgb(243, 161, 28)', width: 820,
    font: '"Courier New", Courier, monospace', hero: './assets/images/sevra/amber-ghost.png', heroFilter: 'none',
  });

  for (const id of ['howmade', 'code', 'graveyard', 'diary', 'faq']) {
    await page.evaluate((name) => document.getElementById(name).scrollIntoView({ behavior: 'instant', block: 'start' }), id);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(qaDir, `amber-${id}.jpg`), type: 'jpeg', quality: 70 });
  }
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: path.join(qaDir, 'amber-2560.jpg'), type: 'jpeg', quality: 70 });
  expect(errors).toEqual([]);
});
