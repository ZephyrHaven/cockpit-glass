# Cockpit Glass

A standalone light and dark theme with one continuous frosted window, subtle controls and comfortable reading typography. It follows your accent color and needs no plugins, remote assets or network requests.

[中文说明](./README.zh-CN.md) · [Download](https://github.com/ZephyrHaven/cockpit-glass/releases/latest) · [Architecture](./docs/ARCHITECTURE.md) · [Audit](./docs/AUDIT.md)

Version **1.4.0**, for app version **1.14.0+**. The theme previously shipped as 1.2.0 inside Cockpit Dashboard. Community directory review is pending; GitHub releases can be installed manually.

## Screenshots

### Light mode

![Cockpit Glass in light mode](./screenshots/cockpit-glass-light.png)

### Dark mode

![Cockpit Glass in dark mode](./screenshots/cockpit-glass-dark.png)

Screenshots show the actual macOS interface before the 1.3.2 note-transparency and divider changes. The Cockpit tab and AI shortcut are provided by the optional Cockpit Dashboard plugin; the theme works independently.

## Install

Download the ZIP from [Releases](https://github.com/ZephyrHaven/cockpit-glass/releases/latest), then place its `Cockpit Glass` folder inside your vault configuration directory's `themes/` folder (normally `.obsidian/themes/`). Alternatively, copy the release's two individual files, `theme.css` and `manifest.json`, into `themes/Cockpit Glass/`.

Select **Cockpit Glass** in **Settings → Appearance → Themes**. No Node.js, build step or plugin is needed for end users.

On macOS, **Translucent window** is optional. Notes sit on a light reading mist over the native window glass in reading and editing modes, so text stays legible on any wallpaper (with the optional Style Settings plugin you can choose Clear glass or Solid instead). Dialogs, menus and search palettes retain solid surfaces. Pane dividers are quiet hairlines that strengthen on hover or drag. Other platforms, fullscreen and detached settings use solid fallbacks; CSS cannot provide native desktop wallpaper blur there. Windows/Linux and mobile visual acceptance are still pending. To uninstall, choose another theme and remove this theme's folder; no user data is stored by the theme.

## Features and options

- **Reading surface** (optional [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) plugin): **Settings → Style Settings → Cockpit Glass → Reading surface**. *Mist* (default) puts a half-opaque layer under top-level notes so text stays legible on any wallpaper; *Clear glass* shows the window glass directly; *Solid* is fully opaque. Without the plugin the theme uses Mist. When the system's *Reduce transparency* is on, notes are always solid.
- **Readable secondary text**: list markers, placeholders, unchecked checkboxes and other faint text reach about 5.7:1 contrast on solid surfaces and at least 3:1 on glass; muted text is 7:1 or higher.
- **Visible pane dividers**: resting dividers are quiet hairlines; hover and drag feedback is unchanged.
- **Consistent typography**: reading view, live preview and source mode share line width, line height and a full h1–h6 scale (h5/h6 use muted color).
- **Surfaces and components**: code blocks and table headers have their own surface; callouts, tags, properties, embeds, graph, canvas and PDF follow the theme's palette and radius.
- **Menus and tabs**: menus, the command palette, suggestions and hover previews share one floating style with an accent-tinted selection; root and sidebar tabs use the same active style.
- **Accessibility**: reduced transparency turns every glass layer solid; forced-colors mode keeps selection, focus and floating borders; on mobile, touch targets are 44px and inputs 16px to avoid iOS zoom.

## Maintain and deploy

This is a source project, with generated installation files:

```text
src/*.css → build.js → theme.css + dist/
                              ├── theme.css
                              ├── manifest.json
                              ├── Cockpit-Glass-1.4.0.zip
                              └── SHA256SUMS.txt
```

Edit the modules under `src/`; their cascade order is declared in `theme.config.json`. Root `theme.css` is generated and committed for the community directory. Never edit it directly. The project is self-contained and does not build from the plugin repository.

Requires Node.js 22+ and npm for development:

```sh
npm ci
npm test
npm run release:check
```

One-command deployment on macOS/Linux installs missing build dependencies, builds, validates, backs up the installed theme, then copies only the two runtime files:

```sh
bash deploy.sh --vault /path/to/vault
```

Use `--config-dir custom-config` for a vault with a different configuration directory. To reuse a local default, copy `deploy.local.example.json` to `deploy.local.json` and set `themeDir` to your theme folder; then run **`bash deploy.sh`** without arguments. The local file is ignored by Git. `COCKPIT_THEME_DIR` also works.

On Windows, run `npm ci` once, then `npm run deploy -- --vault C:/path/to/vault`; the Node deployment implementation is shared across platforms. Backups live under the installed theme's `.cockpit-backups/`. Existing newer themes, another theme's files and concurrent deployments are refused. Theme preferences and unrelated files are preserved. See [architecture](./docs/ARCHITECTURE.md) for recovery and locking details.

## Verify interactions

```sh
node scripts/extract-host-css.mjs /path/to/host.asar
npx playwright install chromium
npm run test:ui
```

Local host CSS and synthetic screenshots stay in ignored `output/`. They are not community-store screenshots. Tooling tests exercise backup, rollback, locks, external edits and release packaging; browser tests use a synthetic DOM with the local host stylesheet. Real-device acceptance is recorded separately in [the audit](./docs/AUDIT.md).

`npm run release:check` validates the GitHub release package. `npm run community:check` checks the screenshot selected by `communityScreenshot` in `theme.config.json`. The selected screenshot must also exist in the commit tagged for the release. See [publishing instructions](./docs/RELEASING.md).

## Support

[![Support Cockpit Glass on Afdian](./assets/afdian-badge.svg)](https://afdian.com/a/zephyrhaven)

If Cockpit Glass is useful to you, you can support its ongoing development and maintenance on [Afdian](https://afdian.com/a/zephyrhaven). Thank you for your support!

MIT License. Original attribution is preserved in [LICENSE](./LICENSE). Cockpit Dashboard remains optional; its bundled installer can retain its older offline snapshot without replacing a newer installed theme.
