'use client';

import { RefreshCw, ShieldCheck } from 'lucide-react';
import useExecutions from '@/hooks/workbench/useExecutions';
import { executionSummary, findRegressions } from '@/lib/executions';
import type { Session } from '@/lib/workbench';
import { Button, cardClass } from './Controls';
import ExecutionTrend from './ExecutionTrend';
import ExecutionCard from './ExecutionCard';

const Executions = ({ token, session }: { token: string; session: Session }) => {
  const { runs, loading, error, refresh, update } = useExecutions(token);
  const summary = executionSummary(runs);
  const regression = findRegressions(runs);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck size={20} className="text-brand" />
            Execution control
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Latest 50 workspace runs plus unresolved executions · refreshes automatically
          </p>
        </div>
        <Button onClick={refresh}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-fail/30 p-3 text-sm text-fail">
          Live updates unavailable. Displayed results may be stale. {error}
        </p>
      )}
      {loading && (
        <p role="status" className="text-sm text-ink-muted">
          Loading recorded executions…
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Object.entries(summary).map(([label, value]) => (
          <div key={label} className={`${cardClass} p-5`}>
            <p className="text-xs capitalize text-ink-muted">
              {label === 'recovery' ? 'Awaiting recovery' : label}
            </p>
            <p className="mt-2 font-mono text-3xl">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <ExecutionTrend runs={runs} />
        <section className={`${cardClass} p-5`}>
          <h3 className="text-sm font-medium">Regression watch</h3>
          <p className="mt-4 font-mono text-3xl">{regression?.cases.length ?? '—'}</p>
          <p className="mt-3 text-sm text-ink-muted">
            {regression
              ? 'Previously passing checks that now fail. Compared against the latest earlier run of the same suite, environment, and recorded data version.'
              : 'Requires two completed runs of the same contract and environment, with a matching recorded data version.'}
          </p>
          {regression && (
            <p className="mt-3 text-xs text-ink-muted">
              {regression.previous.id.slice(0, 8)} → {regression.latest.id.slice(0, 8)}
            </p>
          )}
          {regression?.cases.map((result) => (
            <p key={result.id} className="mt-2 break-all font-mono text-xs text-fail">
              {result.id}
            </p>
          ))}
        </section>
      </div>
      {runs.map((run) => (
        <ExecutionCard key={run.id} run={run} token={token} session={session} update={update} />
      ))}
    </div>
  );
};
export default Executions;
