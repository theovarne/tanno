# Build and deployment

Use Node.js 20 or newer. Run `npm ci`, `npm test`, `npm run build`, then serve `dist/` as a static root. `npm run preview` starts the local server on `127.0.0.1:4190` after a build. Browser checks can run with `npx playwright test tests --workers=1` while that server runs.

Vercel reads `vercel.json`: build command `npm run build`, output directory `dist`, and clean URLs. `scripts/build.cjs` **must remain in the repository**; this is not a buildless root-HTML deployment. `.vercelignore` excludes tests and generated/local material from upload but keeps the build script and its inputs. Set Vercel Root Directory to the repository root. No framework preset or serverless backend is required.

Production changes should come from reviewed commits on `main` once the Git repository is connected to the Vercel project. The domain and DNS are deployment settings, not build inputs; do not change DNS to repair a missing production deployment. Verify the generated site, assets and anchors before promoting a deployment. `config/project.json` intentionally ships to browsers, so never put credentials in it.
