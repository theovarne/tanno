# Solana integration

`config/project.json` is browser-visible configuration. Today `TOKEN_MINT` is empty and the site is **PRE-LAUNCH**. No contract address or live supply is asserted. Once a real, validated Base58 mint is deliberately configured, browser RPC can read mint supply and token account balances. `lib/config.cjs` validates launch inputs; `lib/rpc.js` performs bounded JSON-RPC requests. The RPC endpoint must support HTTPS and browser CORS, and must not embed a secret API key.

Wallet Standard discovery lives in `lib/wallet.js`. Connecting exposes a public wallet address; it does not authorize a transaction. The burn client in `assets/js/burn.js` prepares an SPL Token `BurnChecked` instruction only after checking mint, token account ownership, program, balance and amount. The user reviews and confirms in the UI and their wallet must sign. This is a token burn, not a transfer or approval. Transaction submission is not called confirmed until RPC confirms it. A confirmed token burn alone does **not** identify a numbered life that died.

The optional indexer is external to this repo. Before launch, publish the assignment and reconciliation rules, verify indexer mint and source chain, and test with a real compatible wallet on an appropriate test mint. Automated wallet/RPC mocks do not constitute an audit or production-chain validation. Never commit private keys, seed phrases, RPC secrets or `.env` files.

## Data boundaries

| Category | Examples | Current status |
| --- | --- | --- |
| On-chain, once a real mint is configured | mint supply, wallet token balance, a confirmed burn transaction | Client code present; no active mint in config |
| Locally derived | Life ID record, traits, rarity, pixels, specimen selection | Active without chain access |
| Editorial archive | Diary, glossary, annotations | Static source content |
| Indexer-derived | numbered custody, death/headstones, caretakers, transfer activity | Optional external service; not configured |

A generic SPL transfer is a custody change in token balances, not proof of which Life ID moved. The network label `mainnet-beta` in config selects an RPC cluster; it is not evidence of a deployed TANNO mint.