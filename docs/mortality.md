# Mortality and the Graveyard

The archive's mortality language is part of its narrative. Computed `lifespanClass` is design metadata, **not a running death timer**. The current repository does not automatically expire lives.

A wallet-signed SPL token burn removes a fungible token amount if confirmed on-chain. It does not, by itself, prove which Life ID is dead. Numbered headstones require a public assignment rule and a trusted indexer that verifies the burn signature and reconciles numbered custody. The browser checks indexer responses against the configured mint; this is an input guard, not independent chain verification. Without that infrastructure, the Graveyard must remain unavailable or unindexed, not invent deaths.
