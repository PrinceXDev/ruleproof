import type { Evidence } from './workbench';
import type { CheckResult } from './types';

type ExecutionEvidence = Pick<
  Evidence,
  'suiteHash' | 'dataVersion' | 'passed' | 'failed' | 'errors'
> & {
  results: Pick<CheckResult, 'id' | 'verdict'>[];
};

export interface Execution {
  id: string;
  revisionId: string;
  environment: string;
  actor: string;
  status: 'running' | 'cancelling' | 'completed' | 'cancelled' | 'interrupted';
  currentCase: string;
  evidence: ExecutionEvidence | null;
  createdAt: string;
  deadline: number;
  recoveryRequired: boolean;
  recoveryAvailable: boolean;
}

export type ExecutionDetail = Omit<Execution, 'evidence'> & { evidence: Evidence | null };

export const executionSummary = (runs: Execution[]) => ({
  completed: runs.filter((run) => run.status === 'completed').length,
  active: runs.filter((run) => ['running', 'cancelling'].includes(run.status)).length,
  recovery: runs.filter(
    (run) => run.recoveryRequired && !['running', 'cancelling'].includes(run.status),
  ).length,
  failing: runs.filter((run) => run.status === 'completed' && (run.evidence?.failed ?? 0) > 0)
    .length,
});

// Compare only an identical reviewed contract and data snapshot. A changed suite
// or dataset cannot establish a regression in the target's implementation.
export const findRegressions = (runs: Execution[]) => {
  const completed = runs.filter((run) => run.status === 'completed' && run.evidence);
  const latest = completed[0];
  if (!latest?.evidence?.dataVersion) return null;
  const previous = completed
    .slice(1)
    .find(
      (run) =>
        run.environment === latest.environment &&
        run.evidence?.suiteHash === latest.evidence?.suiteHash &&
        run.evidence?.dataVersion === latest.evidence?.dataVersion,
    );
  if (!previous?.evidence) return null;
  const passed = new Set(
    previous.evidence.results
      .filter((result) => result.verdict === 'pass')
      .map((result) => result.id),
  );
  return {
    latest,
    previous,
    cases: latest.evidence.results.filter(
      (result) => result.verdict === 'fail' && passed.has(result.id),
    ),
  };
};
