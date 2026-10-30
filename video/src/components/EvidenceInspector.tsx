import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {prog} from '../lib';

const P = C.p;

const Label: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = P.mute}) => <div style={{fontFamily: F.mono, fontSize: 15, letterSpacing: '0.14em', color, fontWeight: 600}}>{children}</div>;

// Real evidence for the failed "Editor → Read → Other tenant" check, laid out as the chain
// RULE → EXPECTATION → REQUEST → RESPONSE → FAILURE. Wording and values come from the Studio evidence drawer.
export const EvidenceInspector: React.FC<{at: number; step?: number}> = ({at, step = 20}) => {
  const f = useCurrentFrame();
  const W = 262;
  const GAP = 48;
  const cards: {k: string; body: React.ReactNode; hot?: boolean}[] = [
    {k: 'RULE', body: <div style={{fontSize: 26, lineHeight: 1.45, color: P.text}}>“…<span style={{background: 'rgba(196,181,253,0.22)', borderRadius: 4, padding: '0 3px'}}>Neither role can access another tenant’s assets.</span>”</div>},
    {k: 'EXPECTATION', body: (
      <>
        <div style={{fontSize: 26, color: P.text, fontWeight: 600, lineHeight: 1.4}}>Editor → Read → Other tenant</div>
        <div style={{marginTop: 18, display: 'inline-block', fontFamily: F.mono, fontSize: 30, fontWeight: 700, color: P.text, border: `1px solid ${P.line}`, borderRadius: 8, padding: '4px 12px', background: '#1d2420'}}>expected 403</div>
      </>
    )},
    {k: 'REQUEST', body: (
      <div style={{fontFamily: F.mono, fontSize: 22, lineHeight: 1.6, color: P.dim}}>
        <div style={{color: P.text, fontWeight: 700, fontSize: 30}}>GET /assets/b1</div>
        <div>demo-editor-a</div>
        <div>(tenant A)</div>
        <div style={{marginTop: 8, color: P.mute, fontSize: 16}}>Authorization: Bearer ••••••••</div>
      </div>
    )},
    {k: 'RESPONSE', body: (
      <div style={{fontFamily: F.mono, fontSize: 25, lineHeight: 1.55}}>
        <div style={{color: C.bad, fontWeight: 700, fontSize: 40}}>200 OK</div>
        <div style={{marginTop: 10, color: P.dim}}>{'{'}</div>
        <div style={{paddingLeft: 14, color: P.lime}}>"asset": "b1",</div>
        <div style={{paddingLeft: 14, color: C.bad, fontWeight: 700}}>"tenant": "B"</div>
        <div style={{color: P.dim}}>{'}'}</div>
      </div>
    )},
    {k: 'FAILURE', hot: true, body: (
      <>
        <div style={{fontFamily: F.mono, fontSize: 26, color: C.bad, fontWeight: 700, lineHeight: 1.7}}>
          Expected: 403
          <br />
          Actual: 200
        </div>
        <div style={{marginTop: 14, fontSize: 22, lineHeight: 1.45, color: '#FFC2C8'}}>The editor belongs to tenant A. This response contains an asset from tenant B.</div>
      </>
    )},
  ];
  return (
    <div style={{position: 'relative', width: W * 5 + GAP * 4, fontFamily: F.ui}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26, opacity: prog(f, at - 6, 12)}}>
        <span style={{fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: '0.14em', color: C.lime}}>EVIDENCE INSPECTOR</span>
        <span style={{fontSize: 22, color: P.dim}}>Editor → Read → Other tenant</span>
        <span style={{fontSize: 16, color: P.bad, background: P.badBg, border: '1px solid #7a2a32', borderRadius: 16, padding: '4px 14px', fontWeight: 600}}>Failed</span>
      </div>
      <div style={{display: 'flex', gap: GAP}}>
        {cards.map((c, i) => {
          const p = prog(f, at + i * step, 16);
          const lit = f >= at + i * step;
          return (
            <div key={c.k} style={{position: 'relative', width: W, minHeight: 380, padding: '22px 22px 26px', borderRadius: 18, background: c.hot ? 'rgba(255,82,99,0.08)' : P.panel, border: `1.5px solid ${lit ? (c.hot ? C.bad : 'rgba(213,248,121,0.55)') : P.line}`, boxShadow: c.hot && lit ? '0 0 70px rgba(255,82,99,0.3)' : lit ? '0 0 40px rgba(213,248,121,0.1)' : 'none', opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>
              <Label color={c.hot ? C.bad : C.lime}>
                {String(i + 1).padStart(2, '0')} · {c.k}
              </Label>
              <div style={{marginTop: 20}}>{c.body}</div>
              {i < 4 && (
                <svg width={GAP} height="20" viewBox="0 0 48 20" style={{position: 'absolute', right: -GAP, top: 40, opacity: prog(f, at + i * step + 10, 10)}}>
                  <path d="M2 10h38m-8-7l8 7-8 7" stroke={i === 3 ? C.bad : C.lime} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
