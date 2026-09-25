export class RpcClient {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.cache = new Map();
    this.requests = 0;
  }

  async call(method, params = [], maxAgeMs = 0) {
    const key = JSON.stringify([method, params]);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < maxAgeMs) return cached.value;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      this.requests += 1;
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: this.requests, method, params }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
      const payload = await response.json();
      if (payload.error) throw new Error(`RPC ${payload.error.code}: ${payload.error.message}`);
      this.cache.set(key, { at: Date.now(), value: payload.result });
      return payload.result;
    } finally {
      clearTimeout(timeout);
    }
  }

  clear(method) {
    for (const key of this.cache.keys()) if (key.startsWith(`["${method}"`)) this.cache.delete(key);
  }

  tokenSupply(mint) {
    return this.call('getTokenSupply', [mint, { commitment: 'confirmed' }], 45000);
  }

  tokenAccounts(owner, mint) {
    return this.call('getTokenAccountsByOwner', [owner, { mint }, { encoding: 'jsonParsed', commitment: 'confirmed' }]);
  }

  latestBlockhash() {
    return this.call('getLatestBlockhash', [{ commitment: 'confirmed' }]);
  }

  signatureStatus(signature) {
    return this.call('getSignatureStatuses', [[signature], { searchTransactionHistory: true }]);
  }
}

export async function indexerGet(config, path, signal) {
  if (!config.indexerEndpoint) return null;
  const url = `${config.indexerEndpoint}${path}`;
  const response = await fetch(url, { signal, headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Indexer HTTP ${response.status}`);
  const data = await response.json();
  if (data.mint !== config.tokenMint) throw new Error('Indexer mint does not match project config');
  return data;
}
