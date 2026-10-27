import { cn } from '@/lib/cn';
import type { PlanDiff } from '@/lib/types';

// Character offsets identify runs even when the same text appears more than once.
const TextDiff = ({ ops }: { ops: PlanDiff['text'] }) => (
  <p className="rounded-lg bg-black/25 px-3.5 py-3 text-sm leading-relaxed text-ink-muted">
    {ops.map((op, index) => {
      const offset = ops.slice(0, index).reduce((sum, part) => sum + part.text.length, 0);
      const key = `${op.op}-${offset}`;
      if (op.op === 'equal') return <span key={key}>{op.text}</span>;
      if (op.op === 'insert')
        return (
          <ins key={key} className="rounded-sm bg-pass/15 px-0.5 text-pass no-underline">
            {op.text}
          </ins>
        );
      return (
        <del
          key={key}
          className={cn(
            'rounded-sm bg-fail/10 px-0.5 text-fail/80 decoration-fail/60',
            ops[index + 1]?.op === 'insert' && 'mr-1',
          )}
        >
          {op.text}
        </del>
      );
    })}
  </p>
);
export default TextDiff;
