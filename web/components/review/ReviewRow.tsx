"use client";

import { ChevronDown, Info } from "lucide-react";
import clsx from "clsx";
import type { PlanCase } from "@/lib/types";
import { casePath } from "@/lib/caseText";
import { ACTION_LABEL, ROLE_LABEL, SCOPE_LABEL } from "@/constants/labels";
import EditSelect from "./EditSelect";

const ReviewRow = ({
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
}) => (
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
              {casePath(c)} · identity: demo-{c.role}-a ·
              asset tenant: {c.assetOwner} · assertion: response status =={" "}
              {c.expectedStatus}
            </span>
          </div>
        </td>
      </tr>
    )}
  </>
);

export default ReviewRow;
