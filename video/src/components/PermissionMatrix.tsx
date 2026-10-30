import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {lin, prog} from '../lib';

const P = C.p;

export type Row = {role: string; action: string; scope: string; allow: boolean; src: number[]; implied?: boolean};

// The 8 checks generated from the sample rule (same order and outcomes as the real Studio screen).
export const ROWS: Row[] = [
  {role: 'Editor', action: 'Read', scope: 'Own tenant', allow: true, src: [0, 1]},
  {role: 'Editor', action: 'Update', scope: 'Own tenant', allow: true, src: [1]},
  {role: 'Editor', action: 'Read', scope: 'Other tenant', allow: false, src: [2]},
  {role: 'Editor', action: 'Update', scope: 'Other tenant', allow: false, src: [2]},
  {role: 'Viewer', action: 'Read', scope: 'Own tenant', allow: true, src: [0]},
  {role: 'Viewer', action: 'Update', scope: 'Own tenant', allow: false, src: [], implied: true},
  {role: 'Viewer', action: 'Read', scope: 'Other tenant', allow: false, src: [2]},
  {role: 'Viewer', action: 'Update', scope: 'Other tenant', allow: false, src: [2]},
];
export const SENT_COLORS = ['#D5F879', '#7DD3FC', '#C4B5FD'];
export const SENTENCES = ['Viewers can read assets in their own tenant.', 'Editors can also update them.', "Neither role can access another tenant's assets."];

const Pill: React.FC<{kind: 'pass' | 'fail' | 'run' | 'allow' | 'deny'; scale?: number}> = ({kind, scale = 1}) => {
  const m = {
    pass: {bg: P.okBg, fg: P.ok, bd: '#245f40', t: '✓ Passed'},
    fail: {bg: P.badBg, fg: P.bad, bd: '#7a2a32', t: '✕ Failed'},
    run: {bg: '#1D2519', fg: P.lime, bd: '#3b4636', t: '● Running'},
    allow: {bg: '#1D2420', fg: P.text, bd: P.line, t: 'Allow'},
    deny: {bg: '#1D2420', fg: P.text, bd: P.line, t: 'Deny'},
  }[kind];
  return <span style={{display: 'inline-block', padding: '4px 12px', borderRadius: 14, fontSize: 12.5 * scale, background: m.bg, color: m.fg, border: `1px solid ${m.bd}`, fontWeight: 500}}>{m.t}</span>;
};

export const PermissionMatrix: React.FC<{mode: 'expect' | 'run'; at: number; stagger?: number; runAt?: number; step?: number; fails?: number[]; showSource?: boolean; sourceAt?: number; rowH?: number; width?: number; focus?: number[]}> = ({mode, at, stagger = 5, runAt = 0, step = 15, fails = [2, 6], showSource, sourceAt = 0, rowH = 47, width = 976, focus}) => {
  const f = useCurrentFrame();
  const cols = mode === 'expect' ? [18, 166, 320, 520] : [18, 156, 299, 503, 677];
  const heads = mode === 'expect' ? ['ROLE', 'ACTION', 'SCOPE', 'EXPECTED'] : ['ROLE', 'ACTION', 'SCOPE', 'EXPECTED', 'RESULT'];
  return (
    <div style={{width, border: `1px solid ${P.line}`, borderRadius: 14, background: P.panel, overflow: 'hidden', fontFamily: F.ui, position: 'relative'}}>
      <div style={{height: 38, borderBottom: `1px solid ${P.line}`, position: 'relative', fontSize: 11.5, letterSpacing: '0.1em', color: P.mute}}>
        {heads.map((h, i) => (
          <span key={h} style={{position: 'absolute', left: cols[i], top: 12}}>
            {h}
          </span>
        ))}
        {showSource && <span style={{position: 'absolute', right: 22, top: 12, opacity: prog(f, sourceAt, 10)}}>SOURCE SENTENCE</span>}
      </div>
      {ROWS.map((r, i) => {
        const p = prog(f, at + i * stagger, 14);
        const t0 = runAt + i * step;
        const state = mode === 'expect' ? 'idle' : f < t0 ? 'idle' : f < t0 + step * 0.8 ? 'run' : fails.includes(i) ? 'fail' : 'pass';
        const failed = state === 'fail';
        const dim = focus && !focus.includes(i) ? 0.28 : 1;
        return (
          <div key={i} style={{height: rowH, borderTop: i ? `1px solid ${P.line}` : undefined, position: 'relative', opacity: p * dim, transform: `translateX(${(1 - p) * 26}px)`, background: failed ? 'rgba(255,82,99,0.07)' : state === 'run' ? 'rgba(213,248,121,0.05)' : 'transparent', fontSize: 14.5}}>
            {failed && <span style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: P.bad}} />}
            <span style={{position: 'absolute', left: cols[0], top: rowH / 2 - 10, fontWeight: 600}}>{r.role}</span>
            <span style={{position: 'absolute', left: cols[1], top: rowH / 2 - 10, color: P.dim}}>{r.action}</span>
            <span style={{position: 'absolute', left: cols[2], top: rowH / 2 - 10, color: P.dim}}>{r.scope}</span>
            <span style={{position: 'absolute', left: cols[3], top: rowH / 2 - 14}}>
              {mode === 'expect' && <span style={{fontSize: 12, color: P.mute, marginRight: 10}}>Expected</span>}
              {mode === 'expect' ? <Pill kind={r.allow ? 'allow' : 'deny'} /> : <span style={{color: P.dim}}>{r.allow ? 'Allow' : 'Deny'}</span>}
            </span>
            {mode === 'run' && (
              <span style={{position: 'absolute', left: cols[4], top: rowH / 2 - 14}}>{state !== 'idle' && <Pill kind={state === 'run' ? 'run' : state} />}</span>
            )}
            {showSource && (
              <span style={{position: 'absolute', right: 22, top: rowH / 2 - 11, display: 'flex', gap: 6, opacity: prog(f, sourceAt + i * 4, 10, lin), alignItems: 'center'}}>
                {r.implied && <span style={{fontSize: 11.5, color: P.warn, border: `1px dashed ${P.warn}`, borderRadius: 12, padding: '3px 9px'}}>implied deny · shown, not guessed</span>}
                {r.src.map((s) => (
                  <span key={s} style={{fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: '#10120F', background: SENT_COLORS[s], borderRadius: 6, padding: '3px 8px'}}>
                    S{s + 1}
                  </span>
                ))}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
