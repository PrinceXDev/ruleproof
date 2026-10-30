import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {LightPulse, LogoLockup} from '../components/LogoReveal';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {ROWS} from '../components/PermissionMatrix';
import {C, F} from '../theme';
import {CUES, TL, lin, prog, range} from '../lib';

const c = CUES.s3;

// A faint permission matrix that emerges from the dark behind the logo.
const GhostMatrix: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center', transform: 'scale(1.18)', filter: 'blur(1.2px)'}}>
      <div style={{display: 'grid', gridTemplateColumns: '150px 120px 170px 120px', rowGap: 14, fontFamily: F.mono, fontSize: 20, color: C.dim}}>
        {ROWS.map((r, i) =>
          [r.role.toLowerCase(), r.action.toLowerCase(), r.scope.toLowerCase().replace(' tenant', ''), r.allow ? 'allow' : 'deny'].map((t, j) => {
            const p = prog(f, c.matrix + i * 3 + j * 2, 14, lin);
            return (
              <span key={`${i}${j}`} style={{opacity: p * (j === 3 ? 0.42 : 0.22), color: j === 3 && r.allow ? C.ok : C.dim, transform: `translateY(${(1 - p) * 10}px)`}}>
                {t}
              </span>
            );
          }),
        )}
      </div>
    </div>
  );
};

export const Scene03: React.FC = () => {
  const f = useCurrentFrame();
  const sub = prog(f, c.sub, 24);
  return (
    <CinematicScene dur={TL.scenes.s3.dur} tint="lime" tintAmount={prog(f, c.logo, 30) * 0.7} camera={{from: {s: 1, x: 0, y: 0}, to: {s: 1.06, x: 0, y: -8}, start: 0, dur: 240}}>
      <GhostMatrix />
      <LightPulse at={c.pulse} y={470} />
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div style={{position: 'absolute', top: 300, opacity: f >= c.logo ? 1 : 0}}>
          <LogoLockup size={128} at={c.logo} />
        </div>
        <div style={{position: 'absolute', top: 510}}>{f >= c.hero && <AnimatedHeadline text="MEET RULEPROOF." at={c.hero} size={118} />}</div>
        <div style={{position: 'absolute', top: 680, fontFamily: F.ui, fontWeight: 600, fontSize: 34, letterSpacing: '0.14em', color: C.dim, opacity: sub, transform: `translateY(${(1 - sub) * 14}px)`}}>
          FROM ACCESS RULES TO <span style={{color: C.lime}}>VERIFIABLE API EVIDENCE.</span>
        </div>
      </AbsoluteFill>
    </CinematicScene>
  );
};

void range;
