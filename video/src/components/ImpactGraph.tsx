import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {prog} from '../lib';
import {Bez, FlowPath} from './DataFlow';

const OPS = [
  {m: 'GET', p: '/assets/search', tag: 'added', note: 'new operation · needs expectations'},
  {m: 'GET', p: '/assets/{id}', tag: 'changed', note: 'security scheme: Bearer'},
];
const CHECKS = ['editor-a-GET-a1', 'editor-a-GET-b1', 'viewer-a-GET-a1', 'viewer-a-PUT-a1', 'viewer-a-GET-b1'];

const Col: React.FC<{x: number; w: number; title: string; at: number; children: React.ReactNode; accent?: string}> = ({x, w, title, at, children, accent = C.lime}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 16);
  return (
    <div style={{position: 'absolute', left: x, top: 0, width: w, opacity: p, transform: `translateY(${(1 - p) * 24}px)`}}>
      <div style={{fontFamily: F.mono, fontSize: 18, fontWeight: 700, letterSpacing: '0.14em', color: accent, marginBottom: 16}}>{title}</div>
      {children}
    </div>
  );
};

// OPENAPI CHANGE → AFFECTED CHECKS → REVIEW PLAN. Static analysis: no request is sent anywhere.
export const ImpactGraph: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const l1: Bez = [[430, 80], [500, 80], [510, 110], [580, 110]];
  const l2: Bez = [[430, 185], [500, 185], [510, 225], [580, 225]];
  const l3: Bez = [[930, 167], [990, 167], [1010, 130], [1060, 130]];
  return (
    <div style={{position: 'relative', width: 1460, height: 520, fontFamily: F.ui}}>
      <svg width="1460" height="520" style={{position: 'absolute', inset: 0}}>
        <FlowPath b={l1} color={C.lime} start={at + 24} dur={20} packets={2} loop={26} />
        <FlowPath b={l2} color={C.lime} start={at + 28} dur={20} packets={2} loop={26} />
        <FlowPath b={l3} color={C.lime} start={at + 58} dur={20} packets={2} loop={26} />
      </svg>
      <Col x={0} w={430} title="OPENAPI CHANGE" at={at}>
        {OPS.map((o, i) => (
          <div key={o.p} style={{marginBottom: 14, padding: '16px 20px', borderRadius: 14, background: C.surface, border: '1px solid rgba(255,255,255,0.12)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontFamily: F.mono, fontSize: 22, fontWeight: 700, color: C.text}}>
                {o.m} {o.p}
              </span>
              <span style={{fontFamily: F.mono, fontSize: 13, color: '#10120F', background: i ? '#F2C66B' : C.lime, borderRadius: 6, padding: '3px 8px', fontWeight: 700}}>{o.tag}</span>
            </div>
            <div style={{marginTop: 8, fontSize: 17, color: C.dim}}>{o.note}</div>
          </div>
        ))}
      </Col>
      <Col x={580} w={350} title="AFFECTED CHECKS" at={at + 22}>
        {CHECKS.map((c, i) => {
          const p = prog(f, at + 30 + i * 4, 10);
          return (
            <div key={c} style={{marginBottom: 9, padding: '10px 16px', borderRadius: 10, background: C.surface, border: '1px solid rgba(213,248,121,0.35)', fontFamily: F.mono, fontSize: 17, color: C.text, opacity: p, transform: `translateX(${(1 - p) * 20}px)`}}>
              {c}
            </div>
          );
        })}
      </Col>
      <Col x={1060} w={400} title="REVIEW PLAN" at={at + 54}>
        <div style={{padding: '22px 24px', borderRadius: 16, background: C.surface, border: '1px solid rgba(255,255,255,0.14)'}}>
          {[
            ['2', 'affected operations'],
            ['5', 'checks to review'],
            ['4', 'identity × scope gaps on GET /assets/search'],
          ].map(([n, t], i) => (
            <div key={t} style={{display: 'flex', gap: 16, alignItems: 'baseline', marginBottom: i < 2 ? 14 : 0, opacity: prog(f, at + 62 + i * 8, 10)}}>
              <span style={{fontFamily: F.head, fontWeight: 700, fontSize: 50, color: C.lime, minWidth: 44}}>{n}</span>
              <span style={{fontSize: 19, color: C.text, lineHeight: 1.25}}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{marginTop: 16, fontSize: 16, color: '#F2C66B', lineHeight: 1.4, opacity: prog(f, at + 92, 12)}}>Advisory · static analysis sends no requests and proves nothing about runtime behaviour.</div>
      </Col>
    </div>
  );
};
