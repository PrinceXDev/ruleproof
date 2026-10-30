import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {prog} from '../lib';
import {Comp, ampAt, clipsFor} from '../voice';

// Small round presenter badge. Only the ring brightens with the real loudness of the narration.
export const Speaker: React.FC<{comp: Comp; showFrom: number; total: number}> = ({comp, showFrom, total}) => {
  const f = useCurrentFrame();
  const clips = clipsFor(comp);
  const amp = ampAt(clips, f);
  const inP = prog(f, showFrom, 26);
  const outP = prog(f, total - 22, 18, (t) => t);
  const o = inP * (1 - outP);
  const SIZE = 100;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: o}}>
      <div
        style={{
          position: 'absolute',
          right: 48,
          bottom: 48,
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE,
          overflow: 'hidden',
          border: `2px solid rgba(213,248,121,${0.3 + 0.55 * amp})`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          background: '#0b0e14',
          transform: `translateY(${(1 - inP) * 30}px)`,
        }}
      >
        <Img src={staticFile('media/speaker.webp')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', transform: `scale(${1.5 + 0.02 * amp})`, transformOrigin: '50% 25%'}} />
      </div>
    </AbsoluteFill>
  );
};
