// Copies real RuleProof media, local fonts and the speaker photo into public/ so renders never need the network.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA = path.join(ROOT, '..', 'docs', 'media');
const out = (p) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, 'public', p)), {recursive: true});
  return path.join(ROOT, 'public', p);
};
for (const f of ['logo.svg', 'studio-explain.png', 'studio-review.png', 'studio-verify.png', 'studio-evidence.png', 'studio-ci-hint.png', 'studio-history-compare.png', 'workbench-matrix.jpg', 'workbench-runs.jpg', 'workbench-impact.jpg']) {
  fs.copyFileSync(path.join(MEDIA, f), out('media/' + f));
}
const fonts = [
  ['inter', 'inter-latin-400-normal.woff2'], ['inter', 'inter-latin-500-normal.woff2'], ['inter', 'inter-latin-600-normal.woff2'], ['inter', 'inter-latin-700-normal.woff2'],
  ['space-grotesk', 'space-grotesk-latin-500-normal.woff2'], ['space-grotesk', 'space-grotesk-latin-700-normal.woff2'],
  ['jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff2'], ['jetbrains-mono', 'jetbrains-mono-latin-600-normal.woff2'], ['jetbrains-mono', 'jetbrains-mono-latin-700-normal.woff2'],
];
for (const [pkg, f] of fonts) fs.copyFileSync(path.join(ROOT, 'node_modules', '@fontsource', pkg, 'files', f), out('fonts/' + f));
const photo = process.argv[2];
if (photo) fs.copyFileSync(photo, out('media/speaker.webp'));
console.log('assets copied');
