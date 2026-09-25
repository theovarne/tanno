# Specimen system

The Summon panel takes a Life ID and calls the local engine. `assets/images/sevra/gallery/` is the current specimen image pool. At build time, `scripts/build.cjs` discovers supported local images, sorts them, generates `data/sevra-gallery.json` in `dist/`, and embeds that ordered list in the page. The Life ID hash selects one image deterministically. Summoning the same ID does not advance a carousel; summoning another ID may select a different image. The image fits inside the existing small portrait frame and does not alter the attribute table.

Specimen pictures are visual assets. The record's traits are computed from code, not recognized from pixels. A changed gallery membership/order may change visual assignment even when traits stay stable. Tests check deterministic mapping for a fixed gallery. The hero and favicon use the amber ghost assets, independently of the specimen pool.
