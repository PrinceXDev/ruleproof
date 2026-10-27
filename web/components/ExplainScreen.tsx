'use client';

import { useRef } from 'react';
import type { Concept } from '@/lib/types';
import useStaggerReveal from '@/hooks/useStaggerReveal';
import ExampleRules from './explain/ExampleRules';
import FixtureReference from './explain/FixtureReference';
import PlanInsights from './explain/PlanInsights';
import RuleInput from './explain/RuleInput';

const ExplainScreen = ({
  text,
  onTextChange,
  onGenerate,
  loading,
  concepts,
  assumptions,
  hasPlan,
  onStartOver,
}: {
  text: string;
  onTextChange: (t: string) => void;
  onGenerate: () => void;
  loading: boolean;
  concepts: Concept[] | null;
  assumptions: string[] | null;
  hasPlan: boolean;
  onStartOver: () => void;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(rootRef, '[data-explain-reveal]', { y: 10, duration: 0.5, stagger: 0.06 });

  return (
    <div
      ref={rootRef}
      className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1fr_300px]"
    >
      <div data-explain-reveal>
        <p className="font-mono text-[11px] uppercase tracking-[.2em] text-brand">
          Step 1 · Explain
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
          What should your API allow?
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-muted">
          Describe who can do what, in plain language. Nothing runs until you review and approve the
          checks.
        </p>

        <div id="rule-summary-flip" className="mt-8">
          <RuleInput
            text={text}
            onTextChange={onTextChange}
            onGenerate={onGenerate}
            loading={loading}
            hasPlan={hasPlan}
          />

          <ExampleRules text={text} onTextChange={onTextChange} />

          <p className="mt-6 text-xs leading-relaxed text-ink-faint">
            Supported scope: viewer and editor roles, read and update actions, and
            own-vs-other-tenant asset ownership. Anything outside that vocabulary is surfaced as a
            clarification rather than guessed.
          </p>

          {hasPlan && (
            <button
              type="button"
              onClick={onStartOver}
              className="mt-3 text-xs text-ink-faint underline-offset-2 hover:text-ink hover:underline"
            >
              Start a completely new rule instead
            </button>
          )}
        </div>

        {concepts?.length || assumptions?.length ? (
          <PlanInsights concepts={concepts} assumptions={assumptions} />
        ) : null}
      </div>

      <FixtureReference />
    </div>
  );
};

export default ExplainScreen;
