// Renders a set of review frames (one bundle, many stills):  node scripts/stills.mjs [comp] frame frame ...
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [comp, ...frames] = process.argv.slice(2);
const out = path.join(ROOT, 'out', 'stills');
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: path.join(ROOT, 'public')});
const composition = await selectComposition({serveUrl, id: comp});
for (const f of frames) {
  const file = path.join(out, `${comp}-${String(f).padStart(4, '0')}.jpg`);
  await renderStill({composition, serveUrl, frame: Number(f), output: file, imageFormat: 'jpeg', jpegQuality: 80});
  console.log('wrote', file);
}
