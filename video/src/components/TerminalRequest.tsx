import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {lin, prog} from '../lib';

// Network-layer view: a request is typed, then the response lands.
export const TerminalRequest: React.FC<{request: string; note: string; typeAt: number; typeDur: number; respondAt: number; status: string; body: string[]; danger?: boolean; width?: number; title?: string}> = ({request, note, typeAt, typeDur, respondAt, status, body, danger = true, width = 1080, title = 'network · request inspector'}) => {
  const f = useCurrentFrame();
  const n = Math.floor(prog(f, typeAt, typeDur, lin) * request.length);
  const cursorOn = Math.floor(f / 8) % 2 === 0 && f < respondAt;
  const r = prog(f, respondAt, 10);
  const red = danger ? C.bad : C.ok;
  return (
    <div style={{width, borderRadius: 18, background: '#0A0D13', border: `1px solid ${r > 0 && danger ? 'rgba(255,82,99,0.55)' : 'rgba(255,255,255,0.12)'}`, boxShadow: `0 40px 120px rgba(0,0,0,0.7)${r > 0 && danger ? ', 0 0 120px rgba(255,82,99,0.25)' : ''}`, overflow: 'hidden', fontFamily: F.mono}}>
      <div style={{padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.07)', color: C.mute, fontSize: 16}}>
        <span style={{width: 9, height: 9, borderRadius: 9, background: C.mute}} />
        {title}
      </div>
      <div style={{padding: '34px 40px 40px'}}>
        <div style={{fontSize: 52, fontWeight: 700, color: C.text, minHeight: 64}}>
          <span style={{color: C.mute}}>› </span>
          {request.slice(0, n)}
          <span style={{opacity: cursorOn ? 1 : 0, color: C.lime}}>▌</span>
        </div>
        <div style={{fontSize: 20, color: C.mute, marginTop: 8, opacity: prog(f, typeAt + 4, 10)}}>{note}</div>
        <div style={{marginTop: 34, opacity: r, transform: `translateY(${(1 - r) * 16}px)`}}>
          <div style={{display: 'inline-block', fontSize: 76, fontWeight: 700, color: red, padding: '4px 26px', borderRadius: 14, background: danger ? 'rgba(255,82,99,0.14)' : 'rgba(55,217,154,0.12)', border: `1px solid ${red}`, letterSpacing: '-0.01em'}}>{status}</div>
          <div style={{marginTop: 26, fontSize: 30, lineHeight: 1.5, color: C.dim, padding: '14px 22px', borderLeft: `4px solid ${red}`, background: danger ? 'rgba(255,82,99,0.07)' : 'transparent'}}>
            {body.map((l, i) => (
              <div key={i} style={{color: i > 0 && i < body.length - 1 && danger ? '#FFB3BB' : C.dim}}>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
