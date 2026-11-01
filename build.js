import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { transform } from 'lightningcss';
import { zipSync } from 'fflate';

export const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');

export function compileTheme(root = PROJECT_ROOT) {
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const manifest = JSON.parse(read('manifest.json'));
  const config = JSON.parse(read('theme.config.json'));
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new Error('Manifest version must use x.y.z');
  if (!Array.isArray(config.sources) || !config.sources.length || new Set(config.sources).size !== config.sources.length) throw new Error('Source list must be nonempty and unique');
  const source = config.sources.map(file => {
    if (!/^src\/[\w-]+\.css$/.test(file)) throw new Error(`Invalid CSS source path: ${file}`);
    return `/* ${file} */\n${read(file)}`;
  }).join('\n');
  const css = transform({ filename: 'theme.css', code: Buffer.from(source), minify: true, errorRecovery: false });
  if (css.warnings.length) throw new Error(JSON.stringify(css.warnings));
  const license = read('LICENSE').trim().split('\n').map(line => line ? ' * ' + line : ' *').join('\n');
  const banner = `/*! Cockpit Glass ${manifest.version} | Generated from src/ by npm run build.\n${license}\n */\n`;
  const files = {
    'theme.css': Buffer.concat([Buffer.from(banner), css.code, Buffer.from('\n')]),
    'manifest.json': Buffer.from(JSON.stringify(manifest, null, 2) + '\n')
  };
  const archiveName = `Cockpit-Glass-${manifest.version}.zip`;
  const entries = Object.fromEntries(Object.entries(files).map(([file, data]) => [
    `Cockpit Glass/${file}`, [data, { mtime: new Date(1980, 0, 1), level: 9 }]
  ]));
  files[archiveName] = Buffer.from(zipSync(entries));
  files['SHA256SUMS.txt'] = Buffer.from(Object.entries(files).map(([file, data]) => `${digest(data)}  ${file}`).join('\n') + '\n');
  return { manifest, source, files, archiveName };
}

export function buildTheme({ root = PROJECT_ROOT, check = false } = {}) {
  const result = compileTheme(root);
  const outputs = { 'theme.css': result.files['theme.css'], ...Object.fromEntries(Object.entries(result.files).map(([file, data]) => [`dist/${file}`, data])) };
  if (check) {
    for (const [file, data] of Object.entries(outputs)) {
      if (!fs.existsSync(path.join(root, file)) || !fs.readFileSync(path.join(root, file)).equals(data)) throw new Error(`Stale or missing build output: ${file}. Run npm run build.`);
    }
  } else {
    fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
    for (const [file, data] of Object.entries(outputs)) fs.writeFileSync(path.join(root, file), data);
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = buildTheme({ check: process.argv.includes('--check') });
  console.log(`Cockpit Glass ${result.manifest.version}: ${result.files['theme.css'].length} bytes CSS; ${process.argv.includes('--check') ? 'outputs match source' : `release files ready in dist/ (${result.archiveName})`}.`);
}
