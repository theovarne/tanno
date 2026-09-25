const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const baseUrl = process.env.TANNO_URL || 'http://127.0.0.1:4190/';
const qaDir = path.resolve(__dirname, '..', 'qa');
fs.mkdirSync(qaDir, { recursive: true });

function captureErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', (request) => errors.push(`${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  return errors;
}

async function registerWallet(page, { name = 'Phantom', accountChain = 'solana:mainnet', walletChain = 'solana:mainnet' } = {}) {
  await page.evaluate(({ name, accountChain, walletChain }) => {
    window.__mockSignCalls = 0;
    const account = {
      address: '11111111111111111111111111111111',
      publicKey: new Uint8Array(32),
      chains: [accountChain],
      features: ['solana:signAndSendTransaction'],
    };
    const wallet = {
      version: '1.0.0', name,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
      chains: [walletChain], accounts: [account],
      features: {
        'standard:connect': { version: '1.0.0', connect: async () => ({ accounts: [account] }) },
        'standard:disconnect': { version: '1.0.0', disconnect: async () => {} },
        'standard:events': { version: '1.0.0', on: () => () => {} },
        'solana:signAndSendTransaction': {
          version: '1.0.0', supportedTransactionVersions: ['legacy'],
          signAndSendTransaction: async ({ transaction, chain }) => {
            if (!transaction?.length || chain !== 'solana:mainnet') throw new Error('Invalid test transaction');
            window.__mockSignCalls += 1;
            return [{ signature: new Uint8Array(64).fill(1) }];
          },
        },
      },
    };
    window.dispatchEvent(new CustomEvent('wallet-standard:register-wallet', { detail: ({ register }) => register(wallet) }));
  }, { name, accountChain, walletChain });
}

test('pre-launch archive, summon, wallet, and mobile work without RPC', async ({ page }) => {
  test.setTimeout(90000);
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await expect(page.locator('#site-status')).toHaveText('STATUS: AWAITING BIRTH');
  await expect(page.locator('#census-state')).toHaveText('THE CENSUS HAS NOT STARTED');
  await expect(page.locator('#ca')).toHaveText('CA: TBA');
  await expect(page.locator('#graveyard-state')).toHaveText('THE GRAVEYARD IS EMPTY');
  await expect(page.locator('section')).toHaveCount(25);
  expect(await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].filter((a) => a.hash && !document.querySelector(a.hash)).map((a) => a.hash))).toEqual([]);
  const metrics = await page.evaluate(() => {
    const section = document.querySelector('section');
    const body = getComputedStyle(document.body);
    const css = getComputedStyle(section);
    return {
      width: section.getBoundingClientRect().width,
      bodyFont: body.fontFamily,
      bodySize: body.fontSize,
      bodyColor: body.color,
      background: body.backgroundColor,
      accent: getComputedStyle(document.querySelector('.sec')).color,
      padding: css.padding,
      navHeight: document.querySelector('.toc').getBoundingClientRect().height,
    };
  });
  expect(metrics).toEqual({ width: 820, bodyFont: '"Courier New", Courier, monospace', bodySize: '14px', bodyColor: 'rgb(216, 210, 199)', background: 'rgb(5, 4, 2)', accent: 'rgb(204, 121, 13)', padding: '68px 0px 64px', navHeight: 48 });
  await page.screenshot({ path: path.join(qaDir, 'preview-desktop-top.png') });

  await page.locator('#index-toggle').click();
  await expect(page.locator('#archive-index')).toBeVisible();
  await page.locator('#archive-index a[href="#census"]').click();
  await expect(page.locator('#archive-index')).toBeHidden();
  await page.locator('#vid').fill('777');
  await page.locator('#vgo').click();
  const original = await page.locator('#vname').textContent();
  expect(original).toBe('TANNO #000000777');
  await expect(page.locator('#vspecies')).toHaveText('Bebi');
  await expect(page.locator('#vpalette')).toHaveText('void');
  await expect(page.locator('#veyes')).toHaveText('closed');
  await expect(page.locator('#vtemper')).toHaveText('gloomy');
  await expect(page.locator('#vrarity')).toContainText('MYTHIC');
  const portrait = await page.locator('#vcanvas').evaluate((canvas) => canvas.toDataURL());
  for (let i = 0; i < 5; i += 1) {
    await page.locator('#vgo').click();
    expect(await page.locator('#vcanvas').evaluate((canvas) => canvas.toDataURL())).toBe(portrait);
  }
  await page.locator('#vrand').click();
  await expect(page.locator('#vname')).not.toHaveText(original);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('#vcopy-id').click();
  await expect(page.locator('#vfeedback')).toContainText('ID COPIED');
  await page.locator('#vcopy-record').click();
  await expect(page.locator('#vfeedback')).toContainText('RECORD COPIED');
  await page.locator('#graveyard-search').fill('777');
  await page.locator('#graveyard-go').click();
  await expect(page.locator('#graveyard-results')).toContainText('AWAITING BIRTH');

  await registerWallet(page);
  await page.locator('#wallet-connect').click();
  await page.getByRole('button', { name: 'Phantom' }).click();
  await expect(page.locator('#wallet-state')).toContainText('WALLET VIEW LIMITED');
  expect(await page.evaluate(() => window.__mockSignCalls)).toBe(0);
  await page.locator('#wallet-disconnect').click();
  await expect(page.locator('#wallet-state')).toHaveText('NO CARETAKER CONNECTED');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await expect(page.locator('#vgo')).toBeVisible();
  await page.locator('#vid').fill('12321');
  await page.locator('#vgo').click();
  await expect(page.locator('#vname')).toHaveText('TANNO #000012321');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: path.join(qaDir, 'preview-mobile-top.png') });
  expect(errors).toEqual([]);
});

test('live mode reads real-shaped RPC data and burn requires two user actions', async ({ page }) => {
  test.setTimeout(90000);
  const errors = captureErrors(page);
  let rpcCalls = 0;
  await page.route('**/config/project.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    PROJECT_NAME: 'TANNO', TOKEN_SYMBOL: 'TANNO', TOKEN_MINT: 'So11111111111111111111111111111111111111112',
    NETWORK: 'mainnet-beta', RPC_ENDPOINT: 'http://127.0.0.1:4191/rpc', INDEXER_ENDPOINT: '',
    X_URL: 'https://x.com/tanno_token', SOLSCAN_URL: 'https://solscan.io', GENESIS_SUPPLY: '1000000000',
  }) }));
  await page.route('**/rpc', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' } });
    rpcCalls += 1;
    const request = route.request().postDataJSON();
    const result = {
      getTokenSupply: { value: { amount: '1000000000', decimals: 0, uiAmountString: '1000000000' } },
      getTokenAccountsByOwner: { value: [{ pubkey: '11111111111111111111111111111111', account: { owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', data: { parsed: { info: { owner: '11111111111111111111111111111111', tokenAmount: { amount: '12', decimals: 0 } } } } } }] },
      getLatestBlockhash: { value: { blockhash: '11111111111111111111111111111111', lastValidBlockHeight: 100 } },
      getSignatureStatuses: { value: [{ err: null, confirmationStatus: 'confirmed' }] },
    }[request.method];
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ jsonrpc: '2.0', id: request.id, result }) });
  });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await expect(page.locator('#site-status')).toHaveText('STATUS: LIVE');
  await expect(page.locator('#census-onchain')).toHaveText('1,000,000,000');
  await expect(page.locator('#ca')).toContainText('So11…1112');
  expect(await page.locator('#ca').getAttribute('role')).toBe('link');
  expect(rpcCalls).toBe(1);
  await registerWallet(page);
  await page.locator('#wallet-connect').click();
  await page.getByRole('button', { name: 'Phantom' }).click();
  await expect(page.locator('#village-balance')).toHaveText('12 TANNO');
  await expect(page.locator('#village-population')).toHaveText('NOT INDEXED');
  await expect(page.locator('#village-grid button')).toHaveCount(12);
  await expect(page.locator('#burn-review')).toBeEnabled();
  expect(await page.evaluate(() => window.__mockSignCalls)).toBe(0);
  await page.locator('#burn-review').click();
  await expect(page.locator('#burn-confirm')).toBeVisible();
  expect(await page.evaluate(() => window.__mockSignCalls)).toBe(0);
  await page.locator('#burn-submit').click();
  await expect(page.locator('#burn-status')).toContainText('BURNED', { timeout: 15000 });
  expect(await page.evaluate(() => window.__mockSignCalls)).toBe(1);
  await expect(page.locator('#burn-tx')).toBeVisible();
  await page.locator('#wallet-disconnect').click();
  await expect(page.locator('#burn-review')).toBeDisabled();
  expect(errors).toEqual([]);
});

test('RPC errors leave the archive readable', async ({ page }) => {
  const errors = captureErrors(page);
  await page.route('**/config/project.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ TOKEN_MINT: 'So11111111111111111111111111111111111111112', RPC_ENDPOINT: 'http://127.0.0.1:4191/rpc' }) }));
  await page.route('**/rpc', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'test outage' } }) }));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await expect(page.locator('#census-state')).toContainText('RPC UNAVAILABLE');
  await expect(page.locator('#diary')).toContainText('the math i do about myself');
  await page.locator('#vid').fill('777');
  await page.locator('#vgo').click();
  await expect(page.locator('#vname')).toHaveText('TANNO #000000777');
  expect(errors).toEqual([]);
});

