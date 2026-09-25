# Compatibility policy

Engine v1 is the current deterministic computation. The shipped `ENGINE_VERSION` value and record field are `1`. Changes to generator seed derivation, pseudo-random sequence, trait tables, rarity resolution, pixel rendering or wrapper hashing can change public identities and require an explicit version increment, fixtures, and migration notes.

The current gallery is discovered and sorted at build time; there is no separately frozen specimen-pool version in code. For a fixed ordered pool, ID-to-image mapping is deterministic. Adding, deleting or renaming a gallery file may remap images. Before treating image assignment as permanent archival data, snapshot the ordered pool, give it a version, and retain prior assets or a manifest for recomputation. Do not promise an immutable image mapping beyond the fixed pool that exists today.

Regression fixtures should cover the lower and upper ID bounds, special IDs such as 777 and 12321, and ordinary IDs such as 404217746. `Math.random()` must not enter identity calculation. Browser UI randomness may choose a new ID for `SUMMON RANDOM`, but the selected ID then resolves deterministically.
