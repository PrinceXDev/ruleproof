"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/button";
import { SAMPLE_CASES } from "@/constants/landing-demo";
import StageHeading from "./StageHeading";

const ReviewStage = ({ approved, onApprove }: { approved: boolean; onApprove: () => void }) => (
  <div>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <StageHeading eyebrow="The plan · sample revision 1" title="Review before you run." />
      </div>
      <button className={buttonVariants()} onClick={onApprove}>
        {approved ? "View sample results" : "Approve & run sample"}
        <ArrowRight size={16} />
      </button>
    </div>
    <p className="mt-3 max-w-2xl text-sm text-ink-muted">
      These are proposed expectations, not results. Editing any of them
      in the studio creates a new revision that needs approval again.
    </p>
    <div className="mt-6 grid gap-2 sm:grid-cols-2">
      {SAMPLE_CASES.map((item, i) => (
        <div
          key={i}
          data-matrix-item
          className="flex items-center gap-4 rounded-xl border border-white/[.07] bg-white/[.02] px-4 py-3"
        >
          <span className="font-mono text-[11px] text-ink-faint">0{i + 1}</span>
          <span className="flex-1 text-sm capitalize text-ink">
            {item.role} <b className="font-semibold">{item.action}</b>
            <span className="block text-xs normal-case text-ink-faint">
              {item.scope} tenant asset
            </span>
          </span>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium",
              item.expected === 200
                ? "border-pass/30 bg-pass/10 text-pass"
                : "border-white/10 bg-white/[.04] text-ink-muted",
            )}
          >
            {item.expected === 200 ? "Allow" : "Deny"}{" "}
            <span className="font-mono-tnum">{item.expected}</span>
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default ReviewStage;
