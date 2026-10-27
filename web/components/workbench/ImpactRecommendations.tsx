import type { ImpactCheck } from '@/lib/impact';
import { Pill, cardClass } from './Controls';

const ImpactRecommendations = ({
  checks,
  orphaned,
}: {
  checks: ImpactCheck[];
  orphaned: string[];
}) => (
  <section className="space-y-3">
    <h3 className="font-medium">Checks to review and rerun</h3>
    <p className="text-xs text-ink-muted">
      Scenario steps retain their saved order. Recommendations do not select a partial execution.
    </p>
    {!checks.length && (
      <p className={`${cardClass} p-5 text-sm text-ink-muted`}>
        No existing checks have a mapped specification change. Add checks for new operations and
        verify implementation changes separately.
      </p>
    )}
    {checks.map((check) => (
      <details key={check.id} className={`${cardClass} p-5`}>
        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs">{check.id}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {check.identity.label} · {check.identity.role || 'Role unspecified'} · tenant{' '}
              {check.identity.tenant || 'unspecified'} · {check.scope}
            </p>
          </div>
          <div className="flex gap-2">
            <Pill>{check.assertions} response assertions</Pill>
            {check.observesState && <Pill>State observer</Pill>}
            {orphaned.includes(check.id) && <Pill tone="warning">Route needs repair</Pill>}
          </div>
        </summary>
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {check.reasons.map((reason) => (
            <p key={reason} className="text-xs leading-relaxed text-ink-muted">
              {reason}
            </p>
          ))}
        </div>
      </details>
    ))}
  </section>
);
export default ImpactRecommendations;
