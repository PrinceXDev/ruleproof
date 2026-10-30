import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {BrowserMockup} from '../components/BrowserMockup';
import {StudioShell} from '../components/StudioShell';
import {PermissionMatrix} from '../components/PermissionMatrix';
import {EvidenceInspector} from '../components/EvidenceInspector';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {C, F} from '../theme';
import {CUES, TL, View, lin, prog, viewTransform} from '../lib';

const c = CUES.s5;
const P = C.p;
const FAILS = [2, 6];
const doneAt = (i: number) => c.rowStart + i * c.step + c.step * 0.8;

const Verify: React.FC = () => {
  const f = useCurrentFrame();
  let pass = 0;
  let fail = 0;
  for (let i = 0; i < 8; i++) if (f >= doneAt(i)) FAILS.includes(i) ? fail++ : pass++;
  const done = pass + fail === 8;
  const callout = prog(f, c.zoom + 10, 12);
  return (
    <>
      <div style={{position: 'absolute', left: 24, top: 40, fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em'}}>Does the API follow the rule?</div>
      <div style={{position: 'absolute', left: 24, top: 82, fontSize: 15, color: P.dim}}>
        Running the approved plan against the <b style={{color: P.text}}>seeded-defect</b> fixture.
      </div>
      <div style={{position: 'absolute', left: 24, top: 116, right: 24, height: 58, borderRadius: 14, background: P.panel, border: `1px solid ${P.line}`, display: 'flex', alignItems: 'center', padding: '0 22px', gap: 26, fontSize: 18}}>
        <span style={{color: P.ok}}>✓ {pass} passed</span>
        <span style={{color: P.bad}}>✕ {fail} failed</span>
        {!done && <span style={{color: P.lime, fontFamily: F.mono, fontSize: 13}}>● running {pass + fail}/8</span>}
      </div>
      <div style={{position: 'absolute', left: 24, top: 196}}>
        <PermissionMatrix mode="run" at={4} stagger={3} runAt={c.rowStart} step={c.step} width={1008} rowH={46} />
      </div>
      {FAILS.map((r) => (
        <div key={r} style={{position: 'absolute', left: 792, top: 196 + 38 + r * 46 + 7, opacity: callout, transform: `translateX(${(1 - callout) * 16}px)`, display: 'flex', gap: 8, fontFamily: F.mono, fontSize: 13.5, fontWeight: 700}}>
          <span style={{color: P.text, background: '#1d2420', border: `1px solid ${P.line}`, padding: '5px 9px', borderRadius: 7}}>Expected: 403</span>
          <span style={{color: P.bad, background: P.badBg, border: '1px solid #7a2a32', padding: '5px 9px', borderRadius: 7}}>Actual: 200</span>
        </div>
      ))}
    </>
  );
};

const ChainTitle: React.FC = () => {
  const f = useCurrentFrame();
  const p = prog(f, c.chain - 6, 12);
  return (
    <div style={{opacity: p, fontFamily: F.mono, fontSize: 26, fontWeight: 700, letterSpacing: '0.14em', color: C.text}}>
      RULE → EXPECTATION → REQUEST → RESPONSE → <span style={{color: C.bad}}>FAILURE</span>
    </div>
  );
};

export const Scene05: React.FC = () => {
  const f = useCurrentFrame();
  const frameOut = prog(f, c.chain - 8, 16, lin);
  const sum = prog(f, c.summary, 12) * (1 - prog(f, c.zoom - 2, 8, lin));
  // wrapper-local points (see Scene04): summary bar + first failing row at s=1.6
  const views: View[] = [
    {f: 0, s: 1.22, fx: 652, fy: 466, sx: 780, sy: 590},
    {f: c.summary + 20, s: 1.22, fx: 652, fy: 466, sx: 780, sy: 590},
    {f: c.zoom + 22, s: 1.5, fx: 600, fy: 326, sx: 800, sy: 520},
    {f: c.chain - 8, s: 1.5, fx: 600, fy: 326, sx: 800, sy: 520},
    {f: c.chain + 8, s: 1.0, fx: 555, fy: 367, sx: 780, sy: 560},
  ];
  return (
    <CinematicScene dur={TL.scenes.s5.dur} tint="red" tintAmount={prog(f, doneAt(2), 20) * 0.5}>
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 225, top: 186, opacity: 1 - frameOut * 0.92, filter: `blur(${frameOut * 5}px)`, transformOrigin: '0 0', transform: viewTransform(f, views, 225, 186)}}>
          <BrowserMockup width={1110} contentW={1280} contentH={800} url="localhost:8080/studio · verify">
            <StudioShell step={3} revision="Revision 1 of 1" fixture="Seeded Defect" primary="Run again">
              <Verify />
            </StudioShell>
          </BrowserMockup>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', justifyContent: 'center', gap: 40, alignItems: 'baseline', fontFamily: F.head, fontWeight: 700, fontSize: 120, letterSpacing: '-0.02em', opacity: sum, transform: `translateY(${(1 - sum) * 24}px)`, textShadow: '0 6px 40px rgba(0,0,0,0.8)'}}>
          <span style={{color: C.ok}}>6 PASSED.</span>
          <span style={{color: C.bad}}>2 FAILED.</span>
        </div>
        <div style={{position: 'absolute', left: 40, top: 150}}>{f >= c.chain - 6 && <ChainTitle />}</div>
        <div style={{position: 'absolute', left: 29, top: 270}}>{f >= c.chain - 6 && <EvidenceInspector at={c.chain} step={18} />}</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 800, display: 'flex', justifyContent: 'center'}}>
          {f >= c.chain + 112 && <AnimatedHeadline text="TRACEABLE FROM RULE TO RESPONSE." at={c.chain + 112} size={54} accent={{words: ['TRACEABLE'], color: C.lime}} />}
        </div>
      </AbsoluteFill>
    </CinematicScene>
  );
};
