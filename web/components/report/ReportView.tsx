'use client';

import { useEffect } from 'react';
import clsx from 'clsx';
import { CheckCircle2, DoorOpen, ShieldAlert } from 'lucide-react';
import { runSummary } from '@/lib/runSummary';
import type { Report } from '@/hooks/useReport';
import RunCounts from '../evidence/RunCounts';
import HeldAttempts from '../evidence/HeldAttempts';
import ReportHeader from './ReportHeader';
import ReportFacts from './ReportFacts';
import IntegrityNote from './IntegrityNote';
import ReportCheckRow from './ReportCheckRow';

const ReportView = ({ report }: { report: Report }) => {
  const { run, plan, revision } = report;
  const casesById = new Map(plan.cases.map((c) => [c.id, c]));
  const leakedVariants = run.variants.filter((v) => v.verdict !== 'pass');
  const heldVariants = run.variants.filter((v) => v.verdict === 'pass');
  const allPassed = run.failCount + run.errorCount === 0 && (run.bypass?.leaked ?? 0) === 0;

  // Collapsed evidence wouldn't print; open every section first.
  useEffect(() => {
    const openAll = () =>
      document.querySelectorAll('details').forEach((d) => {
        d.setAttribute('open', '');
      });
    window.addEventListener('beforeprint', openAll);
    return () => window.removeEventListener('beforeprint', openAll);
  }, []);

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <ReportHeader />
      <blockquote className="mt-5 rounded-lg border border-border bg-panel px-4 py-3 text-ink">
        “{plan.ruleText}”
      </blockquote>
      <ReportFacts run={run} revision={revision} />
      <IntegrityNote plan={plan} run={run} />

      <section className="mt-6">
        <div
          className={clsx(
            'flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border px-4 py-3 text-sm',
            allPassed ? 'border-pass/30' : 'border-fail/30',
          )}
        >
          <RunCounts run={run} longBypass />
        </div>
        <p className="mt-2 text-sm text-ink-muted">{runSummary(run, plan)}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-ink">Approved checks</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Open any check to see the exact request and the response it got.
        </p>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border">
          {run.results.map((r) => (
            <ReportCheckRow key={r.id} result={r} planCase={casesById.get(r.id)} />
          ))}
        </ul>
      </section>

      {run.bypass && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
            <DoorOpen size={16} className={run.bypass.leaked > 0 ? 'text-fail' : 'text-brand'} />{' '}
            Bypass attempts
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Every check that expects a deny, sent again in shapes that often slip past an access
            check. A refusal holds; any 2xx is a leak. Catalog {run.bypass.catalog}.
          </p>
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            {leakedVariants.length > 0 ? (
              <ul className="divide-y divide-border">
                {leakedVariants.map((r) => (
                  <ReportCheckRow key={r.id} result={r} planCase={casesById.get(r.variant!.of)} />
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 bg-panel px-4 py-3 text-sm text-pass">
                <CheckCircle2 size={15} /> All {heldVariants.length} attempts were refused.
              </p>
            )}
            <HeldAttempts count={heldVariants.length}>
              {heldVariants.map((r) => (
                <ReportCheckRow key={r.id} result={r} planCase={casesById.get(r.variant!.of)} />
              ))}
            </HeldAttempts>
          </div>
        </section>
      )}

      <p className="mt-10 flex items-start gap-2 border-t border-border pt-4 text-xs leading-relaxed text-ink-faint">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" />A passing result means the approved
        scenarios passed. It does not prove the whole application is secure. Credentials are never
        captured; the Authorization header is shown redacted.
      </p>
    </article>
  );
};

export default ReportView;
