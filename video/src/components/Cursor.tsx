import React from 'react';
import {useCurrentFrame} from 'remotion';
import {eio, lerp, lin, prog} from '../lib';

export type Key = {f: number; x: number; y: number};

// Pointer that glides through keyframes and ripples on click.
export const Cursor: React.FC<{path: Key[]; clickAt?: number; opacity?: number}> = ({path, clickAt, opacity = 1}) => {
  const f = useCurrentFrame();
  let x = path[0].x;
  let y = path[0].y;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (f >= a.f && f <= b.f) {
      const t = eio((f - a.f) / (b.f - a.f));
      x = lerp(a.x, b.x, t);
      y = lerp(a.y, b.y, t);
    } else if (f > b.f) {
      x = b.x;
      y = b.y;
    }
  }
  const ck = clickAt === undefined ? 0 : prog(f, clickAt, 14, lin);
  const press = clickAt !== undefined && f >= clickAt && f < clickAt + 5 ? 0.86 : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity, pointerEvents: 'none', zIndex: 50}}>
      {clickAt !== undefined && f >= clickAt && ck < 1 && <div style={{position: 'absolute', left: -22, top: -22, width: 44, height: 44, borderRadius: 44, border: '2px solid rgba(255,255,255,0.8)', transform: `scale(${0.3 + ck})`, opacity: 1 - ck}} />}
      <svg width="30" height="36" viewBox="0 0 24 28" style={{transform: `scale(${press})`, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))'}}>
        <path d="M3 2l17 11-7.2 1.8L9 22z" fill="#fff" stroke="#10120F" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
