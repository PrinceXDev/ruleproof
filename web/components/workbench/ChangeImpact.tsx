'use client';

import { useRef } from 'react';
import { Download, GitBranch, Loader2, Upload } from 'lucide-react';
import useImpactAnalysis from '@/hooks/workbench/useImpactAnalysis';
import { impactCounts } from '@/lib/impact';
import { downloadJSON, type Revision } from '@/lib/workbench';
import ImpactOperations from './ImpactOperations';
import ImpactRecommendations from './ImpactRecommendations';
import { Button, Pill, cardClass } from './Controls';

const ChangeImpact = ({
  token,
  revision,
  dirty,
}: {
  token: string;
  revision: Revision | null;
  dirty: boolean;
}) => {
  const input = useRef<HTMLInputElement>(null);
  const { report, loading, error, filename, analyze } = useImpactAnalysis(token, revision);
  const counts = report ? impactCounts(report) : null;
  return (
    <div className="space-y-6">
      <section className={`${cardClass} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-brand">
              <GitBranch size={16} />
              Authorization impact analysis
            </p>
            <h2 className="mt-3 text-xl font-semibold">Understand what a change puts at risk.</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Compare a candidate OpenAPI document with this saved revision. Trace changed
              operations and shared dependencies to permission checks, protected-state observers,
              and complete scenarios.
            </p>
          </div>
          <Button
            primary
            disabled={!revision || dirty || loading}
            onClick={() => input.current?.click()}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}Analyze
            candidate spec
          </Button>
        </div>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          className="hidden"
          aria-label="Candidate OpenAPI JSON for impact analysis"
          onChange={(event) => {
            const { currentTarget } = event;
            void analyze(currentTarget.files?.[0]);
            currentTarget.value = '';
          }}
        />
        <p className="mt-4 text-xs text-ink-muted">
          {revision
            ? `Baseline: ${revision.suite.name} · revision ${revision.id.slice(0, 8)}`
            : 'Save a revision to establish a comparison baseline.'}
        </p>
        {dirty && (
          <p role="status" className="mt-3 text-sm text-attn">
            Save or discard your edits before analyzing the saved contract.
          </p>
        )}
        {loading && (
          <p role="status" className="mt-3 text-sm text-ink-muted">
            Tracing specification dependencies…
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-fail">
            {error}
          </p>
        )}
      </section>
      {report && !dirty && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{filename}</p>
              <p
                className="mt-1 font-mono text-xs text-ink-muted"
                title={`${report.beforeSpecHash} → ${report.afterSpecHash}`}
              >
                {report.beforeSpecHash.slice(0, 12)} → {report.afterSpecHash.slice(0, 12)}
              </p>
            </div>
            <Button onClick={() => downloadJSON('ruleproof-impact.json', report)}>
              <Download size={14} />
              Export analysis
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {counts &&
              Object.entries(counts).map(([label, value]) => (
                <div key={label} className={`${cardClass} p-5`}>
                  <p className="text-xs capitalize text-ink-muted">
                    {label === 'unchanged' ? 'Unchanged in spec' : label}
                  </p>
                  <p className="mt-2 font-mono text-3xl">{value}</p>
                </div>
              ))}
            <div className={`${cardClass} p-5`}>
              <p className="text-xs text-ink-muted">Checks to review</p>
              <p className="mt-2 font-mono text-3xl">{report.recommended.length}</p>
            </div>
          </div>
          <aside className="space-y-3 rounded-xl border border-attn/25 bg-attn/5 p-5">
            <Pill tone="warning">
              {report.requiresFullRun
                ? 'Uncertainty requires full-suite review'
                : 'Advisory report · review before execution'}
            </Pill>
            {report.warnings.map((warning) => (
              <p key={warning} className="text-xs leading-relaxed text-ink-muted">
                {warning}
              </p>
            ))}
            <p className="text-xs leading-relaxed text-ink-muted">
              Import the candidate into a new revision, repair missing routes and assertions, then
              review and approve that exact contract. This comparison sends no requests to your API.
            </p>
          </aside>
          <ImpactOperations operations={report.operations} />
          <ImpactRecommendations checks={report.recommended} orphaned={report.orphanedCheckIds} />
        </>
      )}
    </div>
  );
};
export default ChangeImpact;
