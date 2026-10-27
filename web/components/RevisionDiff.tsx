'use client';

import { ArrowRight, GitCompareArrows, Loader2, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PlanDiff } from '@/lib/types';
import AssumptionChanges from './revision-diff/AssumptionChanges';
import Block from './revision-diff/Block';
import CaseRow from './revision-diff/CaseRow';
import ConceptChanges from './revision-diff/ConceptChanges';
import SummaryChips from './revision-diff/SummaryChips';
import TextDiff from './revision-diff/TextDiff';

// Kept so existing `import { useRevisionDiff } from "./RevisionDiff"` callers work.
export { default as useRevisionDiff } from '@/hooks/useRevisionDiff';

const RevisionDiff = ({
  diff,
  loading,
  error,
  baseLabel,
  headLabel,
  compact = false,
}: {
  diff: PlanDiff | null;
  loading?: boolean;
  error?: string | null;
  baseLabel: string;
  headLabel: string;
  compact?: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-panel px-4 py-4 text-sm text-ink-muted">
        <Loader2 size={14} className="animate-spin" /> Comparing {baseLabel} with {headLabel}…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-fail/30 bg-fail/5 px-4 py-3 text-sm text-fail">
        {error}
      </div>
    );
  }
  if (!diff) return null;

  const changed = diff.cases.filter((c) => c.change === 'changed').length;
  const conceptsChanged = diff.conceptsAdded.length + diff.conceptsRemoved.length > 0;
  const assumptionsChanged = diff.assumptionsAdded.length + diff.assumptionsRemoved.length > 0;

  return (
    <section
      aria-label={`Changes from ${baseLabel} to ${headLabel}`}
      className="overflow-hidden rounded-xl border border-border bg-panel"
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-3">
        <GitCompareArrows size={16} className="text-brand" />
        <h2 className="text-sm font-medium text-ink">
          {baseLabel} <ArrowRight size={12} className="mx-0.5 inline text-ink-faint" /> {headLabel}
        </h2>
        <SummaryChips diff={diff} changed={changed} />
      </header>

      <div className={cn('space-y-5 px-4 py-4', compact && 'space-y-4')}>
        {diff.textChanged && (
          <Block title="Rule wording">
            <TextDiff ops={diff.text} />
          </Block>
        )}

        {diff.cases.length > 0 && (
          <Block title="Expectations">
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {diff.cases.map((c) => (
                <CaseRow key={c.caseId} c={c} />
              ))}
            </ul>
          </Block>
        )}

        {assumptionsChanged && (
          <Block title="Assumptions">
            <AssumptionChanges added={diff.assumptionsAdded} removed={diff.assumptionsRemoved} />
          </Block>
        )}

        {conceptsChanged && !compact && (
          <Block title="Extracted concepts">
            <ConceptChanges added={diff.conceptsAdded} removed={diff.conceptsRemoved} />
          </Block>
        )}

        {diff.approvalReset && (
          <p className="flex gap-2 text-xs leading-relaxed text-ink-faint">
            <ShieldOff size={14} className="mt-px shrink-0 text-fail/80" />
            {baseLabel} was approved, but that approval covered a different plan. Approve{' '}
            {headLabel} before it can run.
          </p>
        )}
        {!diff.planChanged && (
          <p className="text-sm text-ink-muted">These revisions test exactly the same thing.</p>
        )}
      </div>
    </section>
  );
};

export default RevisionDiff;
