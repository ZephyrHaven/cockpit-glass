import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const FILES = ['theme.css', 'manifest.json'];
async function snapshot(io, file) {
  try {
    const stat = await io.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Refusing non-regular theme file: ${file}`);
    return await io.readFile(file);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}
const same = (a, b) => a === null ? b === null : b !== null && a.equals(b);
const versionParts = value => {
  if (!/^\d+\.\d+\.\d+$/.test(value)) throw new Error('Theme version must use x.y.z');
  return value.split('.').map(Number);
};
function isNewer(a, b) {
  const left = versionParts(a), right = versionParts(b);
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return left[i] > right[i];
  return false;
}

export async function deployTheme({ distDir, targetDir }, io = fs) {
  const source = path.resolve(distDir), target = path.resolve(targetDir);
  // Never overwrite source or a build directory through a misconfigured target.
  const project = path.dirname(source);
  const relative = path.relative(project, target);
  if (relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) throw new Error('Deployment target must be outside the source project');
  const next = Object.fromEntries(await Promise.all(FILES.map(async file => [file, await io.readFile(path.join(source, file))])));
  const manifest = JSON.parse(next['manifest.json']);
  if (manifest.name !== 'Cockpit Glass') throw new Error('Invalid deployment manifest');
  versionParts(manifest.version);
  if (!next['theme.css'].length) throw new Error('Theme CSS is empty');
  try {
    const stat = await io.lstat(target);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Theme target must be a real directory, not a symlink');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await io.mkdir(path.dirname(target), { recursive: true });
  const lock = `${target}.deploy-lock`;
  try { await io.mkdir(lock); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Another deployment is running (or left a lock): ${lock}`);
    throw error;
  }
  const temporary = [];
  try {
    await io.mkdir(target, { recursive: true });
    const previous = Object.fromEntries(await Promise.all(FILES.map(async file => [file, await snapshot(io, path.join(target, file))])));
    if (previous['manifest.json']) {
      const installed = JSON.parse(previous['manifest.json']);
      if (installed.name !== manifest.name) throw new Error('Refusing to overwrite another theme');
      if (isNewer(installed.version, manifest.version)) throw new Error(`Installed theme ${installed.version} is newer than ${manifest.version}`);
    }
    if (FILES.every(file => same(previous[file], next[file]))) return { target, version: manifest.version, changed: false, backup: null };
    let backup = null;
    if (FILES.some(file => previous[file] !== null)) {
      backup = path.join(target, '.cockpit-backups', `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`);
      await io.mkdir(backup, { recursive: true });
      for (const file of FILES) if (previous[file]) await io.writeFile(path.join(backup, file), previous[file], { flag: 'wx' });
    }
    const staged = {};
    for (const file of FILES) {
      staged[file] = path.join(target, `.cockpit-${randomUUID()}.tmp`);
      temporary.push(staged[file]);
      await io.writeFile(staged[file], next[file], { flag: 'wx' });
    }
    for (const file of FILES) {
      if (!same(previous[file], await snapshot(io, path.join(target, file)))) throw new Error('Theme files changed during deployment; retry after closing other installers');
    }
    const replaced = [];
    try {
      // Commit the manifest last. Each file replacement uses an atomic rename.
      for (const file of FILES) {
        await io.rename(staged[file], path.join(target, file));
        replaced.push(file);
      }
      for (const file of FILES) if (!same(next[file], await snapshot(io, path.join(target, file)))) throw new Error('Installed theme verification failed');
    } catch (error) {
      const conflicts = [];
      for (const file of replaced.reverse()) {
        const dest = path.join(target, file);
        if (!same(next[file], await snapshot(io, dest))) { conflicts.push(file); continue; }
        if (previous[file] === null) await io.unlink(dest);
        else {
          const restore = path.join(target, `.cockpit-${randomUUID()}.tmp`);
          temporary.push(restore);
          await io.writeFile(restore, previous[file], { flag: 'wx' });
          await io.rename(restore, dest);
        }
      }
      if (conflicts.length) throw new Error(`Deployment failed; external edits preserved in ${conflicts.join(', ')}. Restore from ${backup || 'your backup'}`, { cause: error });
      throw new Error(`Deployment failed; previous theme restored. ${error.message}`, { cause: error });
    }
    return { target, version: manifest.version, changed: true, backup };
  } finally {
    for (const file of temporary) await io.unlink(file).catch(error => { if (error.code !== 'ENOENT') console.warn(`Could not remove temporary file: ${file}`); });
    await io.rmdir(lock);
  }
}
