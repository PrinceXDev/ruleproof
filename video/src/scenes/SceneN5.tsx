import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {Bez, FlowPath, Node} from '../components/DataFlow';
import {C, F} from '../theme';
import {CUES, TL, prog} from '../lib';

const c = CUES.n5;
const MODS = ['rules parser', 'coverage', 'bypass catalog', 'check runner', 'diff'];
const FIX = [['seeded defect', C.bad], ['partial fix', '#F2C66B'], ['corrected', C.ok]] as const;
const ln = (a: [number, number], b: [number, number]): Bez => [a, [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3], [a[0] + (2 * (b[0] - a[0])) / 3, a[1] + (2 * (b[1] - a[1])) / 3], b];

export const SceneN5: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <CinematicScene dur={TL.long.scenes.n5.dur}>
      <AbsoluteFill>
        <svg width="1560" height="1080" style={{position: 'absolute', inset: 0}}>
          <FlowPath b={ln([330, 360], [520, 360])} color={C.lime} start={c.browser + 20} dur={24} packets={2} loop={40} />
          <FlowPath b={ln([1000, 330], [1170, 250])} color={C.lime} start={c.fixtures} dur={20} packets={2} loop={40} />
          <FlowPath b={ln([1000, 360], [1170, 360])} color={C.lime} start={c.fixtures + 6} dur={20} packets={2} loop={40} />
          <FlowPath b={ln([1000, 390], [1170, 470])} color={C.lime} start={c.fixtures + 12} dur={20} packets={2} loop={40} />
          <FlowPath b={ln([760, 540], [760, 650])} color={C.lime} start={c.mods + 30} dur={20} packets={2} loop={40} />
        </svg>
        <Node x={190} y={360} w={280} h={140} label="BROWSER" sub="Next.js static export" at={c.browser} />
        <div style={{position: 'absolute', left: 520, top: 210, width: 480, height: 330, borderRadius: 22, background: C.surface, border: '1.5px solid rgba(213,248,121,0.55)', boxShadow: '0 0 70px rgba(213,248,121,0.12)', opacity: prog(f, c.server, 16), padding: '22px 26px'}}>
          <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: '0.1em', color: C.lime}}>GO SERVER</div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18}}>
            {MODS.map((m, i) => (
              <span key={m} style={{padding: '9px 16px', borderRadius: 10, border: `1px solid ${C.line}`, background: '#0d1117', fontFamily: F.mono, fontSize: 19, color: C.text, opacity: prog(f, c.mods + i * 8, 12)}}>
                {m}
              </span>
            ))}
          </div>
          <div style={{marginTop: 22, fontSize: 18, color: C.dim, opacity: prog(f, c.mods + 44, 12)}}>REST API · workspace access · durable execution workers</div>
        </div>
        <Node x={760} y={720} w={460} h={110} label="STORE" sub="SQLite by default · PostgreSQL ready" at={c.mods + 20} />
        {FIX.map(([n, col], i) => (
          <Node key={n} x={1330} y={250 + i * 110} w={300} h={86} label={n.toUpperCase()} sub="" at={c.fixtures + i * 8} color={col} glow={f > c.fixtures + 30} />
        ))}
        <div style={{position: 'absolute', left: 1180, top: 400, fontFamily: F.mono, fontSize: 15, color: C.mute, letterSpacing: '0.1em', opacity: prog(f, c.fixtures + 26, 12)}}>SYNTHETIC ASSET API ×3</div>
        <div style={{position: 'absolute', left: 0, width: 1560, top: 840, display: 'flex', justifyContent: 'center'}}>
          {f >= c.ttl && <AnimatedHeadline text="ONE GO BINARY. THREE FIXTURES. ONE STATIC UI." at={c.ttl} size={58} accent={{words: ['ONE'], color: C.lime}} />}
        </div>
      </AbsoluteFill>
    </CinematicScene>
  );
};
