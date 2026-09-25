# Identity is not custody

TANNO proposes one billion numbered lives alongside a planned fungible Solana token supply. A life ID is an integer input to a deterministic local function; it is **not** an SPL token, NFT, wallet balance, or on-chain serial number. The same ID reproduces the same computed traits and pixels in version 1.

SPL tokens of the same mint are fungible. Reading a token account balance cannot reveal which numbered lives its holder owns. The current repository contains no final ID assignment or transfer-reconciliation policy. Accordingly the public UI can show locally computed specimens, but it cannot honestly claim numbered ownership, age or death without an independently specified and verifiable mapping/indexer. See [data model](data-model.md).

The number 1,000,000,000 is the engine's ID ceiling and a project supply plan, not evidence that a mint or on-chain supply exists. `config/project.json` currently has an empty `TOKEN_MINT`; the site is pre-launch.
