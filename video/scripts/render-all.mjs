// Renders the three deliverables. Usage: node scripts/render-all.mjs [main|novoice|teaser ...]
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');
fs.mkdirSync(OUT, {recursive: true});

const JOBS = {
  main: {id: 'RuleProofHackathon', file: 'ruleproof-hackathon.mp4'},
  novoice: {id: 'RuleProofHackathonNoVoice', file: 'ruleproof-hackathon-no-voice.mp4'},
  long: {id: 'RuleProofHackathon3Min', file: 'ruleproof-3min.mp4'},
  longnovoice: {id: 'RuleProofHackathon3MinNoVoice', file: 'ruleproof-3min-no-voice.mp4'},
  teaser: {id: 'RuleProofTeaser', file: 'ruleproof-teaser.mp4'},
};
const want = process.argv.slice(2).length ? process.argv.slice(2) : ['main', 'novoice', 'teaser', 'long', 'longnovoice'];

const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: path.join(ROOT, 'public')});
for (const key of want) {
  const {id, file} = JOBS[key];
  const composition = await selectComposition({serveUrl, id});
  const t0 = Date.now();
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    crf: 16,
    audioCodec: 'aac',
    audioBitrate: '256k',
    pixelFormat: 'yuv420p',
    outputLocation: path.join(OUT, file),
    onProgress: ({progress}) => {
      const p = Math.floor(progress * 20) * 5;
      if (p !== last) {
        last = p;
        console.log(`${file}: ${p}%`);
      }
    },
  });
  console.log(`done ${file} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
