import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Backdrop} from './Backdrop';
import {SAFE_W} from '../theme';
import {eio, lerp, lin, prog} from '../lib';

export type Cam = {from: {s: number; x: number; y: number}; to: {s: number; x: number; y: number}; start: number; dur: number};

// Fades a scene in/out of black so a cut never lands mid-motion.
export const SceneTransition: React.FC<{dur: number; fadeIn?: number; fadeOut?: number; children: React.ReactNode}> = ({dur, fadeIn = 6, fadeOut = 8, children}) => {
  const f = useCurrentFrame();
  const o = Math.min(fadeIn ? prog(f, 0, fadeIn, lin) : 1, fadeOut ? 1 - prog(f, dur - fadeOut, fadeOut, lin) : 1);
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

// Backdrop + optional camera move + safe area (left 1560px; the speaker column owns the rest).
export const CinematicScene: React.FC<{dur: number; full?: boolean; tint?: 'none' | 'red' | 'lime'; tintAmount?: number; camera?: Cam; fadeIn?: number; fadeOut?: number; children: React.ReactNode}> = ({dur, full, tint, tintAmount, camera, fadeIn, fadeOut, children}) => {
  const f = useCurrentFrame();
  let tf: string | undefined;
  if (camera) {
    const t = eio(prog(f, camera.start, camera.dur, lin));
    const s = lerp(camera.from.s, camera.to.s, t);
    tf = `translate(${lerp(camera.from.x, camera.to.x, t)}px, ${lerp(camera.from.y, camera.to.y, t)}px) scale(${s})`;
  }
  return (
    <SceneTransition dur={dur} fadeIn={fadeIn} fadeOut={fadeOut}>
      <Backdrop tint={tint} tintAmount={tintAmount} />
      <AbsoluteFill style={{width: full ? undefined : SAFE_W, transform: tf, transformOrigin: '50% 50%'}}>{children}</AbsoluteFill>
    </SceneTransition>
  );
};
