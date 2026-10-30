import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {lin, prog} from '../lib';

type Props = {
  text: string;
  at: number; // local frame the first word starts
  size?: number;
  color?: string;
  weight?: number;
  font?: string;
  stagger?: number;
  align?: 'left' | 'center' | 'right';
  accent?: {words: string[]; color: string}; // words that take the accent colour
  outAt?: number; // frame to fade out
  letterSpacing?: string;
  lineHeight?: number;
  maxWidth?: number;
};

// Kinetic type: each word rises out of a mask. Fully frame-driven.
export const AnimatedHeadline: React.FC<Props> = ({text, at, size = 96, color = C.text, weight = 700, font = F.head, stagger = 4, align = 'center', accent, outAt, letterSpacing = '-0.02em', lineHeight = 1.04, maxWidth}) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  const out = outAt === undefined ? 1 : 1 - prog(f, outAt, 10, lin);
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end', gap: `0 ${size * 0.26}px`, fontFamily: font, fontWeight: weight, fontSize: size, letterSpacing, lineHeight, color, opacity: out, maxWidth, textAlign: align}}>
      {words.map((w, i) => {
        const p = prog(f, at + i * stagger, 22);
        const isAccent = accent?.words.includes(w.replace(/[.,?!']/g, ''));
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.12, marginBottom: -size * 0.12}}>
            <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)`, opacity: Math.min(1, p * 2.2), color: isAccent ? accent!.color : color, filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined}}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};
