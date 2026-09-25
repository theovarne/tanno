const test = require('node:test');
const assert = require('node:assert/strict');
const { isSolanaAddress, resolveConfig, explorerUrl } = require('../lib/config.cjs');

const mainnet = 'So11111111111111111111111111111111111111112';

test('empty mint is pre-launch; one valid mint enables live mode', () => {
  assert.equal(resolveConfig({ TOKEN_MINT: '' }).mode, 'PRE-LAUNCH');
  assert.equal(resolveConfig({ TOKEN_MINT: mainnet }).mode, 'LIVE');
  assert.equal(isSolanaAddress(mainnet), true);
  assert.equal(isSolanaAddress('soon'), false);
  assert.throws(() => resolveConfig({ TOKEN_MINT: 'soon' }), /TOKEN_MINT/);
});

test('explorer URLs derive from the configured mint and network', () => {
  const config = resolveConfig({ TOKEN_MINT: mainnet, NETWORK: 'devnet' });
  assert.equal(explorerUrl(config, 'token', config.tokenMint), `https://solscan.io/token/${mainnet}?cluster=devnet`);
});
