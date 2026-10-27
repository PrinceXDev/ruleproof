'use client';

import { useRef } from 'react';
import type { Fixture, Plan, Run } from '@/lib/types';
import { FIXTURE_LABEL } from '@/constants/fixtures';
import { runSummary } from '@/lib/runSummary';
import { useGSAP, gsap } from '@/lib/gsap';
import { useRunFlash } from '@/hooks/useRunFlash';
import type { RowState } from './evidence/StatusBadges';
import RunToolbar from './verify/RunToolbar';
import ResultsTable from './verify/ResultsTable';
import BypassSection from './verify/BypassSection';
import CiHint from './verify/CiHint';

const VerifyScreen = ({
  plan,
  run,
  running,
  cancelled,
  fixture,
  bypass,
  onBypassChange,
  onRun,
  onCancel,
  onSelectResult,
  selectedId,
  onExport,
}: {
  plan: Plan;
  run: Run | null;
  running: boolean;
  cancelled: boolean;
  fixture: Fixture;
  bypass: boolean;
  onBypassChange: (on: boolean) => void;
  onRun: () => void;
  onCancel: () => void;
  onSelectResult: (caseId: string) => void;
  selectedId: string | null;
  onExport: () => Promise<void>;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const announceRef = useRunFlash(rootRef, plan, run);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-verify-reveal]', {
          opacity: 0,
          y: 8,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.04,
        });
      });
      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [plan.id] },
  );

  const stateFor = (caseId: string): RowState => {
    if (running) return 'running';
    if (!run) return cancelled ? 'cancelled' : 'queued';
    return run.results.find((x) => x.id === caseId)?.verdict ?? 'queued';
  };

  return (
    <div ref={rootRef} className="mx-auto max-w-5xl px-6 py-10">
      <div aria-live="polite" className="sr-only" ref={announceRef} />

      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Does the API follow the rule?
      </h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Running the approved plan against the{' '}
        <span className="text-ink">{FIXTURE_LABEL[fixture].long.toLowerCase()}</span> fixture.
      </p>

      <RunToolbar
        run={run}
        running={running}
        bypass={bypass}
        onBypassChange={onBypassChange}
        onRun={onRun}
        onCancel={onCancel}
        onExport={onExport}
      />

      {run && (
        <p className="mt-2 text-sm text-ink-muted" data-verify-reveal>
          {runSummary(run, plan)}
        </p>
      )}

      <ResultsTable
        plan={plan}
        run={run}
        stateFor={stateFor}
        onSelectResult={onSelectResult}
        selectedId={selectedId}
      />

      {run && !running && (
        <BypassSection
          run={run}
          plan={plan}
          bypassOn={bypass}
          onSelect={onSelectResult}
          selectedId={selectedId}
        />
      )}

      {run && !running && <CiHint plan={plan} bypass={bypass} />}
    </div>
  );
};

export default VerifyScreen;
