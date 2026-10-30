import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {Bez, FlowPath, Node} from '../components/DataFlow';
import {C, F} from '../theme';
import {CUES, TL, prog, win} from '../lib';

const c = CUES.s2;
const Y = 360;
const X = {user: 200, fe: 570, api: 950, data: 1330};
const line = (a: number, b: number, y = Y): Bez => [[a, y], [a + (b - a) / 3, y], [a + (2 * (b - a)) / 3, y], [b, y]];

export const Scene02: React.FC = () => {
  const f = useCurrentFrame();
  const locked = prog(f, c.lock, 14);
  const leak = prog(f, c.leak, 14);
  const bypass: Bez = [[X.user, Y + 66], [X.user, 760], [X.api, 760], [X.api, Y + 66]];
  const tagP = Math.min(1, Math.max(0, (f - c.bypassStart) / (c.leak - c.bypassStart)));
  const tagT = tagP;
  const bx = (1 - tagT) ** 3 * X.user + 3 * (1 - tagT) ** 2 * tagT * X.user + 3 * (1 - tagT) * tagT ** 2 * X.api + tagT ** 3 * X.api;
  const by = (1 - tagT) ** 3 * (Y + 66) + 3 * (1 - tagT) ** 2 * tagT * 760 + 3 * (1 - tagT) * tagT ** 2 * 760 + tagT ** 3 * (Y + 66);
  return (
    <CinematicScene dur={TL.scenes.s2.dur} tint="red" tintAmount={leak * 0.8}>
      <AbsoluteFill>
        <svg width="1560" height="1080" style={{position: 'absolute', inset: 0}}>
          <FlowPath b={line(X.user + 125, X.fe - 125)} color={C.ok} start={c.n2 + 10} dur={22} packets={2} loop={48} />
          <g opacity={1 - locked * 0.75}>
            <FlowPath b={line(X.fe + 125, X.api - 125)} color={C.ok} start={c.n3 + 10} dur={22} packets={2} loop={48} />
          </g>
          <FlowPath b={line(X.api + 125, X.data - 125)} color={C.ok} start={c.n4 + 10} dur={22} packets={2} loop={48} />
          <FlowPath b={bypass} color={C.bad} start={c.bypassStart} dur={c.leak - c.bypassStart} dashed width={4} trail />
          <FlowPath b={line(X.api + 125, X.data - 125)} color={C.bad} start={c.leak} dur={18} packets={3} width={5} />
        </svg>
        <Node x={X.user} y={Y} label="USER" sub="viewer · tenant A" at={c.n1} />
        <Node x={X.fe} y={Y} label="FRONTEND" sub={locked > 0.5 ? 'button hidden for viewers' : 'UI'} at={c.n2} />
        <Node x={X.api} y={Y} label="API" sub="/assets/{id}" at={c.n3} color={leak > 0.5 ? C.bad : C.text} glow={leak > 0.5} />
        <Node x={X.data} y={Y} label="PROTECTED DATA" sub={leak > 0.5 ? 'tenant B · exposed' : 'tenant B'} at={c.n4} color={leak > 0.5 ? C.bad : C.text} glow={leak > 0.5} w={290} />
        <div style={{position: 'absolute', left: (X.fe + X.api) / 2 - 62, top: Y - 40, width: 124, height: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: locked, transform: `scale(${0.7 + 0.3 * locked})`}}>
          <svg width="40" height="46" viewBox="0 0 24 28" fill="none" stroke={C.dim} strokeWidth="2.2" strokeLinecap="round">
            <rect x="4" y="12" width="16" height="13" rx="3" fill={C.surface} />
            <path d="M8 12V8a4 4 0 018 0v4" />
          </svg>
          <span style={{fontFamily: F.mono, fontSize: 14, color: C.dim, marginTop: 4, letterSpacing: '0.1em'}}>UI: LOCKED</span>
        </div>
        {f >= c.bypassStart && f < c.leak + 4 && (
          <div style={{position: 'absolute', left: bx - 110, top: by - 56, fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: C.text, background: '#1a0d10', border: `1.5px solid ${C.bad}`, borderRadius: 10, padding: '6px 14px', boxShadow: '0 0 30px rgba(255,82,99,0.4)'}}>GET /assets/b1</div>
        )}
        <div style={{position: 'absolute', left: X.api + 60, top: Y + 110, opacity: leak, fontFamily: F.mono, fontWeight: 700, fontSize: 40, color: C.bad, transform: `scale(${0.8 + 0.2 * leak})`}}>200 OK</div>
        <div style={{position: 'absolute', left: 0, width: 1560, top: 840, display: 'flex', justifyContent: 'center'}}>
          <div style={{position: 'absolute', opacity: win(f, c.text1, c.text2 - 4, 6)}}>
            <AnimatedHeadline text="HIDDEN BUTTONS ARE NOT SECURITY." at={c.text1} size={76} outAt={c.text2 - 8} />
          </div>
          <div style={{position: 'absolute', opacity: prog(f, c.text2, 4)}}>{f >= c.text2 && <AnimatedHeadline text="AUTHORIZATION MUST BE VERIFIED." at={c.text2} size={76} accent={{words: ['VERIFIED'], color: C.lime}} />}</div>
        </div>
      </AbsoluteFill>
    </CinematicScene>
  );
};
