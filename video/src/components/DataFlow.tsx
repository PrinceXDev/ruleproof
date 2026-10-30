import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {lin, prog} from '../lib';

export type Pt = [number, number];
export type Bez = [Pt, Pt, Pt, Pt];

export const bezAt = ([p0, p1, p2, p3]: Bez, t: number): Pt => {
  const u = 1 - t;
  return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
};
export const bezD = (b: Bez) => `M${b[0][0]} ${b[0][1]} C${b[1][0]} ${b[1][1]} ${b[2][0]} ${b[2][1]} ${b[3][0]} ${b[3][1]}`;

// Animated SVG connector with data packets. Packets are positioned analytically, so renders are deterministic.
export const FlowPath: React.FC<{b: Bez; color: string; start: number; dur: number; packets?: number; dashed?: boolean; width?: number; trail?: boolean; reverse?: boolean; loop?: number}> = ({b, color, start, dur, packets = 1, dashed, width = 3, trail = true, reverse, loop}) => {
  const f = useCurrentFrame();
  const p = prog(f, start, dur, lin);
  const d = bezD(b);
  const pts = Array.from({length: packets}, (_, i) => {
    let t = loop ? ((((f - start) / loop + i / packets) % 1) + 1) % 1 : p - i * 0.12;
    if (!loop && (t < 0 || t > 1)) return null;
    if (reverse) t = 1 - t;
    return bezAt(b, t);
  });
  return (
    <g>
      <path d={d} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={width} strokeDasharray={dashed ? '8 10' : undefined} />
      {trail && <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray={dashed ? '0.012 0.016' : '1'} strokeDashoffset={1 - p} style={{filter: `drop-shadow(0 0 8px ${color})`}} />}
      {f >= start && pts.map((q, i) => q && <circle key={i} cx={q[0]} cy={q[1]} r={8 - i * 1.2} fill={i === 0 ? '#fff' : color} style={{filter: `drop-shadow(0 0 10px ${color})`}} />)}
    </g>
  );
};

export const Node: React.FC<{x: number; y: number; w?: number; h?: number; label: string; sub?: string; at: number; color?: string; glow?: boolean; children?: React.ReactNode}> = ({x, y, w = 250, h = 130, label, sub, at, color = C.text, glow, children}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 18);
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 20, background: C.surface, border: `1.5px solid ${glow ? color : 'rgba(255,255,255,0.14)'}`, boxShadow: glow ? `0 0 60px ${color}55` : '0 20px 60px rgba(0,0,0,0.5)', opacity: p, transform: `translateY(${(1 - p) * 24}px) scale(${0.94 + 0.06 * p})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8}}>
      <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 26, color, letterSpacing: '0.08em'}}>{label}</div>
      {sub && <div style={{fontFamily: F.ui, fontSize: 18, color: C.dim}}>{sub}</div>}
      {children}
    </div>
  );
};
