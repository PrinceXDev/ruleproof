'use client';

import { Download } from 'lucide-react';
import { IMPACT_METRICS } from '@/constants/impact';
import { impactCounts, type ImpactReport } from '@/lib/impact';
import { downloadJSON } from '@/lib/workbench';
import ImpactOperations from './ImpactOperations';
import ImpactRecommendations from './ImpactRecommendations';
import { Button, Pill, cardClass } from './Controls';

interface Props {
  report: ImpactReport;
  filename: string;
}

const ImpactResults = ({ report, filename }: Props) => {
  const counts = impactCounts(report);

  return (
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
        {IMPACT_METRICS.map(({ key, label }) => (
          <div key={key} className={`${cardClass} p-5`}>
            <p className="text-xs capitalize text-ink-muted">{label}</p>
            <p className="mt-2 font-mono text-3xl">{counts[key]}</p>
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
  );
};
export default ImpactResults;
