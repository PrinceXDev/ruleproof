import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {StatusCounter} from '../components/StatusCounter';
import {BypassReveal, CheckGrid12, LANES_W, bypassStats} from '../components/BypassReveal';
import {C, F} from '../theme';
import {CUES, TL, lin, prog, rand} from '../lib';

const c = CUES.s6;

// Chromatic-split text used while the "perfect" result starts to distort.
const Distort: React.FC<{amount: number; children: React.ReactNode}> = ({amount, children}) => {
  const f = useCurrentFrame();
  const j = (rand(Math.floor(f / 2)) - 0.5) * 2 * amount;
  return (
    <div style={{position: 'relative'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${j * 6}px, 0)`, color: 'rgba(255,82,99,0.55)', mixBlendMode: 'screen'}}>{children}</div>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${-j * 6}px, 0)`, color: 'rgba(80,200,255,0.4)', mixBlendMode: 'screen'}}>{children}</div>
      <div style={{position: 'relative', transform: `translateX(${j * 2}px)`}}>{children}</div>
    </div>
  );
};

export const Scene06: React.FC<{dur?: number}> = ({dur = TL.scenes.s6.dur}) => {
  const f = useCurrentFrame();
  const st = bypassStats(f, c.bypass);
  const phaseB = prog(f, c.bypass - 8, 14, lin);
  const gridDim = prog(f, c.allPass, 16);
  const counterOut = prog(f, c.twist - 4, 14, lin);
  const twistOut = prog(f, c.bypass - 8, 10, lin);
  const distort = prog(f, c.silence + 4, 24, lin) * (1 - twistOut);
  const lanesDim = prog(f, c.contrast - 4, 12, lin);
  const contrast = prog(f, c.contrast, 18);
  const slam = f >= c.leak9 && f < c.leak9 + 10 ? 1 - (f - c.leak9) / 10 : 0;
  const tintAmt = prog(f, c.twist, 40) * 0.7;
  return (
    <CinematicScene dur={dur} tint="red" tintAmount={tintAmt}>
      <AbsoluteFill style={{transform: `translate(${(rand(f) - 0.5) * 18 * slam}px, ${(rand(f + 9) - 0.5) * 12 * slam}px)`}}>
        {/* Phase A: 12 approved checks all pass */}
        <AbsoluteFill style={{opacity: 1 - phaseB, alignItems: 'center'}}>
          <div style={{position: 'absolute', top: 330, opacity: 1 - gridDim * 0.82, filter: `blur(${gridDim * 3}px)`}}>
            <CheckGrid12 at={c.gridStart} step={5} allGreenAt={c.allPass} />
          </div>
          <div style={{position: 'absolute', top: 310, opacity: (1 - counterOut) * prog(f, c.allPass, 4)}}>
            <Distort amount={distort}>
              <StatusCounter value={12} at={c.allPass} size={250} color={C.ok} suffix=" / 12" label="CHECKS PASSED" labelSize={44} />
            </Distort>
          </div>
          <div style={{position: 'absolute', top: 400}}>
            {f >= c.twist && <Distort amount={prog(f, c.twist, 10, lin) * (1 - twistOut) * 0.7}><AnimatedHeadline text="BUT WHAT ABOUT THE SIDE DOORS?" at={c.twist} size={96} maxWidth={1300} accent={{words: ['SIDE', 'DOORS?'], color: C.text}} outAt={c.bypass - 8} /></Distort>}
          </div>
        </AbsoluteFill>
        {/* Phase B: bypass layer around the passing matrix */}
        <AbsoluteFill style={{opacity: phaseB}}>
          <div style={{position: 'absolute', left: 40, top: 56, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderRadius: 14, border: '1.5px solid rgba(55,217,154,0.5)', background: 'rgba(55,217,154,0.08)', fontFamily: F.mono, fontSize: 24, fontWeight: 700, color: C.ok}}>
            ✓ 12 / 12 approved checks passed
          </div>
          <div style={{position: 'absolute', right: 40, top: 40, display: 'flex', gap: 54, alignItems: 'flex-end', opacity: 1 - lanesDim}}>
            <div style={{textAlign: 'right', transform: `scale(${f >= c.count27 && f < c.count27 + 12 ? 1.08 : 1})`}}>
              <div style={{fontFamily: F.head, fontWeight: 700, fontSize: 92, lineHeight: 1, color: C.text, fontVariantNumeric: 'tabular-nums'}}>
                {st.tried}
                <span style={{fontSize: 46, color: C.mute}}> / 27</span>
              </div>
              <div style={{fontFamily: F.mono, fontSize: 18, letterSpacing: '0.14em', color: C.dim, fontWeight: 700}}>BYPASS ATTEMPTS</div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{fontFamily: F.head, fontWeight: 700, fontSize: 92, lineHeight: 1, color: st.leaked ? C.bad : C.mute, fontVariantNumeric: 'tabular-nums', textShadow: st.leaked ? '0 0 40px rgba(255,82,99,0.55)' : 'none'}}>{st.leaked}</div>
              <div style={{fontFamily: F.mono, fontSize: 18, letterSpacing: '0.14em', color: st.leaked ? C.bad : C.mute, fontWeight: 700}}>LEAKED</div>
            </div>
          </div>
          <div style={{position: 'absolute', left: 40, top: 200, opacity: 1 - lanesDim * 0.78, filter: `blur(${lanesDim * 3}px)`}}>
            <BypassReveal at={c.bypass} srcX={110} srcY={-120} />
          </div>
          <div style={{position: 'absolute', left: 0, width: 1560, top: 330, display: 'flex', justifyContent: 'center', gap: 120, opacity: contrast, transform: `scale(${0.94 + 0.06 * contrast})`}}>
            <div style={{textAlign: 'center'}}>
              <div style={{fontFamily: F.head, fontWeight: 700, fontSize: 260, lineHeight: 1, color: C.ok, letterSpacing: '-0.04em'}}>12</div>
              <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: C.ok, letterSpacing: '0.12em'}}>PASSED</div>
              <div style={{fontSize: 22, color: C.dim, marginTop: 8}}>approved checks</div>
            </div>
            <div style={{width: 2, background: C.line, alignSelf: 'stretch'}} />
            <div style={{textAlign: 'center'}}>
              <div style={{fontFamily: F.head, fontWeight: 700, fontSize: 260, lineHeight: 1, color: C.bad, letterSpacing: '-0.04em', textShadow: '0 0 80px rgba(255,82,99,0.5)'}}>9</div>
              <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: C.bad, letterSpacing: '0.12em'}}>LEAKED</div>
              <div style={{fontSize: 22, color: C.dim, marginTop: 8}}>of 27 bypass attempts · documented partial-fix fixture</div>
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </CinematicScene>
  );
};

void LANES_W;
