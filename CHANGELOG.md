# Changelog

## 1.4.0

- Readability: themed `--text-faint` and a full `--color-base-00…100` ramp. List markers, placeholders and unchecked checkboxes now reach 5.7:1 on the solid surface (was 2.1:1 light / 2.8:1 dark) and stay at or above 3:1 on glass; light `--text-muted` darkened to 7.2:1.
- Notes sit on a half-opaque reading mist so body text no longer depends on the wallpaper. Style Settings (optional) offers Mist, Clear glass or Solid; reduced transparency always uses a solid surface.
- Resting pane dividers are visible again (8% light / 7% dark) with hover and drag feedback unchanged.
- Reading, live preview and source mode share line width (40rem), line height and a complete h1–h6 scale; h5/h6 use muted color.
- Code blocks and table headers get their own surface; callouts, tags, properties, embeds, graph, canvas and PDF shadows follow the theme.
- Menus, command palette, suggestions and hover previews share one floating material (radius, hairline, lifted shadow, accent-tinted selection).
- Root and sidebar tabs use one active style; light glass strokes and tab tint recalibrated; dialog shadow uses a theme token.
- Reduced transparency now turns shell, haze, title bar, edges and highlights solid; forced colors cover selected items, search focus and floating borders; mobile targets are 44px and mobile inputs 16px.

## 1.3.3

- Sidebars share the window glass without a separate accent wash or panel fill; resting divider lines are quieter.
- File-tree hierarchy uses lighter type and tighter spacing, with simpler toolbars and stable, short interaction feedback.
- Reading mode has a comfortable line length, more generous line spacing, clearer headings, and refined lists, quotes, code blocks and tables.
- Background lighting stays static: no continuous animation, extra blur, transformed scroll containers or new compositing hints are added.

## 1.3.2

- Notes share the native translucent window in reading, live preview and source mode.
- Light mode uses a thinner shell and sidebar tint to reveal more native glass.
- Resting pane dividers are softer in both modes, with native resize targets and interaction feedback retained.
- Solid platform fallbacks, dialogs and reduced-transparency surfaces remain available.

## 1.3.1

- Include light and dark screenshots in the released revision so the community scanner can resolve the selected screenshot.
- Validate the configured listing screenshot before release and document the release-tag requirement.
- Add Afdian support links to both READMEs.

## 1.3.0

- Cockpit Glass is now a standalone light and dark theme that works without Cockpit Dashboard.
- Modular CSS sources, deterministic release packaging, one-command deployment with backups and rollback, and cross-platform tooling CI support ongoing maintenance.
- Narrow split panes retain usable tab and sidebar controls by following the native tab layout.
- Dialogs and notes use solid reading surfaces, with the native modal backdrop retained.
- Native translucency is limited to supported macOS windows, with solid fallbacks elsewhere.
- Reduced transparency covers controls and dialogs; mobile touch targets and forced-color focus feedback are improved.
- File-tree decoration respects interaction states and right-to-left layouts.

## 1.2.0

Bundled in Cockpit Dashboard; original extraction baseline.
