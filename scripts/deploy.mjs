import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { buildTheme, PROJECT_ROOT } from '../build.js';
import { validateProject } from './validate.mjs';
import { deployTheme } from './deploy-core.mjs';

try {
  const { values } = parseArgs({ options: {
    vault: { type: 'string' }, 'config-dir': { type: 'string', default: '.obsidian' },
    'theme-dir': { type: 'string' }, help: { type: 'boolean' }
  } });
  if (values.help) {
    console.log('Usage: npm run deploy -- [--vault /path/to/vault [--config-dir .obsidian] | --theme-dir /path/to/Cockpit-Glass]\nDefault: COCKPIT_THEME_DIR or ignored deploy.local.json (themeDir).');
  } else {
    if (values.vault && values['theme-dir']) throw new Error('Choose --vault or --theme-dir');
    let target = values['theme-dir'];
    if (values.vault) {
      const vault = path.resolve(values.vault), config = path.resolve(vault, values['config-dir']);
      const relative = path.relative(vault, config);
      if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error('Configuration directory must be inside the vault');
      if (!fs.statSync(vault).isDirectory()) throw new Error('Vault directory does not exist');
      target = path.join(config, 'themes', 'Cockpit Glass');
    }
    target ||= process.env.COCKPIT_THEME_DIR;
    const localConfig = path.join(PROJECT_ROOT, 'deploy.local.json');
    if (!target && fs.existsSync(localConfig)) target = JSON.parse(fs.readFileSync(localConfig, 'utf8')).themeDir;
    if (typeof target !== 'string' || !target.trim()) throw new Error('Set a target using --vault /path/to/vault, COCKPIT_THEME_DIR, or deploy.local.json. See deploy.local.example.json.');
    buildTheme();
    validateProject();
    const result = await deployTheme({ distDir: path.join(PROJECT_ROOT, 'dist'), targetDir: path.resolve(PROJECT_ROOT, target) });
    console.log(`${result.changed ? 'Deployed' : 'Already current'} Cockpit Glass ${result.version}\nTarget: ${result.target}`);
    if (result.backup) console.log(`Previous theme backup: ${result.backup}`);
    console.log('Theme preference was preserved. Select Cockpit Glass in Appearance if needed.');
  }
} catch (error) {
  console.error(`Deployment stopped: ${error.message}`);
  process.exitCode = 1;
}
