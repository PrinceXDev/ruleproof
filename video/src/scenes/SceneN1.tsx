import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {Cursor} from '../components/Cursor';
import {StatusCounter} from '../components/StatusCounter';
import {C, F} from '../theme';
import {CUES, TL, lin, prog} from '../lib';

const c = CUES.n1;
const P = C.p;
const NEW = 'Both roles can export assets in their own tenant. Neither role can export another tenant’s assets.';
const FAILS = [
  ['editor read other tenant', 'GET  /assets/b1', 'want 403  got 200'],
  ['editor export other tenant', 'GET  /assets/b1/export', 'want 403  got 200'],
  ['viewer read other tenant', 'GET  /assets/b1', 'want 403  got 200'],
  ['viewer export other tenant', 'GET  /assets/b1/export', 'want 403  got 200'],
];

export const SceneN1: React.FC = () => {
  const f = useCurrentFrame();
  const cover = prog(f, c.panel, 16) * (1 - prog(f, c.run - 6, 10, lin));
  const run = prog(f, c.run, 14);
  const n = Math.floor(prog(f, c.click + 8, c.typeEnd - c.click - 8, lin) * NEW.length);
  const hot = prog(f, c.gap, 12);
  const rows = [
    ['GET', '/assets/{id}', '4 checks', '“Viewers can read assets in their own tenant.”'],
    ['PUT', '/assets/{id}', '4 checks', '“Editors can also update them.”'],
    ['GET', '/assets/{id}/export', 'no rule', ''],
  ];
  return (
    <CinematicScene dur={TL.long.scenes.n1.dur} tint={f >= c.fail ? 'red' : 'none'} tintAmount={prog(f, c.fail, 20) * 0.6}>
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 0, right: 0, top: 56, display: 'flex', justifyContent: 'center'}}>
          <AnimatedHeadline text="THE RULE FORGOT ONE DOOR." at={c.panel} size={66} accent={{words: ['ONE', 'DOOR'], color: C.lime}} />
        </div>
        <div style={{position: 'absolute', left: 130, top: 190, width: 1300, opacity: cover, transform: `translateY(${(1 - cover) * 20}px)`}}>
          <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: '0.14em', color: C.lime, marginBottom: 18}}>API COVERAGE · 2 OF 3 ENDPOINTS</div>
          {rows.map((r, i) => {
            const p = prog(f, c.panel + 8 + i * 12, 14);
            const isGap = i === 2;
            return (
              <div key={r[1]} style={{display: 'flex', alignItems: 'center', gap: 24, padding: '20px 26px', marginBottom: 12, borderRadius: 14, background: isGap ? `rgba(242,198,107,${0.05 + 0.07 * hot})` : C.surface, border: `1.5px solid ${isGap ? `rgba(242,198,107,${0.25 + 0.6 * hot})` : C.line}`, opacity: p, transform: `translateX(${(1 - p) * 30}px)`, fontFamily: F.mono, fontSize: 26}}>
                <span style={{width: 70, color: C.dim, fontWeight: 700}}>{r[0]}</span>
                <span style={{width: 380, color: C.text, fontWeight: 700}}>{r[1]}</span>
                <span style={{width: 150, color: isGap ? '#F2C66B' : C.ok, fontSize: 22}}>{r[2]}</span>
                <span style={{fontFamily: F.ui, fontSize: 22, color: C.dim}}>{r[3]}</span>
              </div>
            );
          })}
          <div style={{marginTop: 18, padding: '22px 26px', borderRadius: 14, border: '1px dashed rgba(242,198,107,0.6)', opacity: prog(f, c.suggest, 14), fontSize: 24, lineHeight: 1.45, color: C.text}}>
            <div style={{fontFamily: F.mono, fontSize: 15, letterSpacing: '0.14em', color: '#F2C66B', marginBottom: 8}}>SUGGESTED SENTENCE</div>
            {NEW}
            <span style={{display: 'inline-block', marginLeft: 18, padding: '8px 20px', borderRadius: 10, background: C.lime, color: '#10120F', fontWeight: 700, fontSize: 20, verticalAlign: 'middle', boxShadow: f >= c.click - 6 && f < c.click + 8 ? '0 0 30px rgba(213,248,121,0.8)' : undefined}}>Add to rule</span>
          </div>
          <div style={{marginTop: 22, padding: '20px 26px', borderRadius: 14, background: P.panel, border: `1px solid ${P.line}`, fontSize: 22, lineHeight: 1.5, color: C.dim, opacity: prog(f, c.click, 10)}}>
            Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant’s assets. <span style={{color: C.lime}}>{NEW.slice(0, n)}</span>
          </div>
          <div style={{position: 'absolute', right: 0, top: -76, opacity: prog(f, c.count, 12)}}>
            <StatusCounter value={12} at={c.count} size={78} color={C.lime} suffix=" checks" damping={18} />
            <div style={{textAlign: 'center', fontFamily: F.mono, fontSize: 16, color: C.dim}}>was 8</div>
          </div>
        </div>
        <Cursor path={[{f: c.suggest + 6, x: 900, y: 760}, {f: c.click - 3, x: 1280, y: 666}]} clickAt={c.click} opacity={cover} />
        <div style={{position: 'absolute', left: 130, top: 200, width: 1300, opacity: run}}>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 28, marginBottom: 22}}>
            <span style={{fontFamily: F.head, fontWeight: 700, fontSize: 84, color: C.ok}}>8 PASSED.</span>
            <span style={{fontFamily: F.head, fontWeight: 700, fontSize: 84, color: C.bad}}>4 FAILED.</span>
          </div>
          {FAILS.map((r, i) => {
            const p = prog(f, c.fail + i * 9, 12);
            return (
              <div key={r[0]} style={{display: 'flex', gap: 22, padding: '12px 22px', marginBottom: 8, borderRadius: 10, background: 'rgba(255,82,99,0.09)', borderLeft: `4px solid ${C.bad}`, fontFamily: F.mono, fontSize: 24, opacity: p, transform: `translateX(${(1 - p) * 24}px)`}}>
                <span style={{color: C.bad, fontWeight: 700}}>FAIL</span>
                <span style={{width: 330, color: C.text}}>{r[0]}</span>
                <span style={{width: 330, color: C.dim}}>{r[1]}</span>
                <span style={{color: '#FFB3BB'}}>{r[2]}</span>
              </div>
            );
          })}
          <div style={{marginTop: 22, padding: '22px 28px', borderRadius: 16, background: '#0A0D13', border: '1.5px solid rgba(255,82,99,0.6)', boxShadow: '0 0 60px rgba(255,82,99,0.2)', opacity: prog(f, c.csv, 14), fontFamily: F.mono, fontSize: 24, lineHeight: 1.5}}>
            <div style={{fontSize: 15, letterSpacing: '0.14em', color: C.bad, marginBottom: 8}}>LEAKED CSV · GET /assets/b1/export → 200</div>
            <span style={{color: C.dim}}>{'{"export":"b1.csv","rows":["id,name,owner",'}</span>
            <span style={{color: C.bad, fontWeight: 700}}>"b1,Synthetic asset,tenant B"</span>
            <span style={{color: C.dim}}>{'],"tenant":"B"}'}</span>
          </div>
        </div>
      </AbsoluteFill>
    </CinematicScene>
  );
};
