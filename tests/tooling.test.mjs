import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';
import { buildTheme, compileTheme, PROJECT_ROOT } from '../build.js';
import { deployTheme } from '../scripts/deploy-core.mjs';
import { validateProject } from '../scripts/validate.mjs';

const artifact = compileTheme();
async function sandbox(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cockpit-glass-tooling-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const distDir = path.join(root, 'source', 'dist');
  const targetDir = path.join(root, 'vault', '.config', 'themes', 'Cockpit Glass');
  await fs.mkdir(distDir, { recursive: true });
  for (const file of ['theme.css', 'manifest.json']) await fs.writeFile(path.join(distDir, file), artifact.files[file]);
  return { root, distDir, targetDir };
}
async function previous(target, manifest = { name: 'Cockpit Glass', version: '1.2.0' }) {
  await fs.mkdir(target, { recursive: true });
  await fs.writeFile(path.join(target, 'manifest.json'), JSON.stringify(manifest));
  await fs.writeFile(path.join(target, 'theme.css'), '/* custom previous theme */');
}

test('build is deterministic; ZIP contains only matching installable files', () => {
  const repeat = compileTheme();
  assert.deepEqual(repeat.files, artifact.files);
  const archive = unzipSync(artifact.files[artifact.archiveName]);
  assert.deepEqual(Object.keys(archive).sort(), ['Cockpit Glass/manifest.json', 'Cockpit Glass/theme.css']);
  for (const name of ['theme.css', 'manifest.json']) assert.deepEqual(Buffer.from(archive[`Cockpit Glass/${name}`]), artifact.files[name]);
});

test('deploy installs into a new theme directory', async t => {
  const options = await sandbox(t);
  const result = await deployTheme(options);
  assert.equal(result.changed, true);
  assert.equal(result.backup, null);
  for (const name of ['theme.css', 'manifest.json']) assert.deepEqual(await fs.readFile(path.join(options.targetDir, name)), artifact.files[name]);
  await assert.rejects(fs.stat(`${options.targetDir}.deploy-lock`), { code: 'ENOENT' });
});

test('deploy backs up old files and preserves unrelated data', async t => {
  const options = await sandbox(t);
  await previous(options.targetDir);
  await fs.writeFile(path.join(options.targetDir, 'data.json'), '{"keep":true}');
  const result = await deployTheme(options);
  assert.equal(await fs.readFile(path.join(result.backup, 'theme.css'), 'utf8'), '/* custom previous theme */');
  assert.equal(JSON.parse(await fs.readFile(path.join(result.backup, 'manifest.json'))).version, '1.2.0');
  assert.equal(await fs.readFile(path.join(options.targetDir, 'data.json'), 'utf8'), '{"keep":true}');
  assert.equal((await fs.readdir(options.targetDir)).some(name => name.endsWith('.tmp')), false);
});

test('repeated identical deployment does not create backup churn', async t => {
  const options = await sandbox(t);
  await deployTheme(options);
  const result = await deployTheme(options);
  assert.equal(result.changed, false);
  await assert.rejects(fs.stat(path.join(options.targetDir, '.cockpit-backups')), { code: 'ENOENT' });
});

test('deploy refuses a different theme or a newer installed version', async t => {
  const options = await sandbox(t);
  for (const manifest of [{ name: 'Another Theme', version: '1.0.0' }, { name: 'Cockpit Glass', version: '99.0.0' }]) {
    await previous(options.targetDir, manifest);
    await assert.rejects(deployTheme(options), /another theme|newer than/);
    assert.equal(await fs.readFile(path.join(options.targetDir, 'theme.css'), 'utf8'), '/* custom previous theme */');
  }
});

test('deploy lock prevents simultaneous writes', async t => {
  const options = await sandbox(t);
  await fs.mkdir(`${options.targetDir}.deploy-lock`, { recursive: true });
  await assert.rejects(deployTheme(options), /Another deployment/);
});

test('second-file commit failure restores original theme', async t => {
  const options = await sandbox(t);
  await previous(options.targetDir);
  let injected = false;
  const io = { ...fs, rename: async (from, to) => {
    if (!injected && to === path.join(options.targetDir, 'manifest.json')) {
      injected = true;
      throw new Error('simulated file failure');
    }
    return fs.rename(from, to);
  } };
  await assert.rejects(deployTheme(options, io), /previous theme restored/);
  assert.equal(await fs.readFile(path.join(options.targetDir, 'theme.css'), 'utf8'), '/* custom previous theme */');
  assert.equal(JSON.parse(await fs.readFile(path.join(options.targetDir, 'manifest.json'))).version, '1.2.0');
});

test('external changes during staging are preserved', async t => {
  const options = await sandbox(t);
  await previous(options.targetDir);
  let staged = 0;
  const io = { ...fs, writeFile: async (file, ...args) => {
    await fs.writeFile(file, ...args);
    if (path.basename(file).endsWith('.tmp') && ++staged === 2) await fs.writeFile(path.join(options.targetDir, 'theme.css'), '/* external edit */');
  } };
  await assert.rejects(deployTheme(options, io), /changed during deployment/);
  assert.equal(await fs.readFile(path.join(options.targetDir, 'theme.css'), 'utf8'), '/* external edit */');
});

test('external edits during a failed commit are not rolled back', async t => {
  const options = await sandbox(t);
  await previous(options.targetDir);
  const io = { ...fs, rename: async (from, to) => {
    if (to === path.join(options.targetDir, 'manifest.json')) {
      await fs.writeFile(path.join(options.targetDir, 'theme.css'), '/* newer external edit */');
      throw new Error('simulated concurrent change');
    }
    return fs.rename(from, to);
  } };
  await assert.rejects(deployTheme(options, io), /external edits preserved/);
  assert.equal(await fs.readFile(path.join(options.targetDir, 'theme.css'), 'utf8'), '/* newer external edit */');
});

test('refuse a symlink target', { skip: process.platform === 'win32' }, async t => {
  const options = await sandbox(t);
  await fs.mkdir(path.dirname(options.targetDir), { recursive: true });
  await fs.mkdir(path.join(options.root, 'other-theme'));
  await fs.symlink(path.join(options.root, 'other-theme'), options.targetDir);
  await assert.rejects(deployTheme(options), /symlink/);
});

test('refuse project paths and malformed existing theme files', async t => {
  const options = await sandbox(t);
  await assert.rejects(deployTheme({ ...options, targetDir: path.join(options.distDir, 'nested') }), /outside the source/);
  await fs.mkdir(path.join(options.targetDir, 'theme.css'), { recursive: true });
  await assert.rejects(deployTheme(options), /non-regular/);
});

test('CLI rejects a configuration directory escaping the vault', async t => {
  const options = await sandbox(t);
  const cli = fileURLToPath(new URL('../scripts/deploy.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [cli, '--vault', options.root, '--config-dir', '../outside'], { cwd: PROJECT_ROOT, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /inside the vault/);
});

async function validationSandbox(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cockpit-glass-release-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const config = JSON.parse(await fs.readFile(path.join(PROJECT_ROOT, 'theme.config.json'), 'utf8'));
  const files = ['manifest.json', 'package.json', 'versions.json', 'theme.config.json', 'LICENSE',
    'README.md', 'README.zh-CN.md', 'docs/RELEASING.md', `releases/${artifact.manifest.version}.md`,
    ...config.sources, config.communityScreenshot];
  for (const name of files) {
    await fs.mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await fs.copyFile(path.join(PROJECT_ROOT, name), path.join(root, name));
  }
  buildTheme({ root });
  return { root, screenshot: path.join(root, config.communityScreenshot) };
}

test('release validation rejects a missing listing screenshot', async t => {
  const fixture = await validationSandbox(t);
  await fs.unlink(fixture.screenshot);
  assert.throws(() => validateProject({ root: fixture.root, release: true }), /Community screenshot is missing/);
});

test('community validation accepts the configured screenshot without store.png', async t => {
  const fixture = await validationSandbox(t);
  await assert.rejects(fs.stat(path.join(fixture.root, 'screenshots/store.png')), { code: 'ENOENT' });
  assert.equal(validateProject({ root: fixture.root, community: true }).version, artifact.manifest.version);
});
