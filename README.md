# Cockpit Glass

A quiet light and dark theme with a frosted navigation rail, subtle controls and clear reading surfaces. It follows your accent color and works independently of Cockpit Dashboard. No plugins, remote fonts, images or network requests are required.

[中文说明](./README.zh-CN.md) · [Release guide](./docs/RELEASING.md) · [Interaction audit](./docs/AUDIT.md)

Version **1.3.0**, for app version **1.14.0+**. This is the first standalone project; the theme previously shipped as version 1.2.0 inside Cockpit Dashboard. Community submission is pending.

## Install manually

1. Create `themes/Cockpit Glass/` inside your vault's configuration directory (normally `.obsidian`).
2. Copy the root `manifest.json` and `theme.css` into that folder.
3. In **Settings → Appearance → Themes**, choose **Cockpit Glass**. No build step is needed.

On macOS, native window translucency is optional. Turn on **Translucent window** in Appearance if you want the desktop frosted shell. Notes, search palettes and dialogs retain solid reading surfaces. Windows, Linux, mobile, fullscreen and detached settings use solid surfaces; CSS cannot provide native desktop wallpaper blur on those platforms. Mobile and Windows/Linux hardware acceptance are still pending.

To uninstall, choose another theme and remove this theme's folder. The theme has no scripts, settings migration or stored user data.

## Interaction details

- Native tab overflow, stacked tabs, sidebar toggles and window drag regions retain the app's layout.
- File selection, keyboard focus, drag targets and rename states retain native feedback.
- Toolbar buttons respond to hover and press; keyboard focus is visible and touch targets are larger on mobile.
- Reduced motion disables theme transitions and scaling. Reduced transparency uses opaque surfaces. Forced colors retain focus and selected-tab outlines.
- Search, dialogs and sticky settings headings remain legible over a busy workspace.

Cockpit Dashboard's own cards and controls belong to the plugin, not this theme. That plugin is entirely optional. Its bundled theme installer may still offer an earlier offline snapshot; it will not overwrite a newer installed theme.

## Development

`theme.css` is both readable source and the release file. The repository is self-contained; do not edit the plugin's copy to develop this theme.

```sh
npm ci
npm test
```

For browser regression checks with a locally installed host stylesheet:

```sh
node scripts/extract-host-css.mjs /path/to/host.asar
npx playwright install chromium
npm run test:ui
```

The local host CSS and synthetic fixture screenshots stay in ignored `output/`. They are not community screenshots. See [the audit](./docs/AUDIT.md) for what was tested and what still needs real-device checks.

MIT License. Original copyright and attribution are preserved in [LICENSE](./LICENSE).
