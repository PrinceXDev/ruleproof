import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {BrowserMockup} from '../components/BrowserMockup';
import {Cursor} from '../components/Cursor';
import {TerminalRequest} from '../components/TerminalRequest';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {C, F} from '../theme';
import {CUES, TL, lin, prog, rand} from '../lib';

const c = CUES.s1;
const P = C.p;

// The app the viewer sees: a clean UI whose access control "works".
const AppUI: React.FC = () => {
  const f = useCurrentFrame();
  const toast = prog(f, c.forbidden, 10);
  const rows = [
    {id: 'a1', tenant: 'Tenant A', own: true},
    {id: 'b1', tenant: 'Tenant B', own: false},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, background: P.bg, fontFamily: F.ui, color: P.text}}>
      <div style={{height: 64, borderBottom: `1px solid ${P.line}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 12}}>
        <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
          <rect width="22" height="22" rx="6.5" fill="#2A3128" />
          <path d="M6.5 11.3l2.9 2.9 6.1-6.4" stroke={P.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{fontWeight: 600, fontSize: 19}}>Asset Workspace</span>
        <span style={{flex: 1}} />
        <span style={{fontSize: 14, color: P.dim, border: `1px solid ${P.line}`, borderRadius: 20, padding: '6px 14px'}}>viewer · Tenant A</span>
        <span style={{fontSize: 14, color: C.ok, background: 'rgba(55,217,154,0.1)', border: '1px solid rgba(55,217,154,0.35)', borderRadius: 20, padding: '6px 14px'}}>● Access control working</span>
      </div>
      <div style={{padding: '34px 40px'}}>
        <div style={{fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em'}}>Assets</div>
        <div style={{marginTop: 24, border: `1px solid ${P.line}`, borderRadius: 16, overflow: 'hidden', background: P.panel}}>
          <div style={{display: 'flex', padding: '14px 26px', fontSize: 12.5, letterSpacing: '0.12em', color: P.mute, borderBottom: `1px solid ${P.line}`}}>
            <span style={{width: 200}}>ASSET</span>
            <span style={{width: 300}}>OWNER</span>
            <span style={{flex: 1}} />
          </div>
          {rows.map((r) => (
            <div key={r.id} style={{display: 'flex', alignItems: 'center', height: 96, padding: '0 26px', borderTop: `1px solid ${P.line}`}}>
              <span style={{width: 200, fontFamily: F.mono, fontSize: 22, fontWeight: 600}}>{r.id}</span>
              <span style={{width: 300, fontSize: 18, color: P.dim}}>{r.tenant}</span>
              <span style={{flex: 1}} />
              <span style={{padding: '11px 28px', borderRadius: 12, background: P.lime, color: '#10120F', fontWeight: 600, fontSize: 17}}>Open</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{position: 'absolute', right: 40, bottom: 44, width: 560, padding: '22px 28px', borderRadius: 16, background: '#171B17', border: `1px solid ${P.line}`, boxShadow: '0 24px 60px rgba(0,0,0,0.6)', opacity: toast, transform: `translateY(${(1 - toast) * 24}px)`}}>
        <div style={{fontFamily: F.mono, fontSize: 40, fontWeight: 700, letterSpacing: '0.02em'}}>403 FORBIDDEN</div>
        <div style={{fontSize: 18, color: P.dim, marginTop: 8}}>You don’t have access to this asset.</div>
        <div style={{marginTop: 14, fontSize: 14, color: C.ok}}>✓ UI check passed · everything looks secure</div>
      </div>
    </div>
  );
};

export const Scene01: React.FC<{dur?: number}> = ({dur = TL.scenes.s1.dur}) => {
  const f = useCurrentFrame();
  const uiIn = prog(f, c.uiIn, 26);
  const freeze = prog(f, c.freeze, 22);
  const out = prog(f, c.title1 - 6, 10, lin);
  const slam = f >= c.ok200 && f < c.ok200 + 10 ? (1 - (f - c.ok200) / 10) : 0;
  const shake = `translate(${(rand(f) - 0.5) * 22 * slam}px, ${(rand(f + 40) - 0.5) * 16 * slam}px)`;
  const flash = f >= c.ok200 ? Math.max(0, 0.35 - (f - c.ok200) * 0.03) : 0;
  const term = prog(f, c.terminal, 16);
  const push = 1 + 0.04 * prog(f, 20, 70, lin);
  return (
    <CinematicScene dur={dur} full tint="red" tintAmount={prog(f, c.ok200, 20) * (1 - out)} fadeIn={0}>
      <AbsoluteFill style={{opacity: 1 - out, transform: shake}}>
        <AbsoluteFill style={{opacity: uiIn, alignItems: 'center', justifyContent: 'center', transform: `scale(${push * (1 - 0.26 * freeze)}) translateY(${-150 * freeze}px) perspective(1800px) rotateX(${14 * freeze}deg)`, filter: `grayscale(${freeze}) blur(${freeze * 3}px) brightness(${1 - 0.55 * freeze})`}}>
          <BrowserMockup width={1180} contentW={1180} contentH={660} url="app.example.test/assets">
            <AppUI />
          </BrowserMockup>
        </AbsoluteFill>
        <Cursor path={[{f: 26, x: 1560, y: 820}, {f: 64, x: 1440, y: 590}]} clickAt={c.click} opacity={uiIn * (1 - freeze)} />
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: term, transform: `translateY(${(1 - term) * 90 + 60}px) scale(${0.92 + 0.08 * term})`}}>
          {f >= c.terminal && <TerminalRequest request="GET /assets/b1" note="viewer · tenant A · direct API request, no UI involved" typeAt={c.typeStart} typeDur={18} respondAt={c.ok200} status="200 OK" body={['{', '  "asset": "b1",', '  "tenant": "B"', '}']} />}
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{background: `rgba(255,82,99,${flash})`}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 26}}>
        <div style={{opacity: f >= c.title2 ? 0.55 : 1, transition: 'none'}}>{f >= c.title1 && <AnimatedHeadline text="YOUR UI SAYS NO." at={c.title1} size={156} />}</div>
        {f >= c.title2 && <AnimatedHeadline text="DOES YOUR API?" at={c.title2} size={156} accent={{words: ['API'], color: C.bad}} />}
      </AbsoluteFill>
    </CinematicScene>
  );
};
