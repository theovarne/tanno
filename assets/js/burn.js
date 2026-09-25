import { PublicKey, Transaction } from '@solana/web3.js';
import { createBurnCheckedInstruction, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(input) {
  let number = 0n;
  for (const byte of input) number = number * 256n + BigInt(byte);
  let encoded = '';
  while (number > 0n) {
    encoded = ALPHABET[Number(number % 58n)] + encoded;
    number /= 58n;
  }
  for (const byte of input) {
    if (byte !== 0) break;
    encoded = '1' + encoded;
  }
  return encoded;
}
export async function burnOneOrMore({ config, rpc, connection, tokenAccounts, decimals, amount }) {
  if (config.mode !== 'LIVE' || !connection?.account) throw new Error('Live mint and connected wallet required.');
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000) throw new Error('Choose a whole token amount from 1 to 1,000,000.');
  if (!Number.isSafeInteger(decimals) || decimals < 0 || decimals > 18) throw new Error('Mint decimals are unavailable.');
  const signer = connection.wallet.features['solana:signAndSendTransaction'];
  if (!signer || !connection.account.features.includes('solana:signAndSendTransaction')) {
    throw new Error('This wallet does not support a visible Solana transaction.');
  }
  if (!connection.account.chains.includes(config.chain)) throw new Error('Wallet is on a different Solana network.');
  const rawAmount = BigInt(amount) * (10n ** BigInt(decimals));
  const current = await rpc.tokenAccounts(connection.account.address, config.tokenMint);
  const source = current.value.find((item) => {
    const raw = item.account?.data?.parsed?.info?.tokenAmount?.amount;
    const owner = item.account?.data?.parsed?.info?.owner;
    return owner === connection.account.address && raw && BigInt(raw) >= rawAmount;
  });
  if (!source) throw new Error('No token account holds this many TANNO tokens.');
  const program = new PublicKey(source.account.owner);
  if (!program.equals(TOKEN_PROGRAM_ID) && !program.equals(TOKEN_2022_PROGRAM_ID)) {
    throw new Error('Token account uses an unsupported program.');
  }
  const mint = new PublicKey(config.tokenMint);
  const owner = new PublicKey(connection.account.address);
  const tokenAccount = new PublicKey(source.pubkey);
  const latest = await rpc.latestBlockhash();
  const transaction = new Transaction({ feePayer: owner, recentBlockhash: latest.value.blockhash });
  transaction.add(createBurnCheckedInstruction(tokenAccount, mint, owner, rawAmount, decimals, [], program));
  const bytes = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
  const outputs = await signer.signAndSendTransaction({ transaction: bytes, account: connection.account, chain: config.chain });
  const signatureBytes = outputs?.[0]?.signature;
  if (!signatureBytes || signatureBytes.length !== 64) throw new Error('Wallet did not return a transaction signature.');
  const signature = encodeBase58(signatureBytes);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    let result;
    try { result = await rpc.signatureStatus(signature); }
    catch { return { signature, confirmed: false, amount }; }
    const status = result?.value?.[0];
    if (status?.err) throw new Error(`Transaction failed on Solana: ${JSON.stringify(status.err)}`);
    if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
      return { signature, confirmed: true, amount };
    }
  }
  return { signature, confirmed: false, amount };
}


