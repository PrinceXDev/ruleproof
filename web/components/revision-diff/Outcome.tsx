import { cn } from '@/lib/cn';
import type { ExpectedLabel } from '@/lib/types';
import { OUTCOME_LABEL } from '@/constants/labels';

const Outcome = ({
  label,
  status,
  muted,
}: {
  label: ExpectedLabel;
  status?: number;
  muted?: boolean;
}) => (
  <span
    className={cn(
      'rounded-full border px-2 py-0.5',
      (() => {
        if (muted) {
          return 'border-border text-ink-faint line-through';
        }
        if (label === 'allow') {
          return 'border-pass/30 bg-pass/10 text-pass';
        }
        return 'border-attn/30 bg-attn/10 text-attn';
      })(),
    )}
  >
    {OUTCOME_LABEL[label]} {status}
  </span>
);

export default Outcome;
