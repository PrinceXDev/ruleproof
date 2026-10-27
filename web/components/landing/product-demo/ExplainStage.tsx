'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button';
import { DEMO_PARSED, SAMPLE_RULE } from '@/constants/landing-demo';
import { DEMO_EYEBROW } from '@/constants/landing-styles';
import StageHeading from './StageHeading';

const ExplainStage = ({ onNext }: { onNext: () => void }) => (
  <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
    <div>
      <StageHeading eyebrow="The input · plain language" title="Start with who can do what." />
      <blockquote className="mt-5 rounded-xl border border-white/[.08] bg-black/25 p-5 text-lg leading-relaxed text-ink sm:text-xl">
        <span className="text-brand">“</span>
        {SAMPLE_RULE}
        <span className="text-brand">”</span>
      </blockquote>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-muted">
        The sample rule from the Evidence Studio. In the studio you type or dictate your own wording
        — RuleProof was designed around how people say rules out loud.
      </p>
      <button type="button" className={cn(buttonVariants(), 'mt-6')} onClick={onNext}>
        Generate sample checks <ArrowRight size={16} />
      </button>
    </div>
    <aside className="rounded-xl border border-white/[.08] bg-white/[.02] p-5">
      <p className={DEMO_EYEBROW}>What the parser extracts</p>
      <dl className="mt-4 divide-y divide-white/[.06] text-sm">
        {DEMO_PARSED.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2.5">
            <dt className="text-ink-faint">{k}</dt>
            <dd className="text-right text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded-lg bg-brand/[.07] p-4 font-mono text-xs text-ink-muted">
        2 roles × 2 actions × 2 scopes
        <p className="mt-1 font-sans text-2xl font-semibold text-brand">= 8 expectations</p>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        Unsupported wording is never guessed — it becomes a visible assumption you must acknowledge
        before approval.
      </p>
    </aside>
  </div>
);

export default ExplainStage;
