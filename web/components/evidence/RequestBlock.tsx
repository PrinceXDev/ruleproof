import type { CheckResult, PlanCase } from '@/lib/types';

// Credentials are never captured, so the Authorization header is always shown redacted.
const RequestBlock = ({
  result,
  planCase,
  showLine = true,
}: {
  result: CheckResult;
  planCase?: PlanCase | null;
  showLine?: boolean;
}) => (
  <div className="rounded-md border border-border bg-panel-elevated px-3 py-2 font-mono-tnum text-xs text-ink-muted">
    {showLine && (
      <div className="break-all text-ink">
        {result.method} {result.path}
      </div>
    )}
    <div>Authorization: Bearer ••••••••</div>
    <div>Accept: application/json</div>
    {Object.entries(result.headers ?? {}).map(([k, v]) => (
      <div key={k} className="text-ink">
        {k}: {v}
      </div>
    ))}
    {showLine && planCase && (
      <div className="mt-1 text-ink-faint">
        # as demo-{planCase.role}-a (tenant A), asset owned by tenant {planCase.assetOwner}
      </div>
    )}
  </div>
);

export default RequestBlock;
