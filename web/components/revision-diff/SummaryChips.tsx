import { ShieldOff } from 'lucide-react';
import type { PlanDiff } from '@/lib/types';
import Chip from './Chip';

// One-glance summary of what changed between the two revisions.
const SummaryChips = ({ diff, changed }: { diff: PlanDiff; changed: number }) => (
  <div className="flex flex-wrap gap-1.5 sm:ml-auto">
    {!diff.planChanged && <Chip>No changes</Chip>}
    {diff.textChanged && <Chip tone="brand">Wording changed</Chip>}
    {changed > 0 && (
      <Chip tone="attn">
        {changed} expectation{changed === 1 ? '' : 's'} changed
      </Chip>
    )}
    {diff.cases.length - changed > 0 && (
      <Chip tone="attn">{diff.cases.length - changed} cases added/removed</Chip>
    )}
    {diff.planChanged && <Chip>{diff.unchangedCases} unchanged</Chip>}
    {diff.approvalReset && (
      <Chip tone="fail">
        <ShieldOff size={11} /> Approval reset
      </Chip>
    )}
  </div>
);

export default SummaryChips;
