import type { Plan, Run } from './types';

// One-line verdict for a run. Names the actions that actually leaked, so a
// plan that also tests export doesn't report every failure as a "read".
export const runSummary = (run: Run, plan: Plan): string => {
  const leaked = run.bypass?.leaked ?? 0;
  if (run.failCount + run.errorCount === 0) {
    if (leaked > 0) {
      return `All approved checks passed, but ${leaked} bypass ${leaked === 1 ? 'attempt' : 'attempts'} got through. The fix only covers the exact requests.`;
    }
    return run.bypass
      ? `Cross-tenant access returns 403. All approved checks passed, and all ${run.variants.length} bypass attempts were refused.`
      : 'Cross-tenant access returns 403. All approved checks passed.';
  }
  const byId = new Map(plan.cases.map((c) => [c.id, c]));
  const leakedActions = new Set<string>();
  run.results.forEach((r) => {
    const c = byId.get(r.id);
    if (r.verdict === 'fail' && c?.scope === 'other' && r.actual_status === 200)
      leakedActions.add(c.action);
  });
  if (leakedActions.size === 0)
    return `${run.failCount + run.errorCount} checks did not match the approved expectations.`;
  const actions = [...leakedActions].join(' and ');
  return `Cross-tenant ${actions} returned asset data when access should have been denied.`;
};
