const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const baseUrl = process.env.TANNO_URL || 'http://127.0.0.1:4190/';
const qaDir = path.resolve(__dirname, '..', 'qa');
fs.mkdirSync(qaDir, { recursive: true });

test('the real code viewer scrolls, inspects, runs the Summon engine, copies, and resets', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await expect(page.locator('#code-status')).toContainText('SOURCE LOADED');
  expect(await page.locator('#code-lines .code-line').count()).toBeGreaterThan(180);
  expect(await page.locator('#code-scroll').evaluate((node) => node.scrollHeight > node.clientHeight)).toBeTruthy();
  expect(await page.locator('#code-scroll').evaluate((node) => getComputedStyle(node).whiteSpace)).toBe('pre');
  await page.locator('#code-scroll').evaluate((node) => { node.scrollTop = 400; });
  expect(await page.locator('#code-scroll').evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await page.locator('#code-scroll').evaluate((node) => { node.scrollTop = 0; });
  await page.locator('#code').scrollIntoViewIfNeeded();
  await expect(page.locator('#code')).toHaveCSS('opacity', '1');
  await page.locator('#code').screenshot({ path: path.join(qaDir, 'archive-code-1920.png') });

  const inspectable = page.locator('#code-lines .code-line[data-inspect="mulberry32"]').first();
  await inspectable.hover();
  await expect(page.locator('#archive-tooltip')).toBeVisible();
  await expect(page.locator('#archive-tooltip')).toContainText('DETERMINISTIC RNG');
  await inspectable.click();
  await expect(page.locator('#code-inspector')).toBeVisible();
  await expect(page.locator('#code-inspector')).toContainText('The same seed');
  await page.keyboard.press('Escape');
  await expect(page.locator('#code-inspector')).toBeHidden();

  await page.locator('[data-code-tab="RARITY"]').click();
  await expect(page.locator('#code-file')).toContainText('RARITY');
  await expect(page.locator('#code-lines')).toContainText('function classify');
  await page.locator('[data-code-tab="MORTALITY"]').click();
  await expect(page.locator('#code-lines')).toContainText('createBurnCheckedInstruction');
  await page.locator('[data-code-tab="TYPES"]').click();
  await expect(page.locator('#code-lines')).toContainText('function lifeEngine');
  await page.locator('#code-run').click();
  await expect(page.locator('#code-output')).toBeVisible();
  const expected = await page.evaluate(() => window.__TANNO_TEST__.lifeEngine(777));
  const output = await page.locator('#code-output-text').textContent();
  expect(output).toContain(JSON.stringify(expected, null, 2));
  await page.locator('#code-run-id').fill('12321');
  await page.locator('#code-run').click();
  await expect(page.locator('#code-output-text')).toContainText('TANNO #000012321');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('#code-copy').click();
  await expect(page.locator('#code-copy')).toHaveText('[ COPIED ]');
  await expect(page.locator('#code-copy')).toHaveText('[ COPY ]', { timeout: 2500 });
  await page.locator('#code-reset').click();
  await expect(page.locator('#code-output')).toBeHidden();
  await expect(page.locator('[data-code-tab="ENGINE"]')).toHaveAttribute('aria-selected', 'true');
  expect(errors).toEqual([]);
});

test('archive details respond without inventing on-chain state or non-English text', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => /[\u3400-\u9fff\u3040-\u30ff]/.test(document.body.innerText))).toBeFalsy();
  await page.locator('#index-toggle').click();
  expect(await page.locator('#archive-index a').count()).toBeGreaterThanOrEqual(25);
  await page.locator('#archive-index a[href="#seller"]').click();
  await expect(page.locator('#archive-index')).toBeHidden();
  await expect(page.locator('#archive-return')).toBeVisible();
  await expect(page.locator('#seller .seller-scene')).toContainText('CONCEPT SKETCH');
  await page.locator('#seller blockquote').hover();
  await expect(page.locator('#archive-tooltip')).toContainText('No token is burned');
  await page.locator('#archive-return').click();
  await expect(page.locator('#archive-return')).toBeHidden();

  await page.locator('#village .art-glyph').first().hover();
  await expect(page.locator('#archive-tooltip')).toContainText('DEMO SPECIMEN');
  await page.locator('#graveyard .art-glyph').first().hover();
  await expect(page.locator('#archive-tooltip')).toContainText('not a verified death');
  await page.locator('#keepalive .keepalive-trace').hover();
  await expect(page.locator('#archive-tooltip')).toContainText('small signal');
  await page.locator('#flagship .flagship-signal').hover();
  await expect(page.locator('#archive-tooltip')).toContainText('indexed wallet snapshot');

  const diary = page.locator('.diary .e').first();
  await diary.locator('button').click();
  await expect(diary.locator('.diary-meta')).toContainText('ARCHIVE TYPE: DIARY');
  await diary.locator('button').click();
  await expect(diary.locator('.diary-meta')).toBeHidden();
  const faq = page.locator('#faq details').first();
  await expect(faq).not.toHaveAttribute('open');
  await faq.locator('summary').click();
  await expect(faq).toHaveAttribute('open');
  await expect(faq).toContainText('you tend one');
  await faq.locator('summary').click();
  await expect(faq).not.toHaveAttribute('open');
  await page.locator('#lexicon dt a[href="#flagship"]').click();
  await expect(page).toHaveURL(/#flagship$/);
  expect(errors).toEqual([]);
});

test('desktop sizes and mobile tooltips keep the original measure and no overflow', async ({ page }) => {
  for (const [width, height] of [[2560, 1440], [1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await expect(page.locator('#code-status')).toContainText('SOURCE LOADED');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    if (width > 760) {
      expect(await page.locator('#code').evaluate((node) => Math.round(node.getBoundingClientRect().width))).toBe(820);
      await page.locator('#code').screenshot({ path: path.join(qaDir, `archive-code-${width}.png`) });
    } else {
      expect(await page.locator('#code-scroll').evaluate((node) => node.scrollWidth > node.clientWidth)).toBeTruthy();
      await page.locator('#seller blockquote').click();
      await expect(page.locator('#archive-tooltip')).toBeVisible();
      const bounds = await page.locator('#archive-tooltip').boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      await page.locator('#seller h2').click();
      await expect(page.locator('#archive-tooltip')).toBeHidden();
      await page.locator('#code').scrollIntoViewIfNeeded();
      await expect(page.locator('#code')).toHaveCSS('opacity', '1');
      await page.locator('#code').screenshot({ path: path.join(qaDir, 'archive-code-mobile.png') });
    }
  }
});
