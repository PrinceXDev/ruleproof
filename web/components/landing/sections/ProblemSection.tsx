import { EyeOff, Lock, ShieldAlert, ShieldCheck, Terminal } from 'lucide-react';
import { cn } from '@/lib/cn';
import Kicker from '@/components/landing/Kicker';
import SectionHeading from '@/components/landing/SectionHeading';
import { PROBLEM_UI_ROWS } from '@/constants/landing';
import { LANDING_CARD, LANDING_WRAP } from '@/constants/landing-styles';

const ProblemSection = () => (
  <section className={cn(LANDING_WRAP, 'py-28 sm:py-36')}>
    <SectionHeading
      id="problem"
      kicker="The problem"
      title={
        <>
          Hidden isn’t{' '}
          <span className="text-ink-faint line-through decoration-fail/70">forbidden</span>.
        </>
      }
    >
      Broken access control is the #1 risk in the OWASP Top 10. It hides in plain sight: the button
      is gone, so everyone assumes the data is safe. The API never got the memo.
    </SectionHeading>

    <div className="mt-16 grid gap-5 lg:grid-cols-2" data-stagger>
      <div className={cn(LANDING_CARD, 'p-6 sm:p-8')}>
        <Kicker marker={<EyeOff size={14} />}>What the UI shows · viewer@tenant-A</Kicker>
        <div className="mt-6 space-y-2">
          {PROBLEM_UI_ROWS.map(({ id, name, tenant, visible }) => (
            <div
              key={id}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm',
                visible
                  ? 'border-white/[.07] bg-black/20'
                  : 'border-dashed border-white/10 text-ink-faint',
              )}
            >
              <span className="font-mono text-xs text-ink-faint">{id}</span>
              <span className={cn('flex-1', !visible && 'blur-[3px] select-none')}>{name}</span>
              {visible ? (
                <span className="text-xs text-ink-faint">{tenant}</span>
              ) : (
                <span className="flex items-center gap-1 text-xs">
                  <Lock size={12} /> No access
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-pass">
          <ShieldCheck size={16} /> Looks locked down.
        </p>
      </div>

      <div
        className={cn(
          LANDING_CARD,
          'border-fail/25 bg-[linear-gradient(180deg,rgba(255,142,134,.07),rgba(255,142,134,.01))] p-6 sm:p-8',
        )}
      >
        <Kicker marker={<Terminal size={14} />} className="text-fail/80">
          What the API does · same user
        </Kicker>
        <pre className="mt-6 overflow-x-auto rounded-xl border border-white/[.07] bg-black/50 p-5 font-mono text-[13px] leading-relaxed text-ink-muted">
          <span className="text-brand">$</span> curl -H{' '}
          <span className="text-attn">&quot;Authorization: Bearer demo-viewer-a&quot;</span> \{'\n'}
          {'    '}/assets/b1{'\n\n'}
          <span className="text-fail">HTTP/1.1 200 OK</span>
          {'\n'}
          {'{ "asset": "b1", "tenant": "B" }'}
        </pre>
        <p className="mt-6 flex items-center gap-2 text-sm text-fail">
          <ShieldAlert size={16} /> Tenant A just read Tenant B’s data.
        </p>
      </div>
    </div>
    <p className="mx-auto mt-10 max-w-2xl text-center text-pretty text-ink-muted" data-reveal>
      RuleProof makes the question explicit —{' '}
      <em className="not-italic text-ink">an identity, an action, a tenant, an expected status</em>{' '}
      — and keeps the request and response as proof when the answer is wrong.
    </p>
  </section>
);

export default ProblemSection;
