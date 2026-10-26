import clsx from "clsx";
import { Fingerprint } from "lucide-react";
import type { Plan, Run } from "@/lib/types";

// The run stores the hash it was made against; a match ties this evidence to
// exactly the revision that was approved, not a later edit of it.
const IntegrityNote = ({ plan, run }: { plan: Plan; run: Run }) => {
  const hashMatches = plan.approved && run.planHash === plan.hash;
  return (
    <div
      className={clsx(
        "mt-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        hashMatches ? "border-pass/30 bg-pass/5" : "border-attn/30 bg-attn/5"
      )}
    >
      <Fingerprint size={18} className={clsx("mt-0.5 shrink-0", hashMatches ? "text-pass" : "text-attn")} />
      <div className="min-w-0">
        <p className="text-ink">
          {hashMatches
            ? "This run was made against the approved revision, unchanged since approval."
            : "This run does not match an approved revision. Treat its results with caution."}
        </p>
        <p className="mt-0.5 break-all font-mono-tnum text-xs text-ink-faint">
          plan {plan.id} · hash {run.planHash}
          {plan.approvedAt && ` · approved ${new Date(plan.approvedAt).toLocaleString()}`}
        </p>
      </div>
    </div>
  );
};

export default IntegrityNote;
