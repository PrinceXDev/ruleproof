import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {LogoMark} from '../components/LogoReveal';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {Bez, FlowPath} from '../components/DataFlow';
import {C, F} from '../theme';
import {CUES, lin, prog, rand, range} from '../lib';

const c = CUES.s9;
const CX = 780;
const CY = 300;

// Twelve data paths from the edges converge on the logo position.
const PATHS: Bez[] = range(12).map((i) => {
  const a = (i / 12) * Math.PI * 2 + 0.3;
  const sx = CX + Math.cos(a) * 1100;
  const sy = CY + Math.sin(a) * 700;
  const bend = (rand(i + 20) - 0.5) * 420;
  return [[sx, sy], [sx - Math.cos(a) * 300 + bend, sy - Math.sin(a) * 200 - bend], [CX + Math.cos(a) * 160 - bend * 0.3, CY + Math.sin(a) * 120], [CX, CY]];
});

export const Scene09: React.FC<{dur?: number}> = ({dur = 180}) => {
  const f = useCurrentFrame();
  const paths = 1 - prog(f, 46, 14, lin);
  const flash = f >= 44 ? Math.max(0, 1 - (f - 44) / 14) : 0;
  const end = prog(f, dur - 16, 14, lin);
  const hold = f >= c.line2;
  return (
    <CinematicScene dur={dur} fadeOut={14} tint="lime" tintAmount={0.3 + flash * 0.6}>
      <AbsoluteFill style={{opacity: 1 - end}}>
        <svg width="1560" height="1080" style={{position: 'absolute', inset: 0, opacity: paths}}>
          {PATHS.map((b, i) => (
            <FlowPath key={i} b={b} color={i % 4 === 0 ? C.lime : 'rgba(213,248,121,0.55)'} start={i * 1.5} dur={34} packets={1} width={2} />
          ))}
        </svg>
        <div style={{position: 'absolute', left: CX - 90, top: CY - 90, opacity: f >= 30 ? 1 : 0}}>
          <LogoMark size={180} at={30} glow={1 + flash * 1.5} />
        </div>
        <div style={{position: 'absolute', left: 0, width: 1560, top: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
          <div style={{opacity: hold ? 0.5 : 1}}>{f >= c.line1 && <AnimatedHeadline text="SECURITY ISN'T WHAT YOUR UI PROMISES." at={c.line1} size={74} stagger={3} />}</div>
          {hold && <AnimatedHeadline text="IT'S WHAT YOUR API PROVES." at={c.line2} size={102} accent={{words: ['API', 'PROVES'], color: C.lime}} stagger={4} />}
        </div>
        <div style={{position: 'absolute', left: 0, width: 1560, top: 880, textAlign: 'center', fontFamily: F.mono, fontSize: 28, color: C.dim, letterSpacing: '0.06em', opacity: prog(f, c.url, 16)}}>github.com/PrinceXDev/ruleproof</div>
      </AbsoluteFill>
    </CinematicScene>
  );
};
