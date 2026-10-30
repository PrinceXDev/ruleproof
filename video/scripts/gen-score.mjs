// Synthesises the original score and sound effects (no samples, fully deterministic).
// Output: public/audio/{music,sfx,teaser-music,teaser-sfx}.wav + src/generated/audio-manifest.json
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TL = JSON.parse(fs.readFileSync(path.join(ROOT, 'timeline.json'), 'utf8'));
const CUES = JSON.parse(fs.readFileSync(path.join(ROOT, 'cues.json'), 'utf8'));
const SR = 44100;
const FPS = TL.fps;
const LONG = process.env.RP_COMP === 'long';
const TABLE = LONG ? TL.long.scenes : TL.scenes;
const LEN = LONG ? 182 : 92; // seconds of master buffer (2s tail)
const N = LEN * SR;
const TAU = Math.PI * 2;

let seed = 20261031;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 4294967296) * 2 - 1;
};
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const T = (scene, key) => (TABLE[scene].from + CUES[scene][key]) / FPS;
const S0 = (scene) => TABLE[scene].from / FPS;
const E0 = (scene) => (TABLE[scene].from + TABLE[scene].dur) / FPS;

const mk = () => ({L: new Float32Array(N), R: new Float32Array(N)});
const music = mk();
const sfx = mk();

// generic voice: gen(t, i) -> sample, t seconds since start
function put(bus, t0, dur, gen, pan = 0) {
  const a = Math.floor(t0 * SR);
  const n = Math.floor(dur * SR);
  const gl = Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n && a + i < N; i++) {
    if (a + i < 0) continue;
    const s = gen(i / SR, i);
    bus.L[a + i] += s * gl;
    bus.R[a + i] += s * gr;
  }
}
const env = (t, dur, atk, rel) => Math.max(0, Math.min(1, t / atk, (dur - t) / rel));
const expd = (t, k) => Math.exp(-t * k);

function svfNoise(bus, t0, dur, f0, f1, q, amp, shape = (u) => Math.sin(Math.PI * u), pan = 0) {
  let lp = 0;
  let bp = 0;
  put(
    bus,
    t0,
    dur,
    (t) => {
      const u = t / dur;
      const fc = f0 * (f1 / f0) ** u;
      const f = 2 * Math.sin((Math.PI * fc) / SR);
      const hp = rnd() - lp - bp / q;
      bp += f * hp;
      lp += f * bp;
      return bp * amp * shape(u) * 0.35;
    },
    pan,
  );
}

// ---- SFX -----------------------------------------------------------------
const tick = (t0, amp = 0.2, f = 2200, pan = 0) =>
  put(sfx, t0, 0.05, (t) => (Math.sin(TAU * f * t) * 0.5 + rnd() * 0.5) * expd(t, 160) * amp, pan);
const typeTicks = (t0, t1, amp = 0.09) => {
  for (let t = t0; t < t1; t += 0.045 + Math.abs(rnd()) * 0.04) tick(t, amp * (0.7 + Math.abs(rnd()) * 0.6), 1500 + rnd() * 500, rnd() * 0.3);
};
const blip = (t0, f = 880, amp = 0.2, pan = 0) =>
  put(sfx, t0, 0.35, (t) => (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2 * t)) * expd(t, 14) * Math.min(1, t * 800) * amp, pan);
const thunk = (t0, f = 95, amp = 0.5) =>
  put(sfx, t0, 0.5, (t) => Math.sin(TAU * (f * (1 - 0.45 * Math.min(1, t * 6)) * t)) * expd(t, 9) * amp);
const whoosh = (t0, dur = 0.7, amp = 0.35, up = true, pan = 0) =>
  svfNoise(sfx, t0, dur, up ? 300 : 5000, up ? 5000 : 300, 1.6, amp, (u) => Math.sin(Math.PI * u) ** 1.5, pan);
const riser = (t0, dur, amp = 0.35) => {
  svfNoise(sfx, t0, dur, 200, 7000, 1.2, amp, (u) => u ** 2);
  put(sfx, t0, dur, (t) => Math.sin(TAU * (180 + 520 * (t / dur) ** 2) * t) * (t / dur) ** 3 * amp * 0.25);
};
const impact = (t0, amp = 0.9) => {
  put(sfx, t0, 2.6, (t) => Math.sin(TAU * (28 + 38 * expd(t, 3)) * t) * expd(t, 1.6) * amp);
  put(sfx, t0, 0.7, (t) => Math.sin(TAU * (45 + 90 * expd(t, 9)) * t) * expd(t, 6) * amp * 0.7);
  let lp = 0;
  put(sfx, t0, 0.5, (t) => {
    lp += 0.12 * (rnd() - lp);
    return lp * expd(t, 9) * amp * 1.6;
  });
};
const hit = (t0, amp = 0.45, f = 70) =>
  put(sfx, t0, 1.2, (t) => (Math.sin(TAU * (f + 40 * expd(t, 12)) * t) * expd(t, 4) + rnd() * 0.25 * expd(t, 40)) * amp);
const chime = (t0, notes, amp = 0.16, gap = 0.07) =>
  notes.forEach((m, i) => {
    const f = mtof(m);
    put(sfx, t0 + i * gap, 1.6, (t) => (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 2.01 * t)) * expd(t, 3.2) * Math.min(1, t * 600) * amp, (i % 2 ? 0.25 : -0.25));
  });
const errSting = (t0, amp = 0.28) => {
  let lp = 0;
  put(sfx, t0, 0.5, (t) => {
    const x = ((t * 140) % 1) * 2 - 1 + ((t * 148) % 1) * 2 - 1;
    lp += 0.08 * (x - lp);
    return lp * expd(t, 7) * Math.min(1, t * 400) * amp * 2;
  });
  thunk(t0, 80, amp * 0.8);
};
const clunk = (t0, amp = 0.4) => {
  thunk(t0, 130, amp);
  tick(t0, amp * 0.6, 900);
};

// ---- Music ---------------------------------------------------------------
const pad = (t0, dur, midis, amp = 0.05, atk = 0.8, rel = 1.2) =>
  midis.forEach((m, k) => {
    const f = mtof(m);
    put(music, t0, dur, (t) => {
      const e = env(t, dur, atk, rel);
      return (Math.sin(TAU * f * 0.997 * t) + Math.sin(TAU * f * 1.003 * t) + 0.35 * Math.sin(TAU * f * 2 * t + Math.sin(t * 0.7 + k))) * e * amp * 0.5;
    }, (k % 3) - 1 > 0 ? 0.35 : -0.35);
  });
const sawLP = (t0, dur, f, amp, cutoff = 0.04, atk = 0.5, rel = 0.8) => {
  let lp = 0;
  put(music, t0, dur, (t) => {
    const x = ((t * f) % 1) * 2 - 1;
    lp += cutoff * (x - lp);
    return lp * env(t, dur, atk, rel) * amp;
  });
};
const sub = (t0, dur, m, amp = 0.2, atk = 0.05, rel = 0.3) => {
  const f = mtof(m);
  put(music, t0, dur, (t) => (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2 * t)) * env(t, dur, atk, rel) * amp);
};
const pluck = (t0, m, amp = 0.04, pan = 0) => {
  const f = mtof(m);
  put(music, t0, 0.6, (t) => (Math.sin(TAU * f * t) * 0.7 + (((t * f) % 1) * 2 - 1) * 0.15 + Math.sin(TAU * f * 2 * t) * 0.2) * expd(t, 9) * Math.min(1, t * 900) * amp, pan);
};
const kick = (t0, amp = 0.2) => put(music, t0, 0.35, (t) => Math.sin(TAU * (48 + 90 * expd(t, 28)) * t) * expd(t, 11) * amp);
const hat = (t0, amp = 0.02) => {
  let prev = 0;
  put(music, t0, 0.05, (t) => {
    const n = rnd();
    const h = n - prev;
    prev = n;
    return h * expd(t, 90) * amp;
  }, 0.2);
};
const gate = (t0, t1, fade = 0.012) => {
  const a = Math.floor(t0 * SR);
  const b = Math.floor(t1 * SR);
  for (let i = a; i < b && i < N; i++) {
    const u = Math.min(1, (i - a) / (fade * SR));
    music.L[i] *= 1 - u;
    music.R[i] *= 1 - u;
  }
};

const PROG = [
  {bass: 33, chord: [57, 60, 64]}, // Am
  {bass: 29, chord: [53, 57, 60]}, // F
  {bass: 36, chord: [55, 60, 64]}, // C
  {bass: 31, chord: [55, 59, 62]}, // G
];
const PROG_BRIGHT = [
  {bass: 29, chord: [57, 60, 64, 67]}, // Fmaj7-ish
  {bass: 36, chord: [59, 64, 67, 71]}, // Cmaj7
  {bass: 33, chord: [57, 60, 64, 67]}, // Am7
  {bass: 31, chord: [55, 59, 62, 66]}, // G6
];
function groove(t0, t1, prog, {kicks = 1, arp = 0.25, padAmp = 0.035, arpAmp = 0.035, hats = false, ramp = 0} = {}) {
  const bar = 2;
  let b = 0;
  for (let t = t0; t < t1 - 0.01; t += bar, b++) {
    const p = prog[b % prog.length];
    const end = Math.min(t + bar, t1);
    const g = 1 + ramp * ((t - t0) / (t1 - t0));
    pad(t, end - t + 0.4, p.chord, padAmp * g, 0.5, 0.6);
    sub(t, end - t, p.bass, 0.2 * g);
    sub(t, end - t, p.bass + 12, 0.05 * g);
    let k = 0;
    for (let s = t; s < end - 0.01; s += arp, k++) {
      pluck(s, p.chord[k % p.chord.length] + 12 + (k % 8 > 3 ? 12 : 0), arpAmp * g, ((k % 5) - 2) * 0.18);
      if (hats && k % 2 === 1) hat(s, 0.02);
    }
    if (kicks) for (let s = t; s < end - 0.01; s += 1 / kicks) kick(s, 0.16 * g);
  }
}

// ===== Master timeline =====================================================
// S1 — ambient pulse, cut at the 200 OK, then silence
{
  const a = 0.3;
  const b = T('s1', 'ok200');
  pad(a, b - a + 0.05, [33, 40, 45], 0.07, 1.8, 0.02);
  for (let t = 1.0; t < b; t += 1.0) {
    kick(t, 0.2);
    put(music, t, 0.3, (x) => Math.sin(TAU * 1320 * x) * expd(x, 14) * 0.012);
  }
  gate(b, T('s1', 'title1') + 0.5);
}
// S1 tail → S2: dark drone with a nervous tick
sawLP(7.6, S0('s3') + 1.0 - 7.6, mtof(33), 0.12, 0.012, 3.5, 0.2);
sub(7.6, S0('s3') + 1 - 7.6, 33, 0.2, 3.5, 0.2);
for (let t = S0('s2'); t < S0('s3'); t += 0.5) hat(t, 0.014);
// S3 — logo hero
{
  const t = T('s3', 'logo');
  pad(t, S0('s4') - t + 0.6, [45, 52, 57, 60, 64, 71], 0.05, 0.6, 1.4);
  sub(t, S0('s4') - t, 33, 0.24, 0.05, 0.5);
  for (let k = T('s3', 'matrix'); k < S0('s4'); k += 0.5) kick(k, 0.1);
}
// S4–S5 — the investigation (driving but restrained)
groove(S0('s4'), S0('s6'), PROG, {kicks: 1, arp: 0.25, hats: false, ramp: 0.25});
// S6 — first half: warm, then hard cut
groove(S0('s6'), S0('s6') + 4.0, PROG, {kicks: 1, arp: 0.25});
gate(T('s6', 'silence'), T('s6', 'twist') + 0.5);
// S6 — the twist: dissonant drone, accelerating ticks
{
  const a = T('s6', 'twist') + 0.5;
  const b = T('s6', 'leak9');
  sawLP(a, b - a, mtof(33), 0.14, 0.02, 2.0, 0.05);
  sawLP(a, b - a, mtof(34), 0.1, 0.02, 2.0, 0.05);
  sub(a, b - a, 33, 0.22, 1.5, 0.05);
  let gap = 0.5;
  for (let t = a; t < b; t += gap) {
    hat(t, 0.025);
    gap = Math.max(0.12, gap * 0.94);
  }
  const c = b + 0.02;
  const e = E0('s6');
  sawLP(c, e - c, mtof(33), 0.1, 0.02, 0.2, 1.0);
  pad(c, e - c + 0.4, [45, 48, 52], 0.04, 0.8, 0.8);
  sub(c, e - c, 33, 0.22, 0.1, 0.8);
}
// S7 — change-aware, calmer and brighter
if (LONG) groove(S0('n2'), E0('s7'), PROG_BRIGHT, {kicks: 1, arp: 0.25, arpAmp: 0.03, padAmp: 0.04});
if (LONG) groove(S0('n4'), E0('n6'), PROG, {kicks: 1, arp: 0.25, arpAmp: 0.03, padAmp: 0.04, ramp: 0.3});
if (!LONG) groove(S0('s7'), S0('s8'), PROG_BRIGHT, {kicks: 1, arp: 0.25, arpAmp: 0.03, padAmp: 0.04});
// S8 — montage energy
groove(S0('s8'), S0('s9'), PROG, {kicks: 2, arp: 0.125, arpAmp: 0.03, hats: true, ramp: 0.5});
// S9 — convergence and resolution
{
  const a = S0('s9');
  const final = T('s9', 'line2');
  pad(a, final - a + 0.1, [45, 52, 57, 59, 64], 0.05, 1.5, 0.02);
  sub(a, final - a, 33, 0.2, 2, 0.02);
  gate(final - 0.03, final + 0.02, 0.005);
  pad(final, 5.2, [45, 52, 57, 61, 64, 71, 81], 0.075, 0.03, 2.4); // A major add9, the resolution
  sub(final, 5.0, 33, 0.4, 0.01, 2.2);
  for (let t = 0; t < 8; t++) pluck(final + 0.25 + t * 0.25, [64, 69, 71, 76][t % 4] + 12, 0.02 - t * 0.002, t % 2 ? 0.3 : -0.3);
}

// ===== SFX =================================================================
// S1
whoosh(T('s1', 'uiIn'), 1.2, 0.12, true);
tick(T('s1', 'click'), 0.4, 1200);
thunk(T('s1', 'forbidden'), 110, 0.35);
blip(T('s1', 'forbidden') + 0.12, 1568, 0.1);
put(sfx, T('s1', 'freeze'), 0.5, (t) => Math.sin(TAU * (900 * expd(t, 3.5) + 90) * t) * expd(t, 6) * 0.12);
whoosh(T('s1', 'terminal'), 0.5, 0.25, false);
typeTicks(T('s1', 'typeStart'), T('s1', 'ok200') - 0.15, 0.1);
impact(T('s1', 'ok200'), 1.0);
hit(T('s1', 'title1'), 0.5, 62);
hit(T('s1', 'title2'), 0.55, 55);
// S2
['n1', 'n2', 'n3', 'n4'].forEach((k, i) => blip(T('s2', k), 660 + i * 110, 0.14, -0.4 + i * 0.27));
clunk(T('s2', 'lock'), 0.45);
whoosh(T('s2', 'bypassStart'), 0.9, 0.3, true);
errSting(T('s2', 'leak'), 0.3);
hit(T('s2', 'text1'), 0.3, 80);
hit(T('s2', 'text2'), 0.35, 74);
chime(T('s2', 'text2') + 0.15, [69, 76], 0.07);
// S3
whoosh(T('s3', 'pulse'), 0.5, 0.45, true);
riser(T('s3', 'pulse') - 0.1, 0.55, 0.3);
impact(T('s3', 'logo'), 0.85);
chime(T('s3', 'word'), [76, 81, 88], 0.09, 0.09);
for (let i = 0; i < 12; i++) tick(T('s3', 'matrix') + i * 0.07, 0.08, 2600 + i * 90, (i % 5) * 0.2 - 0.4);
hit(T('s3', 'hero'), 0.35, 82);
tick(T('s3', 'sub'), 0.25, 3000);
// S4
typeTicks(T('s4', 'typeStart'), T('s4', 'typeEnd'), 0.085);
tick(T('s4', 'click'), 0.4, 1300);
whoosh(T('s4', 'head'), 0.7, 0.28, true);
for (let i = 0; i < 7; i++) blip(T('s4', 'parse') + i * 0.12, 700 + i * 70, 0.09, (i % 3) * 0.3 - 0.3);
for (let i = 0; i < 8; i++) tick(T('s4', 'matrix') + i * (5 / FPS), 0.16, 1900 + i * 110);
chime(T('s4', 'approve'), [69, 73, 76, 81], 0.15, 0.08);
clunk(T('s4', 'bound'), 0.35);
// S5
for (let r = 0; r < 8; r++) {
  const t = T('s5', 'rowStart') + (r * CUES.s5.step) / FPS;
  if (r === 2 || r === 6) errSting(t + 0.18, 0.26);
  else blip(t + 0.15, 990 + (r % 3) * 80, 0.11, (r % 4) * 0.2 - 0.3);
}
hit(T('s5', 'summary'), 0.5, 66);
whoosh(T('s5', 'zoom'), 0.7, 0.3, true);
for (let i = 0; i < 5; i++) blip(T('s5', 'chain') + (i * 18) / FPS, 520 + i * 120, 0.13, i * 0.15 - 0.3);
// S6
for (let i = 0; i < 12; i++) blip(T('s6', 'gridStart') + (i * 5) / FPS, 800 + i * 40, 0.07, (i % 4) * 0.25 - 0.4);
chime(T('s6', 'allPass'), [64, 69, 73, 76, 81], 0.17, 0.07);
hit(T('s6', 'twist'), 0.55, 50);
whoosh(T('s6', 'twist'), 1.0, 0.18, false);
// variants land every 3 frames from `bypass`; leaks get a red sting
{
  const pf = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/generated/partial-fix.json'), 'utf8'));
  pf.variants.forEach((v, i) => {
    const t = T('s6', 'bypass') + (i * 3.1) / FPS;
    if (v.leaked) errSting(t, 0.16);
    else tick(t, 0.07, 1700 + (i % 6) * 120, (i % 5) * 0.2 - 0.4);
  });
}
riser(T('s6', 'leak9') - 1.0, 1.0, 0.4);
impact(T('s6', 'leak9'), 1.0);
hit(T('s6', 'contrast'), 0.4, 60);
// S7
whoosh(T('s7', 'diff'), 0.6, 0.25, true);
for (let i = 0; i < 6; i++) tick(T('s7', 'diff') + 0.3 + i * 0.28, 0.14, 2000 + i * 100);
for (let i = 0; i < 3; i++) blip(T('s7', 'impact') + i * 0.14, 740 + i * 140, 0.13);
errSting(T('s7', 'invalid'), 0.25);
whoosh(T('s7', 'ci'), 0.6, 0.28, true);
for (let i = 0; i < 4; i++) blip(T('s7', 'ci') + 0.4 + i * 0.32, 880, 0.08);
errSting(T('s7', 'fail'), 0.3);
impact(T('s7', 'fail'), 0.55);
hit(T('s7', 'title'), 0.35, 78);
// S8
['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].forEach((k) => whoosh(T('s8', k), 0.55, 0.2, true));
['w1', 'w2', 'w3', 'w4'].forEach((k, i) => hit(T('s8', k), 0.3 + i * 0.05, 62 + i * 6));
// S9
riser(T('s9', 'logo'), (CUES.s9.line1 - 3) / FPS, 0.3);
hit(T('s9', 'line1'), 0.45, 70);
impact(T('s9', 'line2'), 1.0);
tick(T('s9', 'url'), 0.25, 2800);

// ---- long cut only: extra scenes -------------------------------------------
if (LONG) {
  // n1: coverage gap
  whoosh(T('n1', 'panel'), 0.6, 0.25, true);
  for (let i = 0; i < 3; i++) blip(T('n1', 'panel') + 0.3 + i * 0.25, 700 + i * 90, 0.1);
  errSting(T('n1', 'gap'), 0.15);
  tick(T('n1', 'click'), 0.4, 1300);
  typeTicks(T('n1', 'click') + 0.2, T('n1', 'typeEnd'), 0.085);
  chime(T('n1', 'count'), [69, 73, 76, 81], 0.14, 0.07);
  whoosh(T('n1', 'run'), 0.6, 0.25, true);
  for (let i = 0; i < 4; i++) errSting(T('n1', 'fail') + i * 0.3, 0.18);
  hit(T('n1', 'csv'), 0.45, 66);
  // n2: corrected API
  tick(T('n2', 'toggle'), 0.4, 1400);
  for (let i = 0; i < 12; i++) blip(T('n2', 'grid') + (i * 6) / FPS, 800 + i * 40, 0.07, (i % 4) * 0.25 - 0.4);
  chime(T('n2', 'grid') + 0.2 + 72 / FPS, [64, 69, 73, 76, 81], 0.16, 0.07);
  for (let i = 0; i < 27; i++) tick(T('n2', 'bypass') + (i * 3.1) / FPS, 0.06, 1700 + (i % 6) * 110);
  chime(T('n2', 'counters'), [69, 76, 81, 88], 0.16, 0.08);
  hit(T('n2', 'counters'), 0.4, 74);
  blip(T('n2', 'share'), 1320, 0.14);
  // n3: diff
  ['a', 'b', 'c'].forEach((k) => {
    whoosh(T('n3', k), 0.6, 0.25, true);
    hit(T('n3', k) + 0.35, 0.3, 80);
  });
  // n4: durable runs
  whoosh(T('n4', 'shot'), 0.6, 0.22, true);
  for (let i = 0; i < 6; i++) blip(T('n4', 'flow') + (i * CUES.n4.step) / FPS, 560 + i * 90, 0.11, i * 0.15 - 0.4);
  for (let i = 0; i < 5; i++) tick(T('n4', 'bul') + 4 + (i * 45) / FPS, 0.14, 2200 + i * 80);
  // n5: architecture
  whoosh(T('n5', 'browser'), 0.5, 0.2, true);
  blip(T('n5', 'browser') + 0.1, 660, 0.12);
  hit(T('n5', 'server'), 0.35, 70);
  for (let i = 0; i < 5; i++) tick(T('n5', 'mods') + (i * 8) / FPS, 0.16, 1900 + i * 150);
  for (let i = 0; i < 3; i++) blip(T('n5', 'fixtures') + (i * 14) / FPS, 740 + i * 120, 0.12);
  hit(T('n5', 'ttl'), 0.35, 76);
  // n6: limits
  hit(T('n6', 'head'), 0.4, 68);
  ['l1', 'l2', 'l3', 'l4'].forEach((k, i) => {
    tick(T('n6', k), 0.22, 1800 + i * 160);
    blip(T('n6', k) + 0.05, 560 + i * 60, 0.08);
  });
}

// ===== Mix, teaser slicing, export ========================================
const peak = (b) => {
  let p = 0;
  for (let i = 0; i < N; i++) p = Math.max(p, Math.abs(b.L[i]), Math.abs(b.R[i]));
  return p;
};
const norm = (b, target) => {
  const g = target / peak(b);
  for (let i = 0; i < N; i++) {
    b.L[i] *= g;
    b.R[i] *= g;
  }
};
norm(music, 0.7);
norm(sfx, 0.9);

function slice(bus, segs, totalSec) {
  const out = {L: new Float32Array(totalSec * SR), R: new Float32Array(totalSec * SR)};
  for (const [from, to, at] of segs) {
    const n = Math.floor((to - from) * SR);
    for (let i = 0; i < n; i++) {
      const f = Math.min(1, i / (0.02 * SR), (n - i) / (0.02 * SR));
      const si = Math.floor(from * SR) + i;
      const di = Math.floor(at * SR) + i;
      if (si >= N || di >= out.L.length) break;
      out.L[di] += bus.L[si] * f;
      out.R[di] += bus.R[si] * f;
    }
  }
  return out;
}

function writeWav(file, bus, seconds) {
  const n = seconds * SR;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(Math.tanh(bus.L[i]) * 32767))), 44 + i * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(Math.tanh(bus.R[i]) * 32767))), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}

const dir = path.join(ROOT, 'public', 'audio');
fs.mkdirSync(dir, {recursive: true});
// teaser = s1 (0-9s) + s6 (50-63s) + s9 (84-92s), 30s total
const segs = [
  [0, 9, 0],
  [S0('s6'), S0('s7'), 9],
  [S0('s9'), S0('s9') + 8, 22],
];
if (LONG) {
  writeWav(path.join(dir, 'long-music.wav'), music, LEN);
  writeWav(path.join(dir, 'long-sfx.wav'), sfx, LEN);
} else {
  writeWav(path.join(dir, 'music.wav'), music, LEN);
  writeWav(path.join(dir, 'sfx.wav'), sfx, LEN);
  writeWav(path.join(dir, 'teaser-music.wav'), slice(music, segs, 30), 30);
  writeWav(path.join(dir, 'teaser-sfx.wav'), slice(sfx, segs, 30), 30);
}

const manifest = {
  generator: 'scripts/gen-score.mjs',
  note: 'Original procedural synthesis. No third-party samples, no licensing required.',
  sampleRate: SR,
  files: ['music.wav', 'sfx.wav', 'teaser-music.wav', 'teaser-sfx.wav'].map((f) => ({file: 'audio/' + f})),
  silenceGates: [
    {why: 'ambient cut at the 200 OK', fromSec: T('s1', 'ok200'), toSec: T('s1', 'title1') + 0.5},
    {why: 'purposeful silence before the bypass twist', fromSec: T('s6', 'silence'), toSec: T('s6', 'twist') + 0.5},
  ],
};
if (!LONG) fs.writeFileSync(path.join(ROOT, 'src/generated/audio-manifest.json'), JSON.stringify(manifest, null, 1));
console.log('wrote audio; music peak', peak(music).toFixed(2), 'sfx peak', peak(sfx).toFixed(2));
