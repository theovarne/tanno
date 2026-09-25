const { test, expect } = require('@playwright/test');
const baseUrl = process.env.TANNO_URL || 'http://127.0.0.1:4190/';
const mint = 'So11111111111111111111111111111111111111112';
const observedAt = '2026-09-24T23:44:21Z';
const diedAt = '2026-09-24T23:31:18Z';

function json(route, result) {
  return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type' }, body: JSON.stringify(result) });
}

test('Census, Heartbeat, and verified death timestamps use EDT through one formatter', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/config/project.json', (route) => json(route, {
    TOKEN_MINT: mint, TOKEN_SYMBOL: 'TANNO', NETWORK: 'mainnet-beta',
    RPC_ENDPOINT: 'http://127.0.0.1:4191/rpc', INDEXER_ENDPOINT: 'http://127.0.0.1:4191/indexer',
  }));
  await page.route('**/rpc', (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type' } });
    return json(route, { jsonrpc: '2.0', id: 1, result: { value: { amount: '1000000000', decimals: 0 } } });
  });
  await page.route('**/indexer/**', (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type' } });
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/census')) return json(route, { mint, observedAt, circulating: 1, activity: { buckets5m: [1, 2], transfers5m: 2, lastEventAt: observedAt } });
    if (pathname.endsWith('/legendary')) return json(route, { mint, records: {} });
    if (pathname.endsWith('/graveyard')) return json(route, { mint, records: [{ id: 777, signature: '5JK1111111111111111111111111111111111111111111111111111111111111', diedAt }] });
    if (pathname.endsWith('/life/777')) return json(route, { mint, status: 'DEAD', burnTx: '5JK1111111111111111111111111111111111111111111111111111111111111', diedAt });
    return json(route, { mint });
  });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await expect(page.locator('#census-observed')).toHaveAttribute('data-archive-time', '2026-09-24T23:44:21.000Z');
  await expect(page.locator('#heartbeat-last')).toHaveAttribute('data-archive-time', '2026-09-24T23:44:21.000Z');
  await page.locator('#census-observed').hover();
  await expect(page.locator('#archive-tooltip')).toContainText('SEP 24 2026 · 07:44:21 PM EDT');
  await expect(page.locator('#graveyard-list')).toContainText('SEP 24 2026 · 07:31:18 PM EDT');
  await page.locator('#graveyard-search').fill('777');
  await page.locator('#graveyard-go').click();
  await expect(page.locator('#graveyard-results')).toContainText('SEP 24 2026 · 07:31:18 PM EDT');
  expect(errors).toEqual([]);
});
