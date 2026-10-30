import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {BrowserMockup} from '../components/BrowserMockup';
import {StudioShell} from '../components/StudioShell';
import {PermissionMatrix, SENTENCES, SENT_COLORS} from '../components/PermissionMatrix';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {Cursor} from '../components/Cursor';
import {C, F} from '../theme';
import {CUES, TL, View, lin, prog, viewTransform} from '../lib';

const c = CUES.s4;
const P = C.p;
const RULE = SENTENCES.join(' ');

const Explain: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.floor(prog(f, c.typeStart, c.typeEnd - c.typeStart, lin) * RULE.length);
  const typed = RULE.slice(0, n);
  const words = typed.trim() ? typed.trim().split(/\s+/).length : 0;
  const sentences = (typed.match(/\./g) || []).length;
  const caret = Math.floor(f / 8) % 2 === 0 && f < c.click;
  return (
    <>
      <div style={{position: 'absolute', left: 24, top: 48, fontFamily: F.mono, fontSize: 11.5, letterSpacing: '0.14em', color: P.lime}}>STEP 1 · EXPLAIN</div>
      <div style={{position: 'absolute', left: 24, top: 72, fontSize: 40, fontWeight: 700, letterSpacing: '-0.025em'}}>What should your API allow?</div>
      <div style={{position: 'absolute', left: 24, top: 130, width: 560, fontSize: 16, color: P.dim, lineHeight: 1.5}}>Describe who can do what, in plain language. Nothing runs until you review and approve the checks.</div>
      <div style={{position: 'absolute', left: 24, top: 205, width: 676, height: 262, borderRadius: 14, background: P.panel, border: `1px solid ${P.line}`, overflow: 'hidden'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', padding: '14px 18px', fontSize: 13, color: P.dim, borderBottom: `1px solid ${P.line}`}}>
          <span>Access rule</span>
          <span style={{fontFamily: F.mono, fontSize: 11.5, color: P.mute}}>
            {words} words · {sentences} sentences
          </span>
        </div>
        <div style={{height: 2, background: P.lime, opacity: 0.8}} />
        <div style={{padding: '20px 18px', fontSize: 17.5, lineHeight: 1.55, color: P.text, minHeight: 130}}>
          {typed}
          <span style={{display: 'inline-block', width: 2, height: 20, background: P.lime, marginLeft: 2, verticalAlign: 'middle', opacity: caret ? 1 : 0}} />
        </div>
        <div style={{position: 'absolute', left: 18, right: 18, bottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: P.mute}}>
          <span>🎙 Dictate with Wispr Flow, or type</span>
          <span style={{padding: '10px 18px', borderRadius: 10, background: P.lime, color: '#10120F', fontWeight: 600, fontSize: 14.5, boxShadow: f >= c.click - 6 && f < c.click + 10 ? '0 0 26px rgba(213,248,121,0.8)' : undefined}}>✦ Generate checks</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 732, top: 158, width: 300, borderRadius: 14, background: P.panel, border: `1px solid ${P.line}`, padding: '18px 20px', fontSize: 14, lineHeight: 1.5}}>
        <div style={{fontFamily: F.mono, fontSize: 11, letterSpacing: '0.12em', color: P.mute, marginBottom: 12}}>FIXTURE REFERENCE</div>
        {[['Roles', 'Viewer, Editor'], ['Actions', 'Read asset, Update asset'], ['Resource scope', 'Own tenant, Other tenant']].map(([a, b]) => (
          <div key={a} style={{marginBottom: 10}}>
            <div style={{color: P.mute, fontSize: 13}}>{a}</div>
            <div style={{color: P.text, fontWeight: 500}}>{b}</div>
          </div>
        ))}
      </div>
    </>
  );
};

const Review: React.FC = () => {
  const f = useCurrentFrame();
  const hl = f < 250 ? -1 : f < 265 ? 0 : f < 280 ? 1 : f < 296 ? 2 : -1;
  const focusRows = hl === 0 ? [0, 4] : hl === 1 ? [0, 1] : hl === 2 ? [2, 3, 6, 7] : undefined;
  const approved = prog(f, c.approve, 10);
  const chips = ['Roles · Viewer, Editor', 'Actions · Read, Update', 'Scope · Own tenant, Other tenant'];
  return (
    <>
      <div style={{position: 'absolute', left: 24, top: 40, fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em'}}>Your rule, made testable.</div>
      <div style={{position: 'absolute', left: 24, top: 90, right: 24, padding: '13px 18px', borderRadius: 12, background: P.panel, border: `1px solid ${P.line}`, fontSize: 14.5, color: P.dim, lineHeight: 1.4}}>
        {SENTENCES.map((s, i) => (
          <span key={i} style={{marginRight: 6, color: hl === i ? P.text : P.dim, opacity: hl >= 0 && hl !== i ? 0.4 : 1, borderBottom: `2.5px solid ${SENT_COLORS[i]}`, paddingBottom: 1, background: hl === i ? 'rgba(255,255,255,0.06)' : 'transparent'}}>
            <b style={{fontFamily: F.mono, fontSize: 11, color: SENT_COLORS[i], marginRight: 5}}>S{i + 1}</b>
            {s}
          </span>
        ))}
      </div>
      <div style={{position: 'absolute', left: 24, top: 150, display: 'flex', gap: 10}}>
        {chips.map((t, i) => (
          <span key={t} style={{fontSize: 12.5, color: P.dim, border: `1px solid ${P.line}`, borderRadius: 16, padding: '5px 12px', opacity: prog(f, c.parse + i * 5, 10)}}>
            {t}
          </span>
        ))}
        <span style={{fontSize: 12.5, color: P.warn, border: `1px dashed ${P.warn}`, borderRadius: 16, padding: '5px 12px', opacity: prog(f, c.parse + 16, 10)}}>0 assumptions · unknown wording is flagged, never guessed</span>
      </div>
      <div style={{position: 'absolute', left: 24, top: 198}}>
        <PermissionMatrix mode="expect" at={c.matrix} stagger={5} width={1008} rowH={41} showSource sourceAt={c.matrix + 30} focus={focusRows} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 62, borderTop: `1px solid ${P.line}`, background: '#0C0F0D', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', fontSize: 14, color: P.dim}}>
        <span>
          <b style={{color: P.text}}>8 checks</b> · Revision 1 of 1 · {approved > 0.5 ? <span style={{color: P.ok}}>Approved</span> : 'Ready for review'}
        </span>
        <span style={{padding: '10px 22px', borderRadius: 10, background: approved > 0.5 ? '#112a1c' : P.lime, color: approved > 0.5 ? P.ok : '#10120F', fontWeight: 600, border: approved > 0.5 ? '1px solid #245f40' : 'none'}}>{approved > 0.5 ? '✓ Approved' : 'Approve plan'}</span>
      </div>
    </>
  );
};

export const Scene04: React.FC = () => {
  const f = useCurrentFrame();
  const review = f >= c.click + 10;
  const x = prog(f, c.click + 10, 12, lin);
  const approved = f >= c.approve + 4;
  const card = prog(f, c.approve, 14);
  // wrapper-local points: 1280-space (cx, cy) maps to (cx * 0.867, 40 + cy * 0.867)
  const views: View[] = [
    {f: 0, s: 1.55, fx: 508, fy: 414, sx: 780, sy: 560},
    {f: c.typeEnd + 6, s: 1.55, fx: 508, fy: 414, sx: 780, sy: 560},
    {f: c.click + 24, s: 1.0, fx: 555, fy: 367, sx: 780, sy: 560},
    {f: c.matrix - 6, s: 1.0, fx: 555, fy: 367, sx: 780, sy: 560},
    {f: c.matrix + 30, s: 1.22, fx: 652, fy: 441, sx: 780, sy: 600},
  ];
  return (
    <CinematicScene dur={TL.scenes.s4.dur}>
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 225, top: 186, transformOrigin: '0 0', transform: viewTransform(f, views, 225, 186)}}>
          <BrowserMockup width={1110} contentW={1280} contentH={800} glow={approved ? 'rgba(213,248,121,0.12)' : undefined}>
            <StudioShell step={review ? 2 : 1} revision={review ? 'Revision 1 of 1' : 'No revision yet'} primary={review ? (approved ? 'Approved ✓' : 'Approve plan') : 'Generate checks'} primaryPulse={f >= c.click - 6 && f < c.click + 8 ? 1 : 0}>
              <div style={{position: 'absolute', inset: 0, opacity: 1 - x}}>{!review || x < 1 ? <Explain /> : null}</div>
              <div style={{position: 'absolute', inset: 0, opacity: x}}>{review ? <Review /> : null}</div>
            </StudioShell>
          </BrowserMockup>
          <Cursor path={[{f: c.typeEnd - 24, x: 960, y: 640}, {f: c.click - 3, x: 728, y: 500}]} clickAt={c.click} opacity={1 - prog(f, c.click + 12, 8, lin)} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 150, background: 'linear-gradient(180deg, #07090E 55%, transparent)', display: 'flex', justifyContent: 'center', paddingTop: 44, opacity: prog(f, c.head, 10)}}>
          {f >= c.head && <AnimatedHeadline text="WRITE THE RULE. GENERATE THE CHECKS." at={c.head} size={58} accent={{words: ['GENERATE'], color: C.lime}} />}
        </div>
        <div style={{position: 'absolute', left: 250, top: 872, width: 1060, padding: '16px 26px', borderRadius: 16, background: 'rgba(10,14,12,0.94)', border: '1.5px solid rgba(213,248,121,0.7)', boxShadow: '0 0 60px rgba(213,248,121,0.2)', opacity: card, transform: `translateY(${(1 - card) * 20}px)`, fontFamily: F.mono, fontSize: 22, color: C.text, lineHeight: 1.5}}>
          <span style={{color: C.lime, fontWeight: 700}}>✓ APPROVED</span> · Revision 1 of 1 · fingerprint c0bb4f03f99a9459
          {f >= c.bound && <div style={{fontSize: 18, color: C.dim}}>Any edit creates a new revision. The approval does not carry over.</div>}
        </div>
      </AbsoluteFill>
    </CinematicScene>
  );
};
