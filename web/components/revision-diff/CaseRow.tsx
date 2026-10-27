import { ArrowRight } from 'lucide-react';
import type { CaseChange } from '@/lib/types';
import { casePath, caseTitle } from '@/lib/caseText';
import { SCOPE_LABEL } from '@/constants/labels';
import Outcome from './Outcome';

const CaseRow = ({ c }: { c: CaseChange }) => (
  <li className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-canvas/30 px-3.5 py-2.5 text-sm">
    <span className="min-w-0 flex-1">
      <span className="text-ink">{caseTitle(c)}</span>
      <span className="ml-2 text-xs text-ink-faint">
        {SCOPE_LABEL[c.scope].toLowerCase()} · {casePath(c)}
      </span>
    </span>
    <span className="flex items-center gap-2 font-mono-tnum text-xs">
      {c.fromLabel ? (
        <Outcome label={c.fromLabel} status={c.fromStatus} muted={c.change === 'changed'} />
      ) : (
        <span className="text-ink-faint">new case</span>
      )}
      <ArrowRight size={12} className="text-ink-faint" />
      {c.toLabel ? (
        <Outcome label={c.toLabel} status={c.toStatus} />
      ) : (
        <span className="text-fail">removed</span>
      )}
    </span>
  </li>
);

export default CaseRow;
