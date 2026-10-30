import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';

// Near-black stage with a slowly drifting grid; `tint` is reserved for the security-failure red.
export const Backdrop: React.FC<{tint?: 'none' | 'red' | 'lime'; intensity?: number; tintAmount?: number}> = ({tint = 'none', intensity = 1, tintAmount = 1}) => {
  const f = useCurrentFrame();
  const drift = (f * 0.4) % 80;
  const col = tint === 'red' ? '255,82,99' : tint === 'lime' ? '213,248,121' : '0,0,0';
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          backgroundPosition: `${drift}px ${drift}px`,
          opacity: 0.55 * intensity,
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, #000 15%, transparent 72%)',
        }}
      />
      {tint !== 'none' && <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 55%, rgba(${col},${0.16 * tintAmount}) 0%, transparent 62%)`}} />}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)'}} />
    </AbsoluteFill>
  );
};
