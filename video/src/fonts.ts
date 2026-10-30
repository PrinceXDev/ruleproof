import {staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';

const defs: [string, string, string][] = [
  ['Inter', 'inter-latin-400-normal.woff2', '400'],
  ['Inter', 'inter-latin-500-normal.woff2', '500'],
  ['Inter', 'inter-latin-600-normal.woff2', '600'],
  ['Inter', 'inter-latin-700-normal.woff2', '700'],
  ['Space Grotesk', 'space-grotesk-latin-500-normal.woff2', '500'],
  ['Space Grotesk', 'space-grotesk-latin-700-normal.woff2', '700'],
  ['JetBrains Mono', 'jetbrains-mono-latin-400-normal.woff2', '400'],
  ['JetBrains Mono', 'jetbrains-mono-latin-600-normal.woff2', '600'],
  ['JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'],
];

export const fontsReady = Promise.all(defs.map(([family, file, weight]) => loadFont({family, url: staticFile('fonts/' + file), weight})));
