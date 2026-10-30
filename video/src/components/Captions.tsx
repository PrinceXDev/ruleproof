import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F, SAFE_W} from '../theme';
import {Comp, clipsFor} from '../voice';

type Chunk = {from: number; to: number; words: {w: string; s: number; e: number}[]};

const chunkClip = (words: {w: string; s: number; e: number}[]) => {
  const out: {w: string; s: number; e: number}[][] = [];
  let cur: {w: string; s: number; e: number}[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const brk = /[.?!]$/.test(w.w) || (/,$/.test(w.w) && cur.length >= 4) || cur.length >= 8;
    if (brk || i === words.length - 1) {
      out.push(cur);
      cur = [];
    }
  });
  return out;
};

// Subtitles built from the narration timing. `hide` lists [from,to) frame ranges where a headline owns the screen.
export const Captions: React.FC<{comp: Comp; hide?: [number, number][]}> = ({comp, hide = []}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const chunks: Chunk[] = [];
  for (const c of clipsFor(comp)) {
    const base = c.at / fps;
    for (const g of chunkClip(c.words)) chunks.push({from: base + g[0].s, to: base + g[g.length - 1].e + 0.25, words: g.map((w) => ({...w, s: base + w.s, e: base + w.e}))});
  }
  const cur = chunks.find((c) => t >= c.from - 0.05 && t <= c.to);
  if (!cur || hide.some(([a, b]) => f >= a && f < b)) return null;
  return (
    <AbsoluteFill style={{width: SAFE_W, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 44, pointerEvents: 'none'}}>
      <div style={{maxWidth: 1180, padding: '14px 30px', borderRadius: 16, background: 'rgba(7,9,14,0.78)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: F.ui, fontWeight: 600, fontSize: 36, lineHeight: 1.3, textAlign: 'center', color: C.dim, textShadow: '0 2px 10px rgba(0,0,0,0.6)'}}>
        {cur.words.map((w, i) => (
          <span key={i} style={{color: t >= w.s - 0.02 ? C.text : C.dim, marginRight: 10}}>
            {w.w}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
