import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {PARTIAL, lerp, lin, prog, range} from '../lib';

export const LANES = [
  {kind: 'head-method', title: 'HEAD instead of GET'},
  {kind: 'trailing-slash', title: 'Trailing slash'},
  {kind: 'id-case', title: 'Upper-case object ID'},
  {kind: 'tenant-header', title: 'Spoofed X-Tenant-ID'},
  {kind: 'method-override', title: 'HTTP method override'},
];
const SPACING = 3.1; // frames between attempts; the SFX track uses the same value
export const arrival = (i: number, at: number) => at + 8 + i * SPACING;

// How many attempts have landed / leaked at frame f (real documented partial-fix results).
export const bypassStats = (f: number, at: number) => {
  let tried = 0;
  let leaked = 0;
  PARTIAL.variants.forEach((v, i) => {
    if (f >= arrival(i, at)) {
      tried++;
      if (v.leaked) leaked++;
    }
  });
  return {tried, leaked, held: tried - leaked};
};

const TILE_W = 284;
const TILE_H = 80;
const LANE_GAP = 18;
export const LANES_W = 5 * TILE_W + 4 * LANE_GAP;

// The 27 documented bypass attempts, flying in as test requests and landing in their lane.
export const BypassReveal: React.FC<{at: number; srcX?: number; srcY?: number}> = ({at, srcX = -120, srcY = 260}) => {
  const f = useCurrentFrame();
  const laneCount: Record<string, number> = {};
  return (
    <div style={{position: 'relative', width: LANES_W, height: 700}}>
      {LANES.map((l, li) => (
        <div key={l.kind} style={{position: 'absolute', left: li * (TILE_W + LANE_GAP), top: 0, width: TILE_W, fontFamily: F.mono, fontSize: 15, fontWeight: 700, letterSpacing: '0.08em', color: C.dim, borderBottom: `1px solid ${C.line}`, paddingBottom: 12, opacity: prog(f, at + li * 3, 10)}}>
          {l.title.toUpperCase()}
        </div>
      ))}
      {PARTIAL.variants.map((v, i) => {
        const li = LANES.findIndex((l) => l.kind === v.kind);
        const row = laneCount[v.kind] ?? 0;
        laneCount[v.kind] = row + 1;
        const x = li * (TILE_W + LANE_GAP);
        const y = 52 + row * (TILE_H + 8);
        const t0 = arrival(i, at);
        const fly = prog(f, t0 - 11, 11, lin);
        const landed = f >= t0;
        const pulse = landed ? 1 - prog(f, t0, 12, lin) : 0;
        const leak = v.leaked;
        const px = lerp(srcX, x + TILE_W / 2, fly);
        const py = lerp(srcY, y + TILE_H / 2, fly) - Math.sin(fly * Math.PI) * 60;
        const check = PARTIAL.checks.find((c) => c.id === v.of);
        const actor = (check?.actor ?? '').split(' ')[0].toLowerCase();
        const what = v.of.replace(/^(editor|viewer)-a-/, '').replace('-', ' ').replace('b1', 'other tenant');
        return (
          <React.Fragment key={v.id}>
            {f >= t0 - 11 && f < t0 && <div style={{position: 'absolute', left: px - 6, top: py - 6, width: 12, height: 12, borderRadius: 12, background: '#fff', boxShadow: `0 0 18px 4px ${C.lime}`}} />}
            <div style={{position: 'absolute', left: x, top: y, width: TILE_W, height: TILE_H, borderRadius: 12, opacity: landed ? 1 : 0, transform: `scale(${1 + pulse * 0.06})`, background: leak ? `rgba(255,82,99,${0.16 + pulse * 0.25})` : 'rgba(55,217,154,0.07)', border: `1.5px solid ${leak ? C.bad : 'rgba(55,217,154,0.35)'}`, boxShadow: leak ? `0 0 ${16 + pulse * 30}px rgba(255,82,99,0.35)` : 'none', padding: '11px 12px', boxSizing: 'border-box', fontFamily: F.mono}}>
              <div style={{fontSize: 19, fontWeight: 700, color: C.text, whiteSpace: 'nowrap'}}>
                {v.method} {v.path}
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 15}}>
                <span style={{color: C.mute}}>
                  {actor} {what.replace('read other tenant', 'read').replace('update other tenant', 'update').replace('export other tenant', 'export').replace('update a1', 'update own')}
                </span>
                <span style={{color: leak ? C.bad : C.ok, fontWeight: 700}}>
                  {v.got} {leak ? 'LEAKED' : 'HELD'}
                </span>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const CheckGrid12: React.FC<{at: number; step?: number; size?: number; allGreenAt?: number}> = ({at, step = 5, size = 1, allGreenAt}) => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'grid', gridTemplateColumns: `repeat(4, ${230 * size}px)`, gap: 14 * size}}>
      {range(12).map((i) => {
        const c = PARTIAL.checks[i];
        const t = at + i * step;
        const p = prog(f, t, 10);
        const green = f >= t + 8;
        const nm = `${c.actor.split(' ')[0].toLowerCase()} ${c.method === 'PUT' ? 'update' : c.path.endsWith('export') ? 'export' : 'read'} ${c.path.includes('b1') ? 'other' : 'own'}`;
        return (
          <div key={i} style={{height: 74 * size, borderRadius: 14, padding: `${12 * size}px ${14 * size}px`, boxSizing: 'border-box', background: green ? 'rgba(55,217,154,0.10)' : C.surface, border: `1.5px solid ${green ? 'rgba(55,217,154,0.55)' : 'rgba(255,255,255,0.1)'}`, opacity: p, transform: `translateY(${(1 - p) * 14}px)`, fontFamily: F.mono, boxShadow: allGreenAt !== undefined && f >= allGreenAt ? '0 0 26px rgba(55,217,154,0.25)' : 'none'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 15 * size, fontWeight: 700, color: C.text}}>
              <span>{nm}</span>
              <span style={{color: C.ok}}>{green ? '✓' : '…'}</span>
            </div>
            <div style={{fontSize: 13 * size, color: C.mute, marginTop: 6 * size}}>
              {c.method} {c.path} · want {c.want} · got {c.got}
            </div>
          </div>
        );
      })}
    </div>
  );
};
