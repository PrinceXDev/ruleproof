import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {C, F} from '../theme';
import {CUES, TL, prog} from '../lib';

const c = CUES.n6;
const LIMITS = [
  [c.l1, 'A small, fixed vocabulary', 'Not a general policy language. Wording outside it becomes a visible assumption.'],
  [c.l2, 'Bypass variants are a versioned list', 'Common tricks, not a fuzzer. Holding against them is evidence, not a guarantee.'],
  [c.l3, 'Guided demo uses bundled synthetic fixtures', 'The workbench adds operator-configured test APIs and team review.'],
  [c.l4, 'Impact analysis is advisory', 'It sends no requests. Implementation-only changes still need full-suite verification.'],
] as const;

export const SceneN6: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <CinematicScene dur={TL.long.scenes.n6.dur}>
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 80, top: 70, width: 1400}}>
          <AnimatedHeadline text="A PASSING MATRIX MEANS THE APPROVED SCENARIOS PASSED." at={c.head} size={60} align="left" accent={{words: ['APPROVED', 'SCENARIOS'], color: C.lime}} />
        </div>
        <div style={{position: 'absolute', left: 80, top: 360, width: 1400}}>
          {LIMITS.map(([at, t, d]) => {
            const p = prog(f, at, 16);
            return (
              <div key={t} style={{display: 'flex', gap: 26, padding: '22px 0', borderTop: `1px solid ${C.line}`, opacity: p, transform: `translateX(${(1 - p) * 30}px)`}}>
                <span style={{fontFamily: F.mono, color: C.lime, fontSize: 26, fontWeight: 700}}>—</span>
                <div>
                  <div style={{fontSize: 34, fontWeight: 600, color: C.text}}>{t}</div>
                  <div style={{fontSize: 23, color: C.dim, marginTop: 4}}>{d}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </CinematicScene>
  );
};
