import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'lightningcss';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const manifest = JSON.parse(read('manifest.json'));
for (const key of ['name', 'author', 'version', 'minAppVersion']) {
  assert.equal(typeof manifest[key], 'string', `Missing manifest field: ${key}`);
  assert.ok(manifest[key].trim());
}
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.match(manifest.minAppVersion, /^\d+\.\d+\.\d+$/);
assert.equal(manifest.name, 'Cockpit Glass');
assert.equal(JSON.parse(read('package.json')).version, manifest.version);
assert.equal(JSON.parse(read('versions.json'))[manifest.version], manifest.minAppVersion);
const css = read('theme.css');
const parsed = transform({ filename: 'theme.css', code: Buffer.from(css), errorRecovery: false });
assert.equal(parsed.warnings.length, 0, JSON.stringify(parsed.warnings));
assert.doesNotMatch(css, /@import\b|url\s*\(\s*['"]?(?:https?:|\/\/)/i, 'Theme must work offline');
assert.doesNotMatch(css, /!important\b/i, 'Allow user snippets to override the theme');
assert.doesNotMatch(css, /(?:-webkit-)?backdrop-filter\s*:/i, 'Do not add persistent pane blur');
assert.doesNotMatch(css, /cockpit-dashboard-root|--ck-|__COCKPIT_GLASS_BUNDLE__/, 'Theme must not depend on the plugin');
for (const name of ['README.md', 'README.zh-CN.md', 'LICENSE', 'docs/RELEASING.md']) assert.ok(read(name).trim());

if (process.argv.includes('--release')) {
  // A browser fixture image is not a store screenshot. This asset must be captured
  // in a clean real app vault after visual acceptance (see docs/RELEASING.md).
  const screenshot = path.join(root, 'screenshots/store.png');
  if (!fs.existsSync(screenshot)) {
    console.error('Release check pending: add a real-app demo screenshot at screenshots/store.png (see docs/RELEASING.md).');
    process.exit(1);
  }
  const png = fs.readFileSync(screenshot);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.ok(png.readUInt32BE(16) >= 512 && png.readUInt32BE(20) >= 288);
}
console.log(`Cockpit Glass ${manifest.version}: manifest, CSS syntax, offline assets and standalone checks passed.`);
