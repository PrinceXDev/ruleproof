import { cn } from "@/lib/cn";
import type { PlanDiff } from "@/lib/types";

// Word-level diff of the rule wording: insertions green, deletions struck out.
const TextDiff = ({ ops }: { ops: PlanDiff["text"] }) => (
  <p className="rounded-lg bg-black/25 px-3.5 py-3 text-sm leading-relaxed text-ink-muted">
    {ops.map((op, i) =>
      op.op === "equal" ? (
        <span key={i}>{op.text}</span>
      ) : op.op === "insert" ? (
        <ins key={i} className="rounded-sm bg-pass/15 px-0.5 text-pass no-underline">
          {op.text}
        </ins>
      ) : (
        <del
          key={i}
          className={cn(
            "rounded-sm bg-fail/10 px-0.5 text-fail/80 decoration-fail/60",
            ops[i + 1]?.op === "insert" && "mr-1",
          )}
        >
          {op.text}
        </del>
      ),
    )}
  </p>
);

export default TextDiff;
