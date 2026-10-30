import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {BrowserMockup} from '../components/BrowserMockup';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {C, F} from '../theme';
import {CUES, TL, lin, prog} from '../lib';

const c = CUES.n3;
const SHOTS = [
  {at: c.a, src: 'studio-diff-wording.png', tag: 'REWORDED RULE', note: 'phrase-level highlights, approval reset'},
  {at: c.b, src: 'studio-diff-expectation.png', tag: 'EDITED EXPECTATION', note: 'Deny 403 → Allow 200, 7 unchanged'},
  {at: c.c, src: 'studio-history-compare.png', tag: 'RUN HISTORY', note: 'compare any two revisions of a rule'},
];

export const SceneN3: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <CinematicScene dur={TL.long.scenes.n3.dur} tint="lime" tintAmount={0.25}>
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 0, right: 0, top: 44, display: 'flex', justifyContent: 'center'}}>
          <AnimatedHeadline text="EVERY EDIT IS A NEW REVISION." at={c.ttl} size={60} accent={{words: ['NEW', 'REVISION'], color: C.lime}} />
        </div>
        {SHOTS.map((s, i) => {
          const end = i < 2 ? SHOTS[i + 1].at : 9999;
          const p = prog(f, s.at, 18) * (1 - prog(f, end - 4, 12, lin));
          if (p <= 0) return null;
          return (
            <React.Fragment key={s.src}>
              <div style={{position: 'absolute', left: 0, width: 1560, top: 134, textAlign: 'center', opacity: p, fontFamily: F.mono, fontSize: 24, letterSpacing: '0.1em', color: C.text}}>
                <span style={{color: C.lime, fontWeight: 700}}>{s.tag}</span> · {s.note}
              </div>
              <div style={{position: 'absolute', left: 280, top: 190, opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${0.97 + 0.03 * p})`}}>
                <BrowserMockup width={1000} contentW={1280} contentH={900} url="localhost:8080/studio" glow="rgba(213,248,121,0.1)">
                  <Img src={staticFile('media/' + s.src)} style={{width: 1280, height: 900}} />
                </BrowserMockup>
              </div>
            </React.Fragment>
          );
        })}
      </AbsoluteFill>
    </CinematicScene>
  );
};
