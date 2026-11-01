# Cockpit Glass engineering notes

This is an independent CSS theme, not a runtime plugin. It must work without Cockpit Dashboard or any other plugin. Read `docs/ARCHITECTURE.md` before changing the build/deploy boundary.

- Maintain styles in `src/*.css`, with order declared in `theme.config.json`. Do not hand-edit generated root `theme.css` or ignored `dist/`.
- Root `theme.css` is committed for the community directory. After editing source, run `npm test` to build and validate it. Commit the generated root stylesheet alongside source changes.
- Keep `manifest.json`, `package.json` and `versions.json` aligned. Add user-facing notes to `releases/<version>.md`.
- Run `npm test`, `npm run build:check`, `npm run release:check`. Run `npm run test:ui` when styles change and local host CSS / Chromium are available; otherwise state this limitation explicitly.
- If build output changes, deploy with `bash deploy.sh` when a local target is configured, unless asked for build-only. Never add personal paths or `deploy.local.json` to Git.
- Deployment must preserve unrelated data and theme preferences. Keep backup, rollback, lock and external-edit tests passing.
- Do not introduce remote assets, runtime scripts, constant backdrop filters or `!important`. Respect native selection, drag, rename, focus, stacked tabs and accessibility preferences.
- GitHub Releases contain `dist/theme.css`, `dist/manifest.json`, the versioned ZIP and checksums. Community submission is a separate action and needs a real-app demo screenshot.
- Public docs and screenshots must use synthetic content. Do not publish local host CSS or user vault content.
