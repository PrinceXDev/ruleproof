import type { Execution } from '@/lib/executions';
import { EXECUTION_LABELS } from '@/constants/executions';
import { cardClass } from './Controls';

const ExecutionTrend = ({ runs }: { runs: Execution[] }) => (
  <section className={`${cardClass} p-5`} aria-label="Recent execution outcomes">
    <h3 className="text-sm font-medium">Execution history</h3>
    <p className="mt-1 text-xs text-ink-muted">Oldest to newest · each column represents one run</p>
    {!runs.length && (
      <p className="py-8 text-sm text-ink-muted">
        Run a reviewed suite to start recording history.
      </p>
    )}
    <div className="mt-6 flex h-28 items-end gap-2" role="list">
      {runs
        .slice(0, 20)
        .reverse()
        .map((run) => {
          const { evidence } = run;
          const total = (evidence?.passed ?? 0) + (evidence?.failed ?? 0) + (evidence?.errors ?? 0);
          const label = `${run.environment}, ${new Date(run.createdAt).toLocaleString()}: ${EXECUTION_LABELS[run.status]}, ${evidence?.passed ?? 0} passed, ${evidence?.failed ?? 0} failed, ${evidence?.errors ?? 0} errors`;
          return (
            <div
              key={run.id}
              role="listitem"
              aria-label={label}
              title={label}
              className="flex h-full min-w-2 max-w-10 flex-1 flex-col justify-end gap-0.5"
            >
              {total > 0 ? (
                <>
                  <div
                    className="rounded-t bg-attn"
                    style={{ height: `${((evidence?.errors ?? 0) / total) * 100}%` }}
                  />
                  <div
                    className="bg-fail"
                    style={{ height: `${((evidence?.failed ?? 0) / total) * 100}%` }}
                  />
                  <div
                    className="rounded-b bg-pass"
                    style={{ height: `${((evidence?.passed ?? 0) / total) * 100}%` }}
                  />
                </>
              ) : (
                <div className="h-2 rounded bg-ink-muted/30" />
              )}
            </div>
          );
        })}
    </div>
    <p className="mt-4 text-xs text-ink-muted">
      <span className="text-pass">Passed</span> · <span className="text-fail">Failed</span> ·{' '}
      <span className="text-attn">Errors</span> · gray: no completed checks. Partial runs show only
      recorded results.
    </p>
  </section>
);
export default ExecutionTrend;
