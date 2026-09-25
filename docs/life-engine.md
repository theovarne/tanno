# Life engine and compatibility

The integer domain is **1 through 1,000,000,000**, inclusive. `lib/life-engine.cjs` rejects non-integers and out-of-range values. It wraps `assets/js/engine.js`, the deterministic Tamayura generator, and adds display fields. `ENGINE_VERSION` and each returned record's `engineVersion` are currently `1`.

`lifeEngine(id, specimenImages)` returns a frozen record: `id`, zero-padded `displayId`, `name`, `species`, `palette`, `eyes`, `body`, `temperament`, `rarity`, `trait`, `lifespanClass`, `legendaryId`, `imageIndex`, and `imageSrc`. Rarity and base traits come from the generator. The wrapper hashes `TANNO:<id>` with a 32-bit FNV-style loop to select body, trait and image pool index. `lifePixels(id)` returns generator pixels. No network call participates in these calculations.

The image index is `hashId(id) % specimenImages.length`; with an empty pool it is `null`. This means a given ID has a stable specimen image **for a fixed, ordered pool**, not across arbitrary additions, removals or reordering. The build sorts the local gallery filenames before embedding their manifest. Treat changes to the pool or its ordering as a visual compatibility event; freeze and version a pool before promising permanent image-to-ID assignments. The UI's image is not on-chain provenance.

Version 1 outputs are regression-tested at representative boundary, special, and ordinary IDs. Any algorithmic change that changes existing records must increment the version and document migration behavior. Never silently remap issued IDs.

## Example

```js
const { lifeEngine } = require('./lib/life-engine.cjs');
const record = lifeEngine(777);
// record.name === 'TANNO #000000777'
// record.engineVersion === 1
// record.rarity === 'MYTHIC'
```

## Derivation

The generator seeds a 32-bit mulberry32 stream with the validated ID multiplied by 2654435761 modulo 2³², plus a salt. Salt 12345 drives base traits and rarity; salt 99 drives pixel construction. Base arrays in `assets/js/engine.js` choose species, palette, temperament and eyes. IDs 1, 777, 1,000,000,000 and palindromes of length greater than two are MYTHIC; the remaining IDs use the seeded rarity roll. The wrapper derives body and trait with `hashId`; it does not call `Math.random()`. Lifespan is currently a design class, not a ticking clock.

```text
ID → strict normalize → seeded PRNG → base traits / rarity / pixels
                         └→ hashId → body / trait / specimen index
                                        ↓
                                frozen LifeRecord v1
```