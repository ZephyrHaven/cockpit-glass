import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { fixture, tabs, fixtureStyles, editor } from './fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hostPath = process.env.COCKPIT_HOST_CSS || path.join(root, 'output/host.css');
if (!fs.existsSync(hostPath)) throw new Error('Prepare local host CSS first: node scripts/extract-host-css.mjs /path/to/host.asar');
const host = fs.readFileSync(hostPath, 'utf8');
const theme = fs.readFileSync(process.env.COCKPIT_THEME_CSS || path.join(root, 'theme.css'), 'utf8');
const output = path.join(root, 'output/playwright');
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const cdp = await page.context().newCDPSession(page);
// Fixtures must never fetch remote assets, including resources in host CSS.
await page.route('**/*', route => route.abort());
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
const style = (selector, prop) => page.locator(selector).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
const opaque = value => /^rgb\(/.test(value) || /,\s*1\)$/.test(value);
const clear = value => value === 'rgba(0, 0, 0, 0)';
const alpha = value => /^rgb\(/.test(value) ? 1 : parseFloat(value.split(',').at(-1));
const backdropFor = mode => mode === 'light'
  ? 'linear-gradient(135deg, #b7bacd, #c3c7c4 45%, #a2b9bf)'
  : 'linear-gradient(135deg, #303341, #313b3d 45%, #20393f)';
async function settle() {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter(a => a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
  });
}
const classes = async value => page.locator('body').evaluate((el, v) => { el.className = v; }, value);
const glassContainers = ['body', '.app-container', '.horizontal-main-container', '.workspace', '.workspace-split.mod-root', '.mod-left-split', '.mod-right-split', '.nav-files-container', '.markdown-reading-view', '.markdown-preview-view'];
const composition = () => page.evaluate(selectors => selectors.map(selector => {
  const css = getComputedStyle(document.querySelector(selector));
  return Object.fromEntries(['transform', 'scale', 'filter', 'backdrop-filter', 'will-change', 'contain', 'isolation'].map(prop => [prop, css.getPropertyValue(prop)]));
}), glassContainers);
async function load(themeCss = theme) {
  await page.setContent(fixture());
  await page.addStyleTag({ content: host });
  await page.addStyleTag({ content: fixtureStyles });
  if (themeCss) await page.addStyleTag({ content: themeCss });
  await page.locator('#tabs').evaluate((el, html) => { el.innerHTML = html; }, tabs(3));
}
try {
  await load('');
  await classes('theme-light mod-macos is-translucent is-focused is-hidden-frameless is-frameless');
  const nativeComposition = await composition();
  await load();
  for (const mode of ['light', 'dark']) {
    await classes(`theme-${mode} mod-macos is-focused is-hidden-frameless is-frameless`);
    await settle();
    check(opaque(await style('.app-container', 'background-color')), `${mode}: opaque fallback shell`);
    check(opaque(await style('.markdown-preview-view', 'background-color')), `${mode}: opaque fallback note`);
    await page.screenshot({ path: path.join(output, `${mode}-fixture.png`) });
    await classes(`theme-${mode} mod-macos is-translucent is-focused is-hidden-frameless is-frameless`);
    check(JSON.stringify(await composition()) === JSON.stringify(nativeComposition), `${mode}: glass and scroll containers retain native composition properties`);
    check(await page.evaluate(() => document.getAnimations().every(a => a.effect.getComputedTiming().iterations !== Infinity)), `${mode}: no continuously animated background or control`);
    for (const selector of ['.view-content', '.markdown-reading-view', '.markdown-preview-view']) {
      check(clear(await style(selector, 'background-color')), `${mode}: ${selector} shares window glass`);
    }
    const reading = await page.locator('.mod-root .view-content').innerHTML();
    for (const live of [false, true]) {
      await page.locator('.mod-root .workspace-leaf-content').evaluate(el => el.classList.remove('is-read-mode'));
      await page.locator('.mod-root .view-content').evaluate((el, html) => { el.innerHTML = html; }, editor(live));
      for (const selector of ['.markdown-source-view', '.cm-editor', '.cm-scroller', '.cm-gutters']) {
        check(clear(await style(selector, 'background-color')), `${mode}: ${live ? 'live preview' : 'source'} ${selector} shares window glass`);
      }
      await page.locator('[aria-label="Note editor"]').fill('A new thought');
      check(await page.locator('.cm-content').textContent() === 'A new thought', `${mode}: editor remains editable`);
    }
    await page.locator('.mod-root .workspace-leaf-content').evaluate(el => el.classList.add('is-read-mode'));
    await page.locator('.mod-root .view-content').evaluate((el, html) => { el.innerHTML = html; }, reading);
    await page.locator('#right-dock').evaluate(el => { el.style.display = 'flex'; });
    for (const dock of ['.mod-left-split', '.mod-right-split']) {
      check(clear(await style(dock, 'background-color')) && await style(dock, 'background-image') === 'none', `${mode}: ${dock} has no independent surface or accent wash`);
    }
    check(await style('.mod-left-split', 'box-shadow') === 'none', `${mode}: sidebar does not double the seam with a shadow`);
    await page.mouse.move(640, 400);
    await settle();
    for (const side of ['left', 'right']) {
      const handle = `#${side}-divider`;
      const border = side === 'left' ? 'border-right-color' : 'border-left-color';
      check(alpha(await style(handle, border)) <= .015, `${mode}: ${side} resting divider is nearly invisible`);
      check(parseFloat(await style(handle, 'width')) >= 3 && await style(handle, 'cursor') === 'col-resize', `${mode}: ${side} resize target and cursor retained`);
      await page.locator(handle).hover();
      await settle();
      check(opaque(await style(handle, 'background-color')), `${mode}: ${side} divider visible on hover`);
      await page.locator(handle).evaluate(el => el.classList.add('is-active'));
      await page.mouse.move(640, 400);
      await settle();
      check(opaque(await style(handle, border)), `${mode}: ${side} active resize feedback retained`);
      await page.locator(handle).evaluate(el => el.classList.remove('is-active'));
    }
    if (mode === 'light') {
      check(alpha(await style('.mod-left-split', 'background-color')) <= .16, 'light: sidebar lets more native glass through');
      check(alpha(await style('.app-container', 'background-color')) <= .03, 'light: shell avoids a thick white veil');
    }
    // Synthetic light/dark backdrops show transparency, not native vibrancy.
    await page.addStyleTag({ content: `html { background: ${backdropFor(mode)}; }` });
    await settle();
    await page.screenshot({ path: path.join(output, `${mode}-glass-fixture.png`) });
    await page.locator('#right-dock').evaluate(el => { el.style.display = 'none'; });
    await page.locator('#dialog').evaluate(el => { el.style.display = 'flex'; });
    check(opaque(await style('#dialog .modal', 'background-color')), `${mode}: dialog opacity`);
    check(!['transparent', 'rgba(0, 0, 0, 0)'].includes(await style('#dialog .modal-bg', 'background-color')), `${mode}: modal backdrop retained`);
    await page.locator('#dialog').evaluate(el => { el.style.display = 'none'; });
    await page.locator('#settings').evaluate(el => { el.style.display = 'flex'; });
    check(opaque(await style('.setting-page-titlebar', 'background-color')), `${mode}: sticky heading opaque`);
    check((await style('#settings .modal', 'background-color')) === (await style('.setting-page-titlebar', 'background-color')), `${mode}: settings share the same tint`);
    await page.locator('.setting-page').evaluate(el => { el.scrollTop = 240; });
    const heading = await page.locator('.setting-page-titlebar').boundingBox();
    const pane = await page.locator('.setting-page').boundingBox();
    check(Math.abs(heading.y - pane.y) < 2, `${mode}: settings heading stays pinned on scroll`);
    await page.locator('#settings').evaluate(el => { el.style.display = 'none'; });
  }

  // Exercise long documents and an independently scrollable tree against the
  // host CSS. This checks browser behavior, not macOS native-window compositing.
  for (const mode of ['light', 'dark']) {
    await load();
    await classes(`theme-${mode} mod-macos is-translucent is-focused is-hidden-frameless is-frameless`);
    await page.addStyleTag({ content: `html { background: ${backdropFor(mode)}; }` });
    const preview = page.locator('.markdown-preview-view');
    const sizer = preview.locator('.markdown-preview-sizer');
    const fontSize = parseFloat(await style('.markdown-preview-view', 'font-size'));
    check(parseFloat(await style('.markdown-preview-view', 'line-height')) >= fontSize * 1.7, `${mode}: reading lines have room to breathe`);
    check((await sizer.boundingBox()).width <= 737, `${mode}: readable width limits long lines`);
    await preview.evaluate(el => el.classList.remove('is-readable-line-width'));
    check(await style('.markdown-preview-sizer', 'max-width') === 'none', `${mode}: native full-width reading preference remains available`);
    await preview.evaluate(el => el.classList.add('is-readable-line-width'));
    await sizer.evaluate(el => {
      for (let i = 0; i < 40; i++) {
        const p = document.createElement('p');
        p.textContent = `阅读记录 ${i + 1}：在完整的玻璃背景上阅读长文，滚动时内容应当连续、稳定。This synthetic paragraph exercises scrolling without private notes.`;
        el.append(p);
      }
    });
    const box = await preview.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 650);
    await page.waitForFunction(() => document.querySelector('.markdown-preview-view').scrollTop > 0, undefined, { timeout: 3000 });
    check(await preview.evaluate(el => el.scrollTop > 0), `${mode}: long reading preview responds to wheel scrolling`);
    await preview.evaluate(el => { el.scrollTop = 500; });
    await page.locator('[aria-label="Search files"]').fill('reading');
    for (let i = 0; i < 12; i++) {
      await page.locator('#folder').evaluate((el, active) => el.classList.toggle('has-focus', active), i % 2 === 0);
      await page.locator('#right-dock').evaluate((el, open) => { el.style.display = open ? 'flex' : 'none'; }, i % 2 === 0);
    }
    check(await preview.evaluate(el => Math.abs(el.scrollTop - 500) < 2), `${mode}: search and sidebar state changes preserve reading position`);
    await page.locator('.nav-folder.mod-root > .nav-folder-children').evaluate(el => {
      for (let i = 0; i < 80; i++) {
        const row = document.createElement('div');
        row.className = 'nav-file';
        row.innerHTML = `<div class="tree-item-self nav-file-title" tabindex="0"><div class="tree-item-inner">Synthetic note ${i + 1}</div></div>`;
        el.append(row);
      }
    });
    const tree = page.locator('.nav-files-container');
    const treeBox = await tree.boundingBox();
    await page.mouse.move(treeBox.x + treeBox.width / 2, treeBox.y + treeBox.height / 2);
    await page.mouse.wheel(0, 500);
    await page.waitForFunction(() => document.querySelector('.nav-files-container').scrollTop > 0, undefined, { timeout: 3000 });
    check(await tree.evaluate(el => el.scrollTop > 0), `${mode}: long file tree scrolls independently`);
    check(await preview.evaluate(el => Math.abs(el.scrollTop - 500) < 2), `${mode}: tree scrolling leaves the document in place`);
    await preview.evaluate(el => {
      el.scrollTop = 0;
      const range = document.createRange();
      range.selectNodeContents(el.querySelector('h1'));
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    });
    check(await page.evaluate(() => getSelection().toString()) === '留一点空间，安静地阅读', `${mode}: native text selection remains available`);
    await page.evaluate(() => getSelection().removeAllRanges());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.mod-left-split').evaluate(el => { el.style.display = 'none'; });
    check(await preview.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${mode}: narrow reading has no page-wide horizontal overflow`);
    check(await style('.markdown-preview-view pre', 'white-space') === 'pre-wrap', `${mode}: code retains native line wrapping`);
    await preview.locator('pre').evaluate(el => el.style.setProperty('--code-white-space', 'pre'));
    check(await preview.locator('pre').evaluate(el => el.scrollWidth > el.clientWidth), `${mode}: unwrapped code scrolls inside its own block`);
    await preview.locator('pre').evaluate(el => el.style.removeProperty('--code-white-space'));
    check(await preview.evaluate(el => el.scrollTop === 0), `${mode}: resizing keeps the reading origin stable`);
    await page.screenshot({ path: path.join(output, `${mode}-narrow-reading.png`) });
    await page.setViewportSize({ width: 1280, height: 800 });
  }

  for (const width of [240, 320, 480, 960]) {
    await classes('theme-light mod-macos is-focused is-hidden-frameless is-frameless');
    await page.locator('#tabs').evaluate((el, html) => { el.innerHTML = html; }, tabs(18));
    await page.locator('.workspace-split.mod-root').evaluate((el, w) => { el.style.flex = 'none'; el.style.width = `${w}px`; }, width);
    const bar = await page.locator('#bar').boundingBox();
    const buttons = await page.locator('#bar .clickable-icon').evaluateAll(els => els.map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, hit: el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) };
    }));
    check(buttons.every(b => b.w >= 24 && b.h >= 24 && b.x >= bar.x && b.x + b.w <= bar.x + bar.width + 1 && b.hit), `${width}px split: tab controls visible and clickable`);
    for (let i = 0; i < buttons.length; i++) for (let j = i + 1; j < buttons.length; j++) {
      check(buttons[i].x + buttons[i].w <= buttons[j].x + 1 || buttons[j].x + buttons[j].w <= buttons[i].x + 1, `${width}px split: controls don't overlap`);
    }
    check(await style('#bar', 'display') === 'flex', `${width}px split: native tab layout retained`);
  }

  await load();
  await classes('theme-dark mod-windows is-translucent is-focused');
  check(opaque(await style('.app-container', 'background-color')), 'Windows stale translucency flag still has opaque shell');
  await classes('theme-dark mod-linux is-translucent is-focused');
  check(opaque(await style('.app-container', 'background-color')), 'Linux stale translucency flag still has opaque shell');
  await classes('theme-dark mod-macos is-translucent is-fullscreen');
  check(opaque(await style('.app-container', 'background-color')), 'macOS fullscreen fallback');
  await classes('theme-light mod-macos is-translucent is-popout-modal');
  check(opaque(await style('body', 'background-color')), 'detached settings window fallback');

  await classes('theme-light mod-macos is-translucent is-focused');
  for (const state of ['is-selected', 'is-being-dragged', 'is-being-dragged-over', 'is-being-renamed', 'has-active-menu', 'has-focus']) {
    await page.locator('#folder').evaluate((el, s) => { el.className = `tree-item-self nav-folder-title ${s}`; }, state);
    check(await style('#folder', 'background-image') === 'none', `${state}: folder decoration does not cover native state`);
  }
  await page.locator('#folder').evaluate(el => { el.className = 'tree-item-self nav-folder-title'; });
  await classes('theme-light mod-rtl');
  await page.locator('#folder').hover();
  await settle();
  check((await style('#folder', 'background-position')).startsWith('100%'), 'RTL folder marker mirrored');

  await classes('theme-light mod-macos is-focused');
  await page.locator('[aria-label="Search files"]').focus();
  check(await style('[aria-label="Search files"]', 'border-top-color') === await style('body', '--interactive-accent').then(x => page.evaluate(v => { const el = document.createElement('div'); el.style.color = v; document.body.append(el); const c = getComputedStyle(el).color; el.remove(); return c; }, x)), 'search focus follows accent');
  await page.locator('[aria-label="New note"]').focus();
  check(await style('[aria-label="New note"]', 'outline-style') === 'solid', 'keyboard focus visible');
  await page.locator('[aria-label="Disabled action"]').hover();
  await page.mouse.down();
  check(await style('[aria-label="Disabled action"]', 'scale') === 'none', 'disabled action has no theme press scale');
  await page.mouse.up();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  check((await style('[aria-label="New note"]', 'transition-duration')).split(',').every(v => parseFloat(v) === 0), 'reduced motion stops theme transitions');
  await page.locator('[aria-label="New note"]').hover();
  await page.mouse.down();
  check(await style('[aria-label="New note"]', 'scale') === 'none', 'reduced motion stops press scale');
  await page.mouse.up();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
  check(await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches), 'browser supports reduced transparency emulation');
  await classes('theme-dark mod-macos is-translucent');
  await settle();
  check(opaque(await style('.app-container', 'background-color')), 'reduced transparency: workspace opaque');
  check(opaque(await style('.markdown-preview-view', 'background-color')), 'reduced transparency: note reading surface opaque');
  await page.locator('.mod-root .view-content').evaluate((el, html) => { el.innerHTML = html; }, editor(true));
  check(opaque(await style('.markdown-source-view', 'background-color')), 'reduced transparency: editor surface opaque');
  check(alpha(await style('#left-divider', 'border-right-color')) >= .14, 'reduced transparency: divider contrast restored');
  await page.locator('[aria-label="Search files"]').evaluate(async el => {
    await Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {})));
  });
  check(opaque(await style('[aria-label="Search files"]', 'background-color')), 'reduced transparency: search control opaque');
  await page.locator('#dialog').evaluate(el => { el.style.display = 'flex'; });
  check(opaque(await style('#dialog .modal', 'background-color')), 'reduced transparency: dialogs opaque');
  await page.locator('#dialog').evaluate(el => { el.style.display = 'none'; });
  await cdp.send('Emulation.setEmulatedMedia', { features: [] });
  await page.emulateMedia({ forcedColors: 'active' });
  await page.locator('[aria-label="New note"]').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  check(await style('[aria-label="New note"]', 'outline-style') === 'solid', 'forced colors: focus retained');

  await page.emulateMedia({ forcedColors: 'none' });
  await classes('theme-light is-mobile is-phone mod-ios');
  check(await style('#bar', 'display') === 'none', 'mobile: native hidden tab bar retained');
  check(parseFloat(await style('[aria-label="New note"]', 'min-width')) >= 40, 'mobile touch targets at least 40px');
  await classes('theme-light mod-macos');
  await page.locator('.mod-root > .workspace-tabs').evaluate(el => el.classList.add('mod-stacked'));
  const themedStack = await style('#tabs', 'padding');
  await load('');
  await classes('theme-light mod-macos');
  await page.locator('.mod-root > .workspace-tabs').evaluate(el => el.classList.add('mod-stacked'));
  check(themedStack === await style('#tabs', 'padding'), 'stacked tabs retain host spacing');
  console.log(`${checks} browser checks passed using local host CSS. Screenshots are synthetic fixtures, not store screenshots.`);
} finally {
  await browser.close();
}
