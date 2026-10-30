import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F} from '../theme';
import {eo, prog, rand} from '../lib';

// Geometry is copied 1:1 from docs/media/logo.svg so the stroke can be drawn on.
export const LogoMark: React.FC<{size: number; at: number; glow?: number; tick?: boolean}> = ({size, at, glow = 1, tick = true}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - at, fps, config: {damping: 16, stiffness: 120}});
  const draw = prog(f, at + 10, 22);
  const len = 14;
  return (
    <div style={{width: size, height: size, transform: `scale(${0.4 + 0.6 * s})`, opacity: Math.min(1, s * 2), filter: `drop-shadow(0 0 ${size * 0.35 * glow * draw}px rgba(213,248,121,${0.45 * glow}))`}}>
      <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
        <rect width="22" height="22" rx="6.5" fill={C.lime} />
        <path d="M6.5 11.3l2.9 2.9 6.1-6.4" stroke="#10120F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={tick ? len * (1 - draw) : 0} />
      </svg>
    </div>
  );
};

// Wordmark letters assemble from slightly displaced positions.
export const Wordmark: React.FC<{text?: string; size: number; at: number; color?: string}> = ({text = 'RuleProof.', size, at, color = C.text}) => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', fontFamily: F.ui, fontWeight: 700, fontSize: size, letterSpacing: '-0.035em', color, lineHeight: 1}}>
      {text.split('').map((ch, i) => {
        const p = prog(f, at + i * 2, 20);
        return (
          <span key={i} style={{display: 'inline-block', opacity: p, transform: `translate(${(1 - p) * (rand(i + 3) * 90 - 45)}px, ${(1 - p) * (rand(i + 9) * 60 - 30)}px)`, filter: `blur(${(1 - p) * 8}px)`, color: ch === '.' ? C.lime : color}}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

export const LogoLockup: React.FC<{size: number; at: number}> = ({size, at}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: size * 0.28}}>
    <LogoMark size={size} at={at} />
    <Wordmark size={size * 0.82} at={at + 8} />
  </div>
);

export const LightPulse: React.FC<{at: number; dur?: number; y: number}> = ({at, dur = 22, y}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur, eo);
  if (f < at || p >= 1) return null;
  return (
    <div style={{position: 'absolute', left: -400 + p * 2800, top: y - 2, width: 360, height: 4, background: `linear-gradient(90deg, transparent, ${C.lime}, #fff, ${C.lime}, transparent)`, boxShadow: '0 0 60px 12px rgba(213,248,121,0.45)', opacity: 1 - Math.max(0, p - 0.75) * 4}} />
  );
};
