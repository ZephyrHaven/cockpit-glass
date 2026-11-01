// Read a locally installed app's CSS for verification; never publish that asset.
import fs from 'node:fs';
import path from 'node:path';
const input = process.argv[2];
const output = process.argv[3] || 'output/host.css';
if (!input) throw new Error('Usage: node scripts/extract-host-css.mjs /path/to/host.asar [output/host.css]');
const archive = fs.readFileSync(input);
const headerSize = archive.readUInt32LE(4);
const header = JSON.parse(archive.subarray(16, 16 + archive.readUInt32LE(12)).toString());
const entry = header.files?.['app.css'];
if (!entry?.size || entry.unpacked || entry.link) throw new Error('No packed root app.css in this archive');
const start = 8 + headerSize + Number(entry.offset);
if (!Number.isSafeInteger(start) || start < 0 || start + entry.size > archive.length) throw new Error('Invalid archive entry');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, archive.subarray(start, start + entry.size));
console.log(`Wrote local-only host CSS to ${output}`);
