"use client";

import { Loader2 } from "lucide-react";
import clsx from "clsx";
import type { Plan } from "@/lib/types";

// Sticky footer with the plan status and the Approve action.
const ApproveBar = ({
  plan,
  revisionLabel,
  onApprove,
  approving,
  editingPending,
}: {
  plan: Plan;
  revisionLabel: string;
  onApprove: () => void;
  approving: boolean;
  editingPending: boolean;
}) => (
  <div
    className={clsx(
      "fixed inset-x-0 bottom-0 z-10 border-t border-border bg-panel-elevated/95 backdrop-blur transition-transform",
      "md:left-56",
    )}
  >
    <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
      <div className="text-sm text-ink-muted">
        <span className="font-mono-tnum text-ink">
          {plan.cases.length} checks
        </span>{" "}
        · {revisionLabel} ·{" "}
        {plan.approved ? (
          <span className="text-pass">Approved, ready to run</span>
        ) : (
          <span>Ready for review</span>
        )}
      </div>
      {!plan.approved && (
        <button
          type="button"
          onClick={onApprove}
          disabled={approving || editingPending}
          className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {approving && <Loader2 size={14} className="animate-spin" />}
          Approve plan
        </button>
      )}
    </div>
  </div>
);

export default ApproveBar;
