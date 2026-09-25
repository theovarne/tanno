import { getWallets } from '@wallet-standard/app';

const PRIORITY = ['phantom', 'solflare', 'backpack'];

export function discoverWallets(chain) {
  return getWallets().get()
    .filter((wallet) => wallet.features['standard:connect'] && wallet.chains.includes(chain))
    .sort((a, b) => {
      const ai = PRIORITY.indexOf(a.name.toLowerCase());
      const bi = PRIORITY.indexOf(b.name.toLowerCase());
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
}

export async function connectWallet(wallet, chain) {
  const result = await wallet.features['standard:connect'].connect();
  const account = result.accounts.find((candidate) => candidate.chains.includes(chain));
  if (!account) throw new Error('Wallet connected, but not to the configured Solana network.');
  return { wallet, account };
}

export async function disconnectWallet(connection) {
  const disconnect = connection?.wallet?.features['standard:disconnect']?.disconnect;
  if (disconnect) await disconnect();
}
