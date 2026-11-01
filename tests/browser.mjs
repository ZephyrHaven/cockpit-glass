import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { fixture, tabs, fixtureStyles } from './fixture.mjs';

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
async function settle() {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter(a => a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
  });
}
const classes = async value => page.locator('body').evaluate((el, v) => { el.className = v; }, value);
async function load(themeCss = theme) {
  await page.setContent(fixture());
  await page.addStyleTag({ content: host });
  await page.addStyleTag({ content: fixtureStyles });
  if (themeCss) await page.addStyleTag({ content: themeCss });
  await page.locator('#tabs').evaluate((el, html) => { el.innerHTML = html; }, tabs(3));
}
try {
  await load();
  for (const mode of ['light', 'dark']) {
    await classes(`theme-${mode} mod-macos is-focused is-hidden-frameless is-frameless`);
    await settle();
    check(opaque(await style('.app-container', 'background-color')), `${mode}: opaque fallback shell`);
    await page.screenshot({ path: path.join(output, `${mode}-fixture.png`) });
    await classes(`theme-${mode} mod-macos is-translucent is-focused is-hidden-frameless is-frameless`);
    check(opaque(await style('.markdown-preview-view', 'background-color')), `${mode}: solid note reading surface`);
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
  check(opaque(await style('.app-container', 'background-color')), 'reduced transparency: workspace opaque');
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
