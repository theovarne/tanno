const { test, expect } = require('@playwright/test');
const path = require('path');

const baseUrl = process.env.TANNO_URL || 'http://127.0.0.1:4190/';
const qaDir = path.resolve(__dirname, '..', 'qa');

async function snapshot(page) {
  return page.evaluate(() => ({
    id: window.__TANNO_TEST__.state.selectedId,
    image: document.getElementById('portrait-gallery-image').src,
    life: JSON.parse(JSON.stringify(window.__TANNO_TEST__.state.selectedLife)),
  }));
}

async function summonId(page, id, enter = false) {
  await page.locator('#vid').fill(String(id));
  if (enter) await page.locator('#vid').press('Enter');
  else await page.locator('#vgo').click();
  await expect(page.locator('#vfeedback')).toHaveText('IDENTITY COMPUTED / STATUS SEPARATE');
  await expect(page.locator('#vname')).toHaveText(`TANNO #${String(id).padStart(9, '0')}`);
  return snapshot(page);
}

test('SUMMON deterministically binds each life record to one image, with no carousel UI', async ({ page, request }) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  const images = await page.locator('#specimen-images').evaluate((node) => JSON.parse(node.textContent));
  expect(images).toHaveLength(36);
  expect(await page.locator('#portrait-prev, #portrait-next, #portrait-count, .portrait-gallery-controls').count()).toBe(0);
  expect(await page.locator('.vportrait').innerText()).toBe('');
  const portrait = page.locator('#portrait-gallery-image');
  await expect(page.locator('#portrait-gallery')).toBeVisible();
  expect(await portrait.evaluate((image) => image.complete && image.naturalWidth > 0)).toBeTruthy();
  expect(await portrait.evaluate((image) => getComputedStyle(image).objectFit)).toBe('contain');
  expect(await portrait.evaluate((image) => getComputedStyle(image).imageRendering)).toBe('pixelated');
  for (const source of images) {
    const response = await request.get(new URL(source.replace(/^\.\//, ''), baseUrl).href);
    expect(response.status(), source).toBe(200);
  }

  const initial = await snapshot(page);
  expect(initial.id).toBe(777);
  expect(initial.life.imageSrc).toBe(images[initial.life.imageIndex]);
  await portrait.click();
  expect(await snapshot(page)).toEqual(initial);
  await page.reload({ waitUntil: 'networkidle' });
  expect(await snapshot(page)).toEqual(initial);

  for (const id of [1, 777, 12321, 404217746]) {
    const first = await summonId(page, id);
    const again = await summonId(page, id);
    expect(again).toEqual(first);
    expect(first.life.imageSrc).toBe(images[first.life.imageIndex]);
  }
  const life404 = await snapshot(page);
  const beforeInput = await snapshot(page);
  await page.locator('#vid').fill('777');
  expect(await snapshot(page)).toEqual(beforeInput);
  const life777 = await summonId(page, 777);
  expect(life777.image).not.toBe(life404.image);
  expect(await summonId(page, 404217746)).toEqual(life404);
  await page.reload({ waitUntil: 'networkidle' });
  expect(await summonId(page, 404217746)).toEqual(life404);
  expect(await summonId(page, 12321, true)).toEqual(await summonId(page, 12321));

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const beforeCopy = await snapshot(page);
  await page.locator('#vcopy-id').click();
  await expect(page.locator('#vfeedback')).toHaveText('ID COPIED');
  expect(await snapshot(page)).toEqual(beforeCopy);
  await page.locator('#vcopy-record').click();
  await expect(page.locator('#vfeedback')).toHaveText('RECORD COPIED');
  expect(await snapshot(page)).toEqual(beforeCopy);
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(JSON.parse(copied)).toEqual(beforeCopy.life);

  const beforeRandom = await snapshot(page);
  await page.locator('#vrand').click();
  await expect(page.locator('#vfeedback')).toHaveText('IDENTITY COMPUTED / STATUS SEPARATE');
  const randomLife = await snapshot(page);
  expect(randomLife.id).not.toBe(beforeRandom.id);
  expect(randomLife.image).not.toBe(beforeRandom.image);
  expect(randomLife.life).not.toEqual(beforeRandom.life);
  expect(['rarity', 'species', 'palette', 'eyes', 'temperament', 'lifespanClass', 'body', 'trait']
    .some((key) => randomLife.life[key] !== beforeRandom.life[key])).toBeTruthy();
  await expect(page.locator('#vid')).toHaveValue(String(randomLife.id));
  await expect(page.locator('#vname')).toHaveText(randomLife.life.name);

  await page.locator('#demo').scrollIntoViewIfNeeded();
  await expect(page.locator('#howmade')).toHaveCSS('opacity', '1');
  await page.locator('#demo').screenshot({ path: path.join(qaDir, 'sevra-specimen-1920.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.locator('#demo').screenshot({ path: path.join(qaDir, 'sevra-specimen-mobile.png') });
  expect(errors).toEqual([]);
});

