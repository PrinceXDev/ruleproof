import React from 'react';
import {C, F} from '../theme';

// Dark browser frame. Content is laid out at `contentW x contentH` and scaled to `width`.
export const BrowserMockup: React.FC<{width: number; contentW: number; contentH: number; url?: string; children: React.ReactNode; style?: React.CSSProperties; glow?: string}> = ({width, contentW, contentH, url = 'localhost:8080/studio', children, style, glow}) => {
  const k = width / contentW;
  const bar = 40;
  return (
    <div style={{width, borderRadius: 16, overflow: 'hidden', background: '#0B0E14', border: '1px solid rgba(255,255,255,0.12)', boxShadow: `0 40px 120px rgba(0,0,0,0.65)${glow ? `, 0 0 90px ${glow}` : ''}`, ...style}}>
      <div style={{height: bar, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#12161F', borderBottom: '1px solid rgba(255,255,255,0.07)'}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <span key={c} style={{width: 11, height: 11, borderRadius: 11, background: c, opacity: 0.85}} />
        ))}
        <div style={{marginLeft: 18, flex: 1, maxWidth: 520, height: 24, borderRadius: 12, background: 'rgba(255,255,255,0.05)', fontFamily: F.mono, fontSize: 12, color: C.dim, display: 'flex', alignItems: 'center', padding: '0 12px'}}>{url}</div>
      </div>
      <div style={{width, height: contentH * k, position: 'relative', overflow: 'hidden'}}>
        <div style={{width: contentW, height: contentH, transform: `scale(${k})`, transformOrigin: '0 0', position: 'absolute', left: 0, top: 0}}>{children}</div>
      </div>
    </div>
  );
};
