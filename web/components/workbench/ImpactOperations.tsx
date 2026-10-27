'use client';

import { useState } from 'react';
import { IMPACT_CERTAINTY_LABELS, IMPACT_FILTERS, IMPACT_PAGE_SIZE } from '@/constants/impact';
import type { ImpactOperation } from '@/lib/impact';
import { Button, Pill, cardClass } from './Controls';

const ImpactOperations = ({ operations }: { operations: ImpactOperation[] }) => {
  const [filter, setFilter] = useState('changes');
  const [limit, setLimit] = useState(IMPACT_PAGE_SIZE);
  const filtered = operations.filter((operation) => {
    if (filter === 'all') return true;
    if (filter === 'unaffected') return operation.certainty === 'unaffected';
    return operation.certainty !== 'unaffected';
  });
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium">Operation impact</h3>
        <div className="flex flex-wrap gap-2" aria-label="Filter impact operations">
          {IMPACT_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => {
                setFilter(item.value);
                setLimit(IMPACT_PAGE_SIZE);
              }}
              className={`rounded-lg border px-3 py-2 text-xs ${filter === item.value ? 'border-brand text-brand' : 'border-border text-ink-muted'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {!filtered.length && (
        <p className={`${cardClass} p-5 text-sm text-ink-muted`}>
          No operations match this filter. Specification equality does not establish runtime safety.
        </p>
      )}
      {filtered.slice(0, limit).map((operation) => (
        <details key={operation.operation} className={`${cardClass} p-5`}>
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
            <code className="break-all text-sm">{operation.operation}</code>
            <div className="flex items-center gap-2">
              <Pill>{operation.change}</Pill>
              <Pill tone={operation.certainty === 'uncertain' ? 'warning' : 'neutral'}>
                {IMPACT_CERTAINTY_LABELS[operation.certainty]}
              </Pill>
            </div>
          </summary>
          <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
            {operation.reasons.map((reason) => (
              <p key={reason} className="break-words text-ink-muted">
                {reason}
              </p>
            ))}
            <p className="text-xs">
              Related checks, including state observers: {operation.checkIds.join(', ') || 'None'}
            </p>
            {operation.missingCount > 0 && (
              <div className="space-y-2">
                <Pill tone="warning">{operation.missingCount} identity × scope gaps</Pill>
                <p className="text-xs text-ink-muted">
                  {operation.missing.join(', ')}
                  {operation.missingCount > operation.missing.length && ' · first 32 shown'}
                </p>
              </div>
            )}
            {operation.exclusion && (
              <p className="rounded-lg bg-attn/5 p-3 text-xs text-attn">
                Exclusion requires review if affected: {operation.exclusion}
              </p>
            )}
          </div>
        </details>
      ))}
      {filtered.length > limit && (
        <Button onClick={() => setLimit((value) => value + IMPACT_PAGE_SIZE)}>
          Show more ({filtered.length - limit} remaining)
        </Button>
      )}
    </section>
  );
};
export default ImpactOperations;
