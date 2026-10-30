import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicScene} from '../components/CinematicScene';
import {ImpactGraph} from '../components/ImpactGraph';
import {AnimatedHeadline} from '../components/AnimatedHeadline';
import {C, F} from '../theme';
import {CUES, TL, lin, prog} from '../lib';

const c = CUES.s7;

const CODE: {t: string; add?: boolean; ind?: number}[] = [
  {t: '"/assets/{id}": {'},
  {t: '"get": {', ind: 1},
  {t: '"operationId": "getAsset",', ind: 2},
  {t: '"security": [{ "Bearer": [] }]', ind: 2, add: true},
  {t: '}', ind: 1},
  {t: '},'},
  {t: '"/assets/search": {', add: true},
  {t: '"get": { "summary": "Search tenant assets" }', ind: 1, add: true},
  {t: '}', add: true},
];

const Rail: React.FC = () => {
  const f = useCurrentFrame();
  const steps = [['OPENAPI CHANGE', c.diff], ['AFFECTED CHECKS', c.impact], ['REVIEW PLAN', c.impact + 40]] as const;
  const ci = prog(f, c.ci - 4, 10);
  return (
    <div style={{position: 'absolute', left: 50, top: 56, display: 'flex', alignItems: 'center', gap: 18, fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: '0.1em'}}>
      {steps.map(([t, at], i) => (
        <React.Fragment key={t}>
          {i > 0 && <span style={{color: f >= at ? C.lime : C.mute}}>→</span>}
          <span style={{color: f >= at ? C.text : C.mute, borderBottom: `2px solid ${f >= at ? C.lime : 'transparent'}`, paddingBottom: 4}}>{t}</span>
        </React.Fragment>
      ))}
      <span style={{marginLeft: 26, fontSize: 15, color: ci > 0.5 ? C.lime : C.dim, border: `1px solid ${ci > 0.5 ? C.lime : C.line}`, borderRadius: 20, padding: '5px 14px'}}>{ci > 0.5 ? 'RUNTIME VERIFICATION' : 'STATIC ANALYSIS · NO REQUESTS SENT'}</span>
    </div>
  );
};

const CodePanel: React.FC = () => {
  const f = useCurrentFrame();
  const o = prog(f, c.diff, 10) * (1 - prog(f, c.impact - 6, 8, lin));
  return (
    <div style={{position: 'absolute', left: 230, top: 170, width: 1000, opacity: o, transform: `translateY(${(1 - prog(f, c.diff, 16)) * 30}px)`}}>
      <div style={{fontFamily: F.mono, fontSize: 18, color: C.dim, marginBottom: 14}}>openapi-candidate.json · candidate specification</div>
      <div style={{background: '#0A0D13', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '26px 30px', fontFamily: F.mono, fontSize: 28, lineHeight: 1.62}}>
        {CODE.map((l, i) => {
          const p = l.add ? prog(f, c.diff + 26 + (i - 3) * 6, 12) : 1;
          return (
            <div key={i} style={{display: 'flex', paddingLeft: (l.ind ?? 0) * 34, background: l.add ? `rgba(55,217,154,${0.12 * p})` : 'transparent', color: l.add ? '#9CF0CB' : C.dim, opacity: l.add ? p : 1, marginLeft: -30, paddingRight: 30, height: l.add ? 46 * p : 46, overflow: 'hidden'}}>
              <span style={{width: 30, color: l.add ? C.ok : C.mute}}>{l.add ? '+' : ' '}</span>
              {l.t}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Approval: React.FC = () => {
  const f = useCurrentFrame();
  const o = prog(f, c.invalid - 18, 14) * (1 - prog(f, c.ci - 6, 8, lin));
  const bad = prog(f, c.invalid, 10);
  return (
    <div style={{position: 'absolute', left: 330, top: 250, width: 900, opacity: o, transform: `translateY(${(1 - prog(f, c.invalid - 18, 16)) * 26}px)`}}>
      <div style={{padding: '34px 40px', borderRadius: 22, background: C.surface, border: `1.5px solid ${bad > 0.5 ? '#F2C66B' : 'rgba(55,217,154,0.5)'}`, boxShadow: bad > 0.5 ? '0 0 70px rgba(242,198,107,0.14)' : '0 0 60px rgba(55,217,154,0.12)'}}>
        <div style={{fontFamily: F.mono, fontSize: 18, letterSpacing: '0.14em', color: C.dim}}>APPROVAL · REVISION 1 OF 1</div>
        <div style={{marginTop: 16, fontFamily: F.mono, fontSize: 30, fontWeight: 700, color: C.text, textDecoration: bad > 0.5 ? 'line-through' : 'none', textDecorationColor: '#F2C66B'}}>c0bb4f03f99a9459 {bad > 0.5 ? '' : '✓'}</div>
        <div style={{marginTop: 22, fontSize: 32, fontWeight: 600, color: bad > 0.5 ? '#F2C66B' : C.ok, fontFamily: F.head, letterSpacing: '-0.01em'}}>{bad > 0.5 ? 'Contract changed. Approval does not carry over.' : 'Approved exact revision'}</div>
        <div style={{marginTop: 10, fontSize: 21, color: C.dim, opacity: bad}}>A new revision must be reviewed and approved before it can run.</div>
      </div>
    </div>
  );
};

const Pipeline: React.FC = () => {
  const f = useCurrentFrame();
  const stages = ['push', 'build', 'ruleproof-ci', 'deploy'];
  const o = prog(f, c.ci, 14);
  const failed = f >= c.fail;
  const reach = (i: number) => prog(f, c.ci + 14 + i * 14, 10);
  return (
    <div style={{position: 'absolute', left: 130, top: 190, width: 1300, opacity: o}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 0}}>
        {stages.map((s, i) => {
          const isCi = i === 2;
          const skipped = failed && i === 3;
          const bad = failed && isCi;
          const col = bad ? C.bad : skipped ? C.mute : f >= c.ci + 14 + i * 14 ? C.ok : C.mute;
          return (
            <React.Fragment key={s}>
              {i > 0 && <div style={{width: 80, height: 3, background: `linear-gradient(90deg, ${C.line}, ${col})`, opacity: 0.8}} />}
              <div style={{width: 250, padding: '22px 20px', borderRadius: 16, textAlign: 'center', background: bad ? 'rgba(255,82,99,0.1)' : C.surface, border: `1.5px solid ${col}`, boxShadow: bad ? '0 0 60px rgba(255,82,99,0.3)' : 'none', opacity: 0.4 + 0.6 * reach(i), fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: bad ? C.bad : skipped ? C.mute : C.text}}>
                {s}
                <div style={{fontSize: 14, marginTop: 8, color: col, fontWeight: 600}}>{bad ? '✕ FAILED' : skipped ? 'skipped' : f >= c.ci + 14 + i * 14 + 8 ? '✓ ok' : 'running…'}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{marginTop: 34, padding: '24px 30px', borderRadius: 16, background: '#0A0D13', border: `1px solid ${failed ? 'rgba(255,82,99,0.5)' : C.line}`, fontFamily: F.mono, fontSize: 22, lineHeight: 1.7, color: C.dim, opacity: prog(f, c.ci + 40, 12)}}>
        <div>$ ruleproof-ci -bundle approved-plan.json -bypass</div>
        {failed && (
          <>
            <div style={{color: C.bad}}>FAIL   editor read other tenant   GET  /assets/b1   want 403  got 200</div>
            <div>6 passed · 2 failed · 0 errors</div>
            <div style={{color: C.bad, fontWeight: 700}}>exit 1 · the build fails before release</div>
          </>
        )}
      </div>
    </div>
  );
};

export const Scene07: React.FC = () => {
  const f = useCurrentFrame();
  const graph = prog(f, c.impact - 4, 8, lin) * (1 - prog(f, c.invalid - 20, 10, lin));
  const note = prog(f, c.impact + 60, 14) * (1 - prog(f, c.invalid - 20, 10, lin));
  return (
    <CinematicScene dur={TL.scenes.s7.dur} tint={f >= c.fail ? 'red' : 'lime'} tintAmount={f >= c.fail ? prog(f, c.fail, 20) * 0.6 : 0.35}>
      <AbsoluteFill>
        <Rail />
        <CodePanel />
        <div style={{position: 'absolute', left: 50, top: 180, opacity: graph}}>{f >= c.impact - 4 && <ImpactGraph at={c.impact} />}</div>
        <div style={{position: 'absolute', left: 50, top: 740, width: 1460, display: 'flex', gap: 24, opacity: note}}>
          <div style={{flex: 1, padding: '18px 24px', borderRadius: 14, border: '1px solid rgba(242,198,107,0.4)', background: 'rgba(242,198,107,0.06)'}}>
            <div style={{fontFamily: F.mono, fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: '#F2C66B'}}>STATIC IMPACT ANALYSIS</div>
            <div style={{fontSize: 22, color: C.text, marginTop: 6}}>Tells you where to look.</div>
          </div>
          <div style={{flex: 1, padding: '18px 24px', borderRadius: 14, border: '1px solid rgba(213,248,121,0.45)', background: 'rgba(213,248,121,0.06)'}}>
            <div style={{fontFamily: F.mono, fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.lime}}>RUNTIME VERIFICATION</div>
            <div style={{fontSize: 22, color: C.text, marginTop: 6}}>Proves what the API actually does.</div>
          </div>
        </div>
        <Approval />
        <Pipeline />
        <div style={{position: 'absolute', left: 0, width: 1560, top: 790, display: 'flex', justifyContent: 'center'}}>
          {f >= c.title && <AnimatedHeadline text="SECURITY RULES. ENFORCED IN CI." at={c.title} size={78} accent={{words: ['CI'], color: C.lime}} />}
        </div>
      </AbsoluteFill>
    </CinematicScene>
  );
};
