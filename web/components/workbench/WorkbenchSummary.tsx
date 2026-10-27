import { ShieldCheck } from 'lucide-react';
import type { LoadedWorkbench } from './useWorkbench';

const WorkbenchSummary = ({ model }: { model: LoadedWorkbench }) => {
  const { suite, analysis, analyzing } = model;
  const assertions = suite.cases.reduce(
    (total, item) => total + (item.assertions?.length ?? 0) + Number(!!item.state),
    0,
  );
  let coverage = 'Coverage unavailable';
  if (analyzing) coverage = 'Checking coverage…';
  else if (analysis)
    coverage = `${analysis.covered}/${analysis.operations.length} operations tested`;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-muted">
      <span className="flex items-center gap-2 text-ink">
        <ShieldCheck size={15} className="text-brand" />
        {suite.cases.length} checks
      </span>
      <span>{assertions} response & state assertions</span>
      <span>{suite.identities.length} identities</span>
      <span>{coverage}</span>
      {!!analysis?.gaps && (
        <span className="text-attn">{analysis.gaps} operations need review</span>
      )}
    </div>
  );
};
export default WorkbenchSummary;
