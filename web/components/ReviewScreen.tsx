"use client";

import { useRef } from "react";
import type { Plan } from "@/lib/types";
import useRevisionDiff from "@/hooks/useRevisionDiff";
import useStaggerReveal from "@/hooks/useStaggerReveal";
import CoveragePanel from "./CoveragePanel";
import RevisionDiff from "./RevisionDiff";
import ApproveBar from "./review/ApproveBar";
import ReviewTable from "./review/ReviewTable";

const ReviewScreen = ({
  plan,
  revisionLabel,
  onEdit,
  onApprove,
  approving,
  editingPending,
  lineage,
  onAddSentence,
}: {
  plan: Plan;
  lineage?: Plan[];
  revisionLabel: string;
  onEdit: (caseId: string, want: number) => void;
  onAddSentence: (sentence: string) => void;
  onApprove: () => void;
  approving: boolean;
  editingPending: boolean;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(rootRef, "[data-review-row]", { y: 6, duration: 0.35, stagger: 0.03 }, [plan.id]);

  const diff = useRevisionDiff(plan.parentPlanId ? plan.id : null, plan.parentPlanId);
  const revisionName = (id: string, fallback: string) => {
    const i = lineage?.findIndex((p) => p.id === id) ?? -1;
    return i >= 0 ? `Revision ${i + 1}` : fallback;
  };

  return (
    <div ref={rootRef} className="mx-auto max-w-5xl px-6 py-10 pb-28">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Your rule, made testable.
      </h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        “Allow” and “Deny” are policy expectations. “Passed” and “Failed”
        describe execution results — they appear once you run checks in Verify.
      </p>

      <div
        id="rule-summary-flip"
        className="mt-4 rounded-md border border-border bg-panel px-3.5 py-2.5 text-sm text-ink-muted"
      >
        “{plan.ruleText}”
      </div>

      {plan.parentPlanId && (
        <div className="mt-4">
          <RevisionDiff
            diff={diff.diff}
            loading={diff.loading}
            error={diff.error}
            baseLabel={revisionName(plan.parentPlanId, "Previous revision")}
            headLabel={revisionName(plan.id, "This revision")}
            compact
          />
        </div>
      )}

      <div className="mt-4">
        <CoveragePanel planId={plan.id} onAddSentence={onAddSentence} />
      </div>

      <ReviewTable
        cases={plan.cases}
        onEdit={onEdit}
        disabled={editingPending || approving}
      />

      <ApproveBar
        plan={plan}
        revisionLabel={revisionLabel}
        onApprove={onApprove}
        approving={approving}
        editingPending={editingPending}
      />
    </div>
  );
};

export default ReviewScreen;
