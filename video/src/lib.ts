import {Easing, interpolate} from 'remotion';
import timeline from '../timeline.json';
import cuesJson from '../cues.json';
import voJson from './generated/vo.json';
import partialFix from './generated/partial-fix.json';

export const TL = timeline;
export const CUES = cuesJson;
export const VO = voJson as VoClip[];
export const PARTIAL = partialFix;

export type VoClip = {id: string; offset: number; file: string; scene: string; start: number; durationSec: number; durationFrames: number; words: {w: string; s: number; e: number}[]; env: number[]};

export const eo = Easing.bezier(0.16, 1, 0.3, 1);
export const eio = Easing.bezier(0.65, 0, 0.35, 1);
export const lin = (t: number) => t;

export const prog = (f: number, start: number, dur: number, easing: (t: number) => number = eo) =>
  interpolate(f, [start, start + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const range = (n: number) => Array.from({length: n}, (_, i) => i);
// window opacity: in at `a`, out at `b`
export const win = (f: number, a: number, b: number, fade = 8) => Math.min(prog(f, a, fade, lin), 1 - prog(f, b, fade, lin));
// deterministic pseudo random in [0,1)
export const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type View = {f: number; s: number; fx: number; fy: number; sx: number; sy: number};
// Camera for a layer whose top-left sits at (ox, oy): keeps layer point (fx, fy) on screen point (sx, sy) at scale s.
export const viewTransform = (f: number, keys: View[], ox: number, oy: number) => {
  let a = keys[0];
  let b = keys[0];
  let t = 0;
  for (let i = 0; i < keys.length - 1; i++) {
    if (f >= keys[i].f && f <= keys[i + 1].f) {
      a = keys[i];
      b = keys[i + 1];
      t = eio((f - a.f) / (b.f - a.f));
      break;
    }
    if (f > keys[i + 1].f) {
      a = keys[i + 1];
      b = a;
    }
  }
  const s = lerp(a.s, b.s, t);
  const fx = lerp(a.fx, b.fx, t);
  const fy = lerp(a.fy, b.fy, t);
  return `translate(${lerp(a.sx, b.sx, t) - ox - s * fx}px, ${lerp(a.sy, b.sy, t) - oy - s * fy}px) scale(${s})`;
};
