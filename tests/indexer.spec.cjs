const { test, expect } = require('@playwright/test');

const baseUrl = process.env.TANNO_URL || 'http://127.0.0.1:4190/';
const mint = 'So11111111111111111111111111111111111111112';
const walletAddress = '11111111111111111111111111111111';

function routeJson(route, result) {
  if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type' } });
  return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(result) });
}

test('an indexer turns the archive into verified census, village, and graveyard records', async ({ page }) => {
  const errors = [];
  let rpcCalls = 0;
  let indexerCalls = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/config/project.json', (route) => routeJson(route, {
    TOKEN_MINT: mint, TOKEN_SYMBOL: 'TANNO', RPC_ENDPOINT: 'http://127.0.0.1:4191/rpc',
    INDEXER_ENDPOINT: 'http://127.0.0.1:4191/indexer', NETWORK: 'mainnet-beta',
  }));
  await page.route('**/rpc', (route) => {
    rpcCalls += route.request().method() === 'POST' ? 1 : 0;
    const method = route.request().postDataJSON()?.method;
    if (method === 'getTokenSupply') return routeJson(route, { jsonrpc: '2.0', id: 1, result: { value: { amount: '1000000000', decimals: 0 } } });
    return routeJson(route, { jsonrpc: '2.0', id: 2, result: { value: [{ pubkey: walletAddress, account: { owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', data: { parsed: { info: { owner: walletAddress, tokenAmount: { amount: '12', decimals: 0 } } } } } }] } });
  });
  await page.route('**/indexer/**', (route) => {
    indexerCalls += 1;
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/census')) return routeJson(route, { mint, circulating: 999990000, alive: 999990000, burned: 10000, caretakers: 451, transfers24h: 281, observedAt: new Date().toISOString(), activity: { buckets5m: [1, 2, 1, 4, 3, 1], transfers5m: 12, lastEventAt: new Date().toISOString() } });
    if (pathname.endsWith('/legendary')) return routeJson(route, { mint, records: { 1: { status: 'ALIVE' }, 777: { status: 'DEAD' } } });
    if (pathname.endsWith('/graveyard')) return routeJson(route, { mint, records: [{ id: 777, signature: '5JK1111111111111111111111111111111111111111111111111111111111111' }] });
    if (pathname.endsWith('/life/777')) return routeJson(route, { mint, status: 'DEAD', burnTx: '5JK1111111111111111111111111111111111111111111111111111111111111', ageDays: 41 });
    if (pathname.endsWith(`/wallet/${walletAddress}`)) return routeJson(route, { mint, wallet: walletAddress, ids: [1, 777, 12321], population: 12, snapshotSlot: 123 });
    return routeJson(route, { mint, status: 'NOT INDEXED' });
  });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await expect(page.locator('#census-burned')).toHaveText('10,000');
  await expect(page.locator('#heartbeat-transfers')).toHaveText('12 / 5M');
  await expect(page.locator('#graveyard-count')).toContainText('1 VERIFIED');
  await expect(page.locator('#legendary-body')).toContainText('DEAD');
  await page.locator('#graveyard-search').fill('777');
  await page.locator('#graveyard-go').click();
  await expect(page.locator('#graveyard-results')).toContainText('HERE LIES #000000777');

  await page.evaluate(() => {
    const account = { address: '11111111111111111111111111111111', publicKey: new Uint8Array(32), chains: ['solana:mainnet'], features: ['solana:signAndSendTransaction'] };
    const wallet = { version: '1.0.0', name: 'Phantom', icon: 'data:image/svg+xml,<svg/>', chains: ['solana:mainnet'], accounts: [account], features: {
      'standard:connect': { version: '1.0.0', connect: async () => ({ accounts: [account] }) },
      'standard:disconnect': { version: '1.0.0', disconnect: async () => {} },
      'standard:events': { version: '1.0.0', on: () => () => {} },
      'solana:signAndSendTransaction': { version: '1.0.0', supportedTransactionVersions: ['legacy'], signAndSendTransaction: async () => { throw new Error('not used'); } },
    } };
    dispatchEvent(new CustomEvent('wallet-standard:register-wallet', { detail: ({ register }) => register(wallet) }));
  });
  await page.locator('#wallet-connect').click();
  await page.getByRole('button', { name: 'Phantom' }).click();
  await expect(page.locator('#village-population')).toHaveText('12');
  await expect(page.locator('#village-flagship')).toHaveText('#000000001');
  await expect(page.locator('#village-grid button')).toHaveCount(3);
  await expect(page.locator('#village-more')).toHaveText('+ 9 MORE');
  await expect(page.locator('#village-note')).toContainText('indexer snapshot');
  expect(rpcCalls).toBe(2);
  expect(indexerCalls).toBeLessThanOrEqual(6);
  expect(errors).toEqual([]);
});

test('a wallet on the wrong network is refused before account reads', async ({ page }) => {
  await page.route('**/config/project.json', (route) => routeJson(route, { TOKEN_MINT: mint, RPC_ENDPOINT: 'http://127.0.0.1:4191/rpc' }));
  await page.route('**/rpc', (route) => routeJson(route, { jsonrpc: '2.0', id: 1, result: { value: { amount: '1000000000', decimals: 0 } } }));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const account = { address: '11111111111111111111111111111111', publicKey: new Uint8Array(32), chains: ['solana:devnet'], features: [] };
    const wallet = { version: '1.0.0', name: 'Backpack', icon: 'data:image/svg+xml,<svg/>', chains: ['solana:mainnet'], accounts: [account], features: {
      'standard:connect': { version: '1.0.0', connect: async () => ({ accounts: [account] }) },
    } };
    dispatchEvent(new CustomEvent('wallet-standard:register-wallet', { detail: ({ register }) => register(wallet) }));
  });
  await page.locator('#wallet-connect').click();
  await page.getByRole('button', { name: 'Backpack' }).click();
  await expect(page.locator('#wallet-state')).toContainText('configured Solana network');
  await expect(page.locator('#village-balance')).toHaveText('—');
  await expect(page.locator('#burn-review')).toBeDisabled();
});

