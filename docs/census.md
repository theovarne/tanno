# Census and heartbeat

The static engine spans IDs 1–1,000,000,000; that is not a live minted-supply counter. With a configured mint, on-chain mint supply comes from Solana RPC. Numbered alive/burned counts, caretakers, transfer activity and heartbeat observations require an external indexer. `lib/rpc.js` reads optional indexer endpoints but does not implement or certify the indexer.

The UI distinguishes configured, available, unavailable and not-indexed states. Decorative ASCII or archive prose is not measurement. `lib/time.cjs` formats observed timestamps with America/New_York daylight-saving behavior when records exist; absent observations should not acquire invented times.
