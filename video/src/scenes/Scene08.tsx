import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {C, F} from '../theme';
import {CUES, TL, eio, lerp, lin, prog} from '../lib';

const c = CUES.s8;
const GAP = 110;
const PH = 500;
// One continuous track: intent → expectations → execution → evidence → change → CI
const PANELS = [
  {src: 'workbench-matrix.jpg', w: 708, h: 831, label: 'Authorization workbench', sub: 'permission matrix', n: '01'},
  {src: 'studio-review.png', w: 1280, h: 800, label: 'Review', sub: 'exact expectations, approved by revision', n: '02'},
  {src: 'workbench-runs.jpg', w: 708, h: 831, label: 'Run history', sub: 'durable executions', n: '03'},
  {src: 'studio-evidence.png', w: 1280, h: 800, label: 'Evidence inspector', sub: 'rule → request → response', n: '04'},
  {src: 'workbench-impact.jpg', w: 708, h: 831, label: 'Change impact', sub: 'what needs review', n: '05'},
  {src: 'studio-ci-hint.png', w: 1280, h: 900, label: 'CI verification', sub: 'the approved contract as a gate', n: '06'},
].map((p) => ({...p, pw: Math.round((p.w * PH) / p.h)}));
const stops = [c.p1, c.p2, c.p3, c.p4, c.p5, c.p6];
const xs: number[] = [];
PANELS.reduce((x, p, i) => {
  xs[i] = x + p.pw / 2;
  return x + p.pw + GAP;
}, 0);
const TRACK = PANELS.reduce((a, p) => a + p.pw + GAP, 0);

const WORDS = [['DEFINE.', c.w1], ['REVIEW.', c.w2], ['VERIFY.', c.w3], ['PROVE.', c.w4]] as const;

export const Scene08: React.FC = () => {
  const f = useCurrentFrame();
  // camera centre moves panel to panel, easing in the 18 frames before each stop
  let cx = xs[0];
  for (let i = 1; i < xs.length; i++) cx = f >= stops[i] - 18 ? lerp(xs[i - 1], xs[i], eio(prog(f, stops[i] - 18, 18, lin))) : cx;
  const active = stops.reduce((a, s, i) => (f >= s - 4 ? i : a), 0);
  const prg = Math.min(1, (cx - xs[0]) / (xs[xs.length - 1] - xs[0]));
  return (
    <CinematicScene dur={TL.scenes.s8.dur} tint="lime" tintAmount={0.35}>
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', justifyContent: 'center', gap: 34, fontFamily: F.head, fontWeight: 700, fontSize: 78, letterSpacing: '-0.02em'}}>
          {WORDS.map(([w, at], i) => {
            const p = prog(f, at, 16);
            const cur = f >= at && (i === 3 || f < WORDS[i + 1][1]);
            return (
              <span key={w} style={{opacity: p * (cur ? 1 : 0.4), transform: `translateY(${(1 - p) * 30}px)`, color: cur ? C.lime : C.text}}>
                {w}
              </span>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 0, top: 205, width: 1560, height: 760, overflow: 'hidden', perspective: 2200}}>
          <div style={{position: 'absolute', left: 780 - cx, top: 0, width: TRACK, height: 760, transformStyle: 'preserve-3d'}}>
            {PANELS.map((p, i) => {
              const left = xs[i] - p.pw / 2;
              const focus = prog(f, stops[i] - 14, 14) * (1 - (i < PANELS.length - 1 ? prog(f, stops[i + 1] - 18, 14) : 0));
              const near = i === active ? 1 : 0.45;
              return (
                <div key={p.src} style={{position: 'absolute', left, top: 50 + (1 - focus) * 10, width: p.pw, opacity: lerp(0.4, 1, focus) * (i === active ? 1 : 0.85) * near + 0.15, transform: `scale(${1 + 0.16 * focus}) rotateY(${(1 - focus) * (i % 2 ? -6 : 6)}deg)`, transformOrigin: '50% 50%'}}>
                  <div style={{width: p.pw, height: PH, borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${focus > 0.5 ? 'rgba(213,248,121,0.6)' : 'rgba(255,255,255,0.14)'}`, boxShadow: `0 40px 100px rgba(0,0,0,0.6), 0 0 ${60 * focus}px rgba(213,248,121,0.18)`, background: '#0E110F'}}>
                    <Img src={staticFile('media/' + p.src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top'}} />
                  </div>
                  <div style={{marginTop: 26, fontFamily: F.mono, fontSize: 18, color: C.lime, letterSpacing: '0.14em', fontWeight: 700}}>{p.n}</div>
                  <div style={{fontFamily: F.head, fontSize: 34, fontWeight: 700, color: C.text, marginTop: 4}}>{p.label}</div>
                  <div style={{fontSize: 19, color: C.dim, marginTop: 2}}>{p.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{position: 'absolute', left: 120, top: 190, width: 1320, height: 4, borderRadius: 2, background: C.line}}>
          <div style={{width: `${prg * 100}%`, height: '100%', background: C.lime, borderRadius: 2, boxShadow: '0 0 18px rgba(213,248,121,0.6)'}} />
        </div>
      </AbsoluteFill>
    </CinematicScene>
  );
};
