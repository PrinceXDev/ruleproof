'use client';

import { useState } from 'react';
import type { PlanCase } from '@/lib/types';
import { caseTitle } from '@/lib/caseText';
import { SCOPE_LABEL } from '@/constants/labels';
import EditSelect from './EditSelect';
import PolicyBadge from './PolicyBadge';
import ReviewRow from './ReviewRow';

// Table on desktop, stacked cards on mobile; both edit the same expectations.
const ReviewTable = ({
  cases,
  onEdit,
  disabled,
}: {
  cases: PlanCase[];
  onEdit: (caseId: string, want: number) => void;
  disabled: boolean;
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border">
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-border bg-panel text-left text-xs uppercase tracking-wider text-ink-faint">
            <th className="px-4 py-2.5 font-medium">Role</th>
            <th className="px-4 py-2.5 font-medium">Action</th>
            <th className="px-4 py-2.5 font-medium">Scope</th>
            <th className="px-4 py-2.5 font-medium">Expected</th>
            <th className="w-10 px-4 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <ReviewRow
              key={c.id}
              c={c}
              expanded={expanded === c.id}
              onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
              onEdit={onEdit}
              disabled={disabled}
            />
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {cases.map((c) => (
          <li key={c.id} data-review-row className="space-y-2 bg-panel px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink">{caseTitle(c)}</span>
              <PolicyBadge label={c.expectedLabel} />
            </div>
            <div className="text-ink-muted">{SCOPE_LABEL[c.scope]}</div>
            <EditSelect c={c} onEdit={onEdit} disabled={disabled} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReviewTable;
