import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F} from '../theme';

// Spring-driven number. `suffix` is rendered at 55% size.
export const StatusCounter: React.FC<{value: number; at: number; size?: number; color?: string; suffix?: string; label?: string; labelSize?: number; damping?: number; pad?: number}> = ({value, at, size = 160, color = C.text, suffix, label, labelSize = 28, damping = 22, pad = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - at, fps, config: {damping, stiffness: 90, mass: 0.9}});
  const n = Math.round(value * Math.max(0, s));
  const show = f >= at;
  return (
    <div style={{opacity: show ? 1 : 0, textAlign: 'center', fontFamily: F.head}}>
      <div style={{fontSize: size, fontWeight: 700, lineHeight: 1, color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums'}}>
        {String(n).padStart(pad, '0')}
        {suffix && <span style={{fontSize: size * 0.55, opacity: 0.55}}>{suffix}</span>}
      </div>
      {label && <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: labelSize, color, letterSpacing: '0.12em', marginTop: size * 0.12}}>{label}</div>}
    </div>
  );
};
