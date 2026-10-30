import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {CheckGrid12} from '../components/BypassReveal';
import {C, F} from '../theme';
import {CUES, TL, PARTIAL, lin, prog, range} from '../lib';

const c = CUES.n2;

export const SceneN2: React.FC = () => {
  const f = useCurrentFrame();
  const dim = prog(f, c.counters - 4, 14, lin);
  const big = prog(f, c.counters, 16);
  const share = prog(f, c.share, 16);
  const fixtures = ['Seeded defect', 'Partial fix', 'Corrected'];
  const sel = f >= c.toggle + 6 ? 2 : 0;
  return (
    <CinematicScene dur={TL.long.scenes.n2.dur} tint="lime" tintAmount={0.25 + 0.4 * big}>
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 0, right: 0, top: 50, display: 'flex', justifyContent: 'center'}}>
          <AnimatedHeadline text="SAME PLAN. FIXED API." at={c.toggle} size={72} accent={{words: ['FIXED'], color: C.ok}} />
        </div>
        <div style={{position: 'absolute', left: 0, width: 1560, top: 170, display: 'flex', justifyContent: 'center', gap: 0}}>
          <div style={{display: 'flex', border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden', fontFamily: F.mono, fontSize: 22, fontWeight: 700}}>
            {fixtures.map((x, i) => (
              <span key={x} style={{padding: '12px 28px', background: i === sel ? (i === 2 ? 'rgba(55,217,154,0.18)' : '#1c222b') : 'transparent', color: i === sel ? (i === 2 ? C.ok : C.text) : C.mute}}>
                {x}
              </span>
            ))}
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, width: 1560, top: 270, display: 'flex', justifyContent: 'center', opacity: 1 - dim * 0.85, filter: `blur(${dim * 3}px)`}}>
          <CheckGrid12 at={c.grid} step={6} allGreenAt={c.grid + 76} />
        </div>
        <div style={{position: 'absolute', left: 0, width: 1560, top: 560, display: 'flex', justifyContent: 'center', opacity: prog(f, c.bypass - 6, 10) * (1 - dim * 0.85)}}>
          <div style={{width: 1060}}>
            <div style={{fontFamily: F.mono, fontSize: 18, letterSpacing: '0.14em', color: C.dim, marginBottom: 12}}>27 BYPASS ATTEMPTS · CATALOG V1</div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 10}}>
              {range(27).map((i) => {
                const t = c.bypass + i * 3.1;
                const on = f >= t;
                const kind = PARTIAL.variants[i].kind;
                return (
                  <div key={i} style={{height: 64, borderRadius: 10, border: `1.5px solid ${on ? 'rgba(55,217,154,0.6)' : C.line}`, background: on ? 'rgba(55,217,154,0.12)' : C.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontSize: 13, color: on ? C.ok : C.mute, fontWeight: 700}}>
                    {on ? 'HELD' : '…'}
                    <span style={{fontSize: 10, color: C.mute, fontWeight: 400}}>{kind.replace('-method', '').replace('tenant-header', 'x-tenant')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, width: 1560, top: 330, display: 'flex', justifyContent: 'center', gap: 120, opacity: big, transform: `scale(${0.94 + 0.06 * big})`}}>
          {[['12 / 12', 'CHECKS PASSED'], ['27 / 27', 'ATTEMPTS REFUSED']].map(([n, l]) => (
            <div key={l} style={{textAlign: 'center'}}>
              <div style={{fontFamily: F.head, fontWeight: 700, fontSize: 170, lineHeight: 1, color: C.ok, letterSpacing: '-0.03em'}}>{n}</div>
              <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.ok, letterSpacing: '0.12em', marginTop: 10}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', left: 280, top: 720, width: 1000, padding: '22px 30px', borderRadius: 18, background: C.surface, border: '1.5px solid rgba(213,248,121,0.5)', boxShadow: '0 0 60px rgba(213,248,121,0.12)', opacity: share, transform: `translateY(${(1 - share) * 24}px)`}}>
          <div style={{fontFamily: F.mono, fontSize: 16, letterSpacing: '0.14em', color: C.lime}}>SHARE REPORT · READ-ONLY, NO SIGN-IN</div>
          <div style={{fontFamily: F.mono, fontSize: 30, fontWeight: 700, color: C.text, marginTop: 8}}>/report/?run=&lt;run id&gt;</div>
          <div style={{fontSize: 21, color: C.dim, marginTop: 6}}>The report checks the run’s plan hash against the approved revision.</div>
        </div>
      </AbsoluteFill>
    </CinematicScene>
  );
};
