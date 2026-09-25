# Data model and indexer boundary

Local `lifeEngine` records are deterministic identity views, not an ownership ledger. `data/diary.json` is trusted editorial HTML; only maintainers should edit `bodyHtml`. `data/legendary.json` is static project data. `config/project.json` is public environment configuration.

The optional indexer base URL is configured in `INDEXER_ENDPOINT`. The browser expects every indexer response to include the configured `mint` and rejects mismatches. Expected read endpoints:

| Path | Fields used by the UI |
| --- | --- |
| `/census` | `mint`, `circulating`, `alive`, `burned`, `caretakers`, `transfers24h`, `observedAt`, optional `activity` |
| `/wallet/:address` | `mint`, `wallet`, bounded representative `ids`, `population` |
| `/life/:id` | `mint`, `status`, `caretaker`, `ageDays`, `burnTx` |
| `/graveyard?limit=20` | `mint`, `records` of `id` and `signature` |
| `/legendary` | `mint`, keyed `records` |

This contract does not define a full chain-to-ID reconciliation algorithm. The external service must independently verify chain events and publish assignment, transfers, burns, reorg handling and data correction rules before the UI can make numbered custody/death claims. `burnTx` is required for a numbered death display. Do not use these endpoints as evidence merely because a URL returns JSON.

## Local LifeRecord v1

The real `lifeEngine(id, specimenImages)` return value is frozen and has this shape (strings are the current generator's labels, not a normalized external schema):

```ts
type LifeRecord = {
  engineVersion: 1;
  id: number;
  displayId: string;
  name: string;
  species: string;
  palette: string;
  eyes: string;
  body: string;
  temperament: string;
  rarity: string;
  trait: string;
  lifespanClass: string;
  legendaryId: boolean;
  imageIndex: number | null;
  imageSrc: string | null;
};
```

There is no exposed `seed` field and no persisted custody field in this object. An image index is relative to the ordered pool supplied to the function.