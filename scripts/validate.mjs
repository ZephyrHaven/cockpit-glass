import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'lightningcss';
import { unzipSync } from 'fflate';
import { buildTheme, PROJECT_ROOT, digest } from '../build.js';

export function validateProject({ root = PROJECT_ROOT, release = false, community = false } = {}) {
  const read = name => fs.readFileSync(path.join(root, name), 'utf8');
  const { manifest, source, files, archiveName } = buildTheme({ root, check: true });
  for (const key of ['name', 'author', 'version', 'minAppVersion']) {
    assert.equal(typeof manifest[key], 'string', `Missing manifest field: ${key}`);
    assert.ok(manifest[key].trim());
  }
  assert.match(manifest.minAppVersion, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.name, 'Cockpit Glass');
  assert.equal(JSON.parse(read('package.json')).version, manifest.version);
  assert.equal(JSON.parse(read('versions.json'))[manifest.version], manifest.minAppVersion);
  const css = read('theme.css');
  const parsed = transform({ filename: 'theme.css', code: Buffer.from(css), errorRecovery: false });
  assert.equal(parsed.warnings.length, 0, JSON.stringify(parsed.warnings));
  for (const content of [source, css]) {
    assert.doesNotMatch(content, /@import\b|url\s*\(\s*['"]?(?:https?:|\/\/)/i, 'Theme must work offline');
    assert.doesNotMatch(content, /!important\b/i, 'Allow user snippets to override the theme');
    assert.doesNotMatch(content, /(?:-webkit-)?backdrop-filter\s*:/i, 'Do not add persistent pane blur');
    assert.doesNotMatch(content, /cockpit-dashboard-root|--ck-|__COCKPIT_GLASS_BUNDLE__/, 'Theme must not depend on the plugin');
  }
  for (const name of ['README.md', 'README.zh-CN.md', 'LICENSE', 'docs/RELEASING.md']) assert.ok(read(name).trim());
  if (release || community) {
    assert.ok(read(`releases/${manifest.version}.md`).trim(), 'Release notes are missing');
    const archive = unzipSync(files[archiveName]);
    assert.deepEqual(Object.keys(archive).sort(), ['Cockpit Glass/manifest.json', 'Cockpit Glass/theme.css']);
    for (const name of ['theme.css', 'manifest.json']) assert.ok(Buffer.from(archive[`Cockpit Glass/${name}`]).equals(files[name]));
    for (const line of files['SHA256SUMS.txt'].toString().trim().split('\n')) {
      const [sha, name] = line.split('  ');
      assert.equal(digest(fs.readFileSync(path.join(root, 'dist', name))), sha, `Checksum mismatch: ${name}`);
    }
    const screenshotPath = JSON.parse(read('theme.config.json')).communityScreenshot;
    assert.equal(typeof screenshotPath, 'string', 'Configure communityScreenshot in theme.config.json');
    assert.match(screenshotPath, /^screenshots\/[a-z0-9-]+\.png$/, 'Use a PNG file inside screenshots/');
    const screenshot = path.join(root, screenshotPath);
    if (!fs.existsSync(screenshot)) throw new Error(`Community screenshot is missing: ${screenshotPath}. Commit it before tagging a release.`);
    const png = fs.readFileSync(screenshot);
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.ok(png.readUInt32BE(16) >= 512 && png.readUInt32BE(20) >= 288);
  }
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const manifest = validateProject({ release: process.argv.includes('--release'), community: process.argv.includes('--community') });
    console.log(`Cockpit Glass ${manifest.version}: source, generated artifacts, manifest and offline checks passed.`);
  } catch (error) {
    console.error(`Validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
