const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function decodeBase58(value) {
  if (typeof value !== 'string' || !value) return null;
  let number = 0n;
  for (const char of value) {
    const digit = BASE58.indexOf(char);
    if (digit < 0) return null;
    number = number * 58n + BigInt(digit);
  }
  const bytes = [];
  while (number > 0n) {
    bytes.unshift(Number(number & 255n));
    number >>= 8n;
  }
  for (const char of value) {
    if (char !== '1') break;
    bytes.unshift(0);
  }
  return bytes;
}
function isSolanaAddress(value) {
  const bytes = decodeBase58(value);
  return Array.isArray(bytes) && bytes.length === 32;
}

function resolveConfig(raw) {
  const tokenMint = String(raw?.TOKEN_MINT || '').trim();
  if (tokenMint && !isSolanaAddress(tokenMint)) throw new Error('TOKEN_MINT is not a valid Solana public key.');
  const network = raw?.NETWORK || 'mainnet-beta';
  if (!['mainnet-beta', 'devnet', 'testnet'].includes(network)) throw new Error('NETWORK must be mainnet-beta, devnet, or testnet.');
  const rpcEndpoint = new URL(raw?.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com');
  if (rpcEndpoint.protocol !== 'https:' && rpcEndpoint.hostname !== 'localhost' && rpcEndpoint.hostname !== '127.0.0.1') {
    throw new Error('RPC_ENDPOINT must use HTTPS.');
  }
  const indexerEndpoint = raw?.INDEXER_ENDPOINT ? new URL(raw.INDEXER_ENDPOINT).toString().replace(/\/$/, '') : '';
  return Object.freeze({
    projectName: String(raw?.PROJECT_NAME || 'TANNO'),
    tokenSymbol: String(raw?.TOKEN_SYMBOL || 'TBA'),
    tokenMint,
    network,
    chain: network === 'mainnet-beta' ? 'solana:mainnet' : `solana:${network}`,
    rpcEndpoint: rpcEndpoint.toString(),
    indexerEndpoint,
    xUrl: String(raw?.X_URL || 'https://x.com/tanno_token'),
    solscanUrl: String(raw?.SOLSCAN_URL || 'https://solscan.io').replace(/\/$/, ''),
    genesisSupply: String(raw?.GENESIS_SUPPLY || '1000000000'),
    mode: tokenMint ? 'LIVE' : 'PRE-LAUNCH',
  });
}

function explorerUrl(config, type, value) {
  if (!['token', 'tx', 'account'].includes(type)) throw new Error('Invalid explorer type');
  const suffix = config.network === 'mainnet-beta' ? '' : `?cluster=${encodeURIComponent(config.network)}`;
  return `${config.solscanUrl}/${type}/${encodeURIComponent(value)}${suffix}`;
}

module.exports = { decodeBase58, isSolanaAddress, resolveConfig, explorerUrl };


