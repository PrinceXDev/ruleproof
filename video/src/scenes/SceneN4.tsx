import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {C, F} from '../theme';
import {CUES, TL, prog} from '../lib';

const c = CUES.n4;
const STEPS = [
  ['Saved revision', 'immutable contract'],
  ['Exact revision approved', 'fingerprint recorded'],
  ['Request key + environment reservation', 'duplicates return the same receipt'],
  ['202 execution receipt', 'the browser can close now'],
  ['Detached worker checkpoints evidence', 'stored before the next request'],
  ['Completed → reservation released', 'interrupted → reviewer recovery'],
];

export const SceneN4: React.FC = () => {
  const f = useCurrentFrame();
  const shot = prog(f, c.shot, 18);
  const note = prog(f, c.flow + 5 * c.step + 40, 14);
  return (
    <CinematicScene dur={TL.long.scenes.n4.dur} tint="lime" tintAmount={0.2}>
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 60, top: 70, opacity: shot, transform: `translateY(${(1 - shot) * 30}px)`}}>
          <div style={{width: 560, height: 658, borderRadius: 16, overflow: 'hidden', border: '1.5px solid rgba(213,248,121,0.4)', boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(213,248,121,0.1)'}}>
            <Img src={staticFile('media/workbench-runs.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top'}} />
          </div>
          <div style={{marginTop: 18, fontFamily: F.mono, fontSize: 18, letterSpacing: '0.12em', color: C.dim}}>RUNS · recorded demo results</div>
        </div>
        <div style={{position: 'absolute', left: 700, top: 60}}>
          <AnimatedHeadline text="RUNS THAT SURVIVE." at={c.shot} size={64} align="left" accent={{words: ['SURVIVE'], color: C.lime}} />
          <div style={{marginTop: 34}}>
            {STEPS.map((s, i) => {
              const t = c.flow + i * c.step;
              const p = prog(f, t, 14);
              const lit = f >= t;
              return (
                <div key={s[0]} style={{display: 'flex', gap: 22, alignItems: 'flex-start', marginBottom: 20, opacity: 0.25 + 0.75 * p, transform: `translateX(${(1 - p) * 26}px)`}}>
                  <div style={{width: 40, height: 40, borderRadius: 40, flexShrink: 0, background: lit ? C.lime : 'transparent', border: `2px solid ${lit ? C.lime : C.mute}`, color: '#10120F', fontFamily: F.mono, fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: lit ? '0 0 20px rgba(213,248,121,0.5)' : 'none'}}>{i + 1}</div>
                  <div>
                    <div style={{fontSize: 30, fontWeight: 600, color: C.text, lineHeight: 1.15}}>{s[0]}</div>
                    <div style={{fontSize: 20, color: C.dim, marginTop: 3}}>{s[1]}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{marginTop: 14, fontFamily: F.mono, fontSize: 21, color: '#F2C66B', opacity: note}}>Interrupted requests are never replayed automatically.</div>
        </div>
      </AbsoluteFill>
    </CinematicScene>
  );
};
