"use client";

import { useRef, useState } from "react";
import { ChevronDown, Info, Loader2 } from "lucide-react";
import clsx from "clsx";
import type { Plan, PlanCase } from "@/lib/types";
import Badge from "./Badge";
import RevisionDiff, { useRevisionDiff } from "./RevisionDiff";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useGSAP, gsap } from "@/lib/gsap";

const ROLE_LABEL: Record<string, string> = {
  viewer: "Viewer",
  editor: "Editor",
};
const ACTION_LABEL: Record<string, string> = { read: "Read", update: "Update" };
const SCOPE_LABEL: Record<string, string> = {
  own: "Own tenant",
  other: "Other tenant",
};

function PolicyBadge({ label }: { label: string }) {
  return (
    <Badge tone={label === "allow" ? "pass" : "neutral"}>
      {label === "allow" ? "Allow" : "Deny"}
    </Badge>
  );
}

export default function ReviewScreen({
  plan,
  revisionLabel,
  onEdit,
  onApprove,
  approving,
  editingPending,
  lineage,
}: {
  plan: Plan;
  lineage?: Plan[];
  revisionLabel: string;
  onEdit: (caseId: string, want: number) => void;
  onApprove: () => void;
  approving: boolean;
  editingPending: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLTableSectionElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-review-row]", {
          opacity: 0,
          y: 6,
          duration: 0.35,
          ease: "power2.out",
          stagger: 0.03,
        });
      });
      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [plan.id] },
  );

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

      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <table className="hidden w-full text-sm md:table">
          <thead>
            <tr className="border-b border-border bg-panel text-left text-xs uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Action</th>
              <th className="px-4 py-2.5 font-medium">Scope</th>
              <th className="px-4 py-2.5 font-medium">Expected</th>
              <th className="w-10 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody ref={rowsRef}>
            {plan.cases.map((c) => (
              <ReviewRow
                key={c.id}
                c={c}
                expanded={expanded === c.id}
                onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
                onEdit={onEdit}
                disabled={editingPending || approving}
              />
            ))}
          </tbody>
        </table>

        <ul className="divide-y divide-border md:hidden">
          {plan.cases.map((c) => (
            <li
              key={c.id}
              data-review-row
              className="space-y-2 bg-panel px-4 py-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">
                  {ROLE_LABEL[c.role]} · {ACTION_LABEL[c.action]}
                </span>
                <PolicyBadge label={c.expectedLabel} />
              </div>
              <div className="text-ink-muted">{SCOPE_LABEL[c.scope]}</div>
              <EditSelect
                c={c}
                onEdit={onEdit}
                disabled={editingPending || approving}
              />
            </li>
          ))}
        </ul>
      </div>

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
    </div>
  );
}

function EditSelect({
  c,
  onEdit,
  disabled,
}: {
  c: PlanCase;
  onEdit: (id: string, want: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-ink-muted">
      Expected
      <Select
        value={String(c.expectedStatus)}
        onValueChange={(value) => onEdit(c.id, Number(value))}
        disabled={disabled}
      >
        <SelectTrigger
          aria-label={`Expected outcome for ${ROLE_LABEL[c.role]} ${ACTION_LABEL[c.action]} ${SCOPE_LABEL[c.scope]}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="200">Allow</SelectItem>
          <SelectItem value="403">Deny</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function ReviewRow({
  c,
  expanded,
  onToggle,
  onEdit,
  disabled,
}: {
  c: PlanCase;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (id: string, want: number) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <tr
        data-review-row
        className="border-b border-border last:border-0 hover:bg-panel/60"
      >
        <td className="px-4 py-2.5 text-ink">{ROLE_LABEL[c.role]}</td>
        <td className="px-4 py-2.5 text-ink-muted">{ACTION_LABEL[c.action]}</td>
        <td className="px-4 py-2.5 text-ink-muted">{SCOPE_LABEL[c.scope]}</td>
        <td className="px-4 py-2.5">
          <EditSelect c={c} onEdit={onEdit} disabled={disabled} />
        </td>
        <td className="px-4 py-2.5 text-right">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label="Toggle check details"
            className="rounded p-1 text-ink-faint hover:text-ink"
          >
            <ChevronDown
              size={15}
              className={clsx("transition-transform", expanded && "rotate-180")}
            />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border bg-panel/40 last:border-0">
          <td colSpan={5} className="px-4 py-3">
            <div className="flex flex-wrap items-start gap-2 font-mono-tnum text-xs text-ink-muted">
              <Info size={13} className="mt-0.5 text-ink-faint" />
              <span>
                {c.method} /assets/{c.assetId} · identity: demo-{c.role}-a ·
                asset tenant: {c.assetOwner} · assertion: response status =={" "}
                {c.expectedStatus}
              </span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
