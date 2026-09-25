# Contributing

Use Node.js 20 or newer. Run `npm ci`, `npm test`, and `npm run build` before opening a pull request. To inspect the site, run `npm run preview` after build, then run the Playwright specs. Keep changes within the existing static HTML/CSS/JS architecture unless a different architecture solves a demonstrated problem.

Create a short topic branch (for example `feat/identity-test` or `fix/archive-anchor`). Keep pull requests focused. Explain the user-facing behavior and how it was verified. Update the relevant documentation with any change to data fields, launch configuration, image pool, RPC/indexer assumptions or deployment requirements.

Treat `lifeEngine` output as a compatibility contract. State explicitly whether a change alters any existing ID's traits, rarity, pixels or specimen mapping. If yes, propose a versioned migration and regression fixtures; never silently rewrite public identities. Do not introduce unverified on-chain claims, secrets, generated build output or large unrelated visual redesigns.

This repository currently has no license file. A public repository is not automatically an open-source license; obtain a project licensing decision before reusing code or assets outside permitted contribution/review workflows.
