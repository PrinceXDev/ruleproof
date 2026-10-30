import React from 'react';
import {C, F} from '../theme';

const P = C.p;

// Faithful recreation of the Studio chrome (sidebar, header, stepper) in the real 1280x800 layout.
export const StudioShell: React.FC<{step: 1 | 2 | 3; revision?: string; fixture?: 'Seeded Defect' | 'Corrected' | 'Partial fix'; primary?: string; primaryPulse?: number; children: React.ReactNode}> = ({step, revision = 'No revision yet', fixture = 'Seeded Defect', primary = 'Generate checks', primaryPulse = 0, children}) => {
  const steps = ['Explain', 'Review', 'Verify'];
  return (
    <div style={{position: 'absolute', inset: 0, background: P.bg, fontFamily: F.ui, color: P.text}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 223, bottom: 0, borderRight: `1px solid ${P.line}`, background: '#0B0E0C'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px'}}>
          <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="6.5" fill={P.lime} />
            <path d="M6.5 11.3l2.9 2.9 6.1-6.4" stroke="#10120F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{fontWeight: 700, fontSize: 19, letterSpacing: '-0.03em'}}>
            RuleProof<span style={{color: P.lime}}>.</span>
          </span>
        </div>
        <div style={{padding: '22px 20px 6px', fontSize: 10.5, letterSpacing: '0.12em', color: P.mute, fontFamily: F.mono}}>PROJECT</div>
        <div style={{padding: '0 20px 14px', fontSize: 14, color: P.dim}}>Asset Workspace</div>
        {['Checks', 'Run history', 'Fixtures'].map((n, i) => (
          <div key={n} style={{margin: '2px 12px', padding: '10px 14px', borderRadius: 10, fontSize: 14.5, background: i === 0 ? '#161B17' : 'transparent', color: i === 0 ? P.text : P.dim, fontWeight: i === 0 ? 500 : 400}}>
            {n}
          </div>
        ))}
        <div style={{position: 'absolute', left: 12, right: 12, bottom: 18, border: `1px solid ${P.line}`, borderRadius: 10, padding: '10px 12px', fontSize: 11.5, color: P.mute}}>
          <div style={{color: P.dim}}>
            <span style={{color: P.warn}}>● </span>Sample environment
          </div>
          <div style={{marginTop: 4}}>Synthetic fixtures · sqlite</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 224, right: 0, top: 0, height: 94, borderBottom: `1px solid ${P.line}`}}>
        <div style={{position: 'absolute', left: 24, top: 18, fontSize: 15, color: P.dim, display: 'flex', gap: 10, alignItems: 'center'}}>
          Asset Workspace <span style={{color: P.mute}}>›</span> <b style={{color: P.text, fontWeight: 600}}>Tenant access</b> <span style={{color: P.mute}}>|</span>
          <span style={{fontFamily: F.mono, fontSize: 12, color: P.mute}}>{revision}</span>
        </div>
        <div style={{position: 'absolute', right: 24, top: 12, display: 'flex', gap: 12, alignItems: 'center'}}>
          <div style={{display: 'flex', border: `1px solid ${P.line}`, borderRadius: 10, fontSize: 12.5, overflow: 'hidden', fontWeight: 600}}>
            {['Seeded Defect', 'Partial fix', 'Corrected'].filter((x) => x !== 'Partial fix' || fixture === 'Partial fix').map((x) => (
              <span key={x} style={{padding: '8px 14px', background: x === fixture ? '#1C221D' : 'transparent', color: x === fixture ? P.text : P.mute}}>
                {x}
              </span>
            ))}
          </div>
          <div style={{padding: '9px 16px', borderRadius: 10, background: P.lime, color: '#10120F', fontWeight: 600, fontSize: 14, boxShadow: primaryPulse ? `0 0 ${24 * primaryPulse}px rgba(213,248,121,${0.7 * primaryPulse})` : undefined, transform: `scale(${1 + 0.05 * primaryPulse})`}}>{primary}</div>
        </div>
        <div style={{position: 'absolute', left: 24, top: 56, display: 'flex', gap: 10, alignItems: 'center'}}>
          {steps.map((s, i) => {
            const done = i + 1 < step;
            const act = i + 1 === step;
            return (
              <React.Fragment key={s}>
                {i > 0 && <span style={{width: 20, height: 1, background: P.line}} />}
                <span style={{padding: '5px 14px', borderRadius: 20, fontSize: 12.5, border: `1px solid ${done ? '#245f40' : act ? '#3b4636' : P.line}`, background: done ? '#112a1c' : act ? '#1D2519' : 'transparent', color: done ? P.ok : act ? P.text : P.mute, fontWeight: act ? 600 : 400, fontFamily: act ? F.mono : F.ui}}>
                  {done ? '✓ ' : `0${i + 1} `}
                  {s}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <div style={{position: 'absolute', left: 224, right: 0, top: 95, bottom: 0}}>{children}</div>
    </div>
  );
};
