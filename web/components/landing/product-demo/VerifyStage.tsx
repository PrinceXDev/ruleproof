"use client";

import NumberFlow from "@number-flow/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import CheckList from "./CheckList";
import EvidencePanel from "./EvidencePanel";
import StageHeading from "./StageHeading";

const VerifyStage = ({
  fixed,
  selected,
  onFixedChange,
  onSelect,
}: {
  fixed: boolean;
  selected: number;
  onFixedChange: (fixed: boolean) => void;
  onSelect: (index: number) => void;
}) => (
  <div>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <StageHeading
          eyebrow="The result · approved sample plan"
          title={fixed ? "Same plan. Corrected API." : "Two reads cross the tenant boundary."}
        />
      </div>
      <div
        className="flex rounded-lg border border-white/10 bg-black/30 p-1"
        role="group"
        aria-label="Sample fixture"
      >
        {[false, true].map((v) => (
          <button
            key={String(v)}
            aria-pressed={fixed === v}
            onClick={() => onFixedChange(v)}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors",
              fixed === v
                ? v
                  ? "bg-pass/15 text-pass"
                  : "bg-fail/15 text-fail"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {v ? "Corrected" : "Seeded defect"}
          </button>
        ))}
      </div>
    </div>
    <p
      className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm"
      role="status"
    >
      <span className="text-pass">
        <NumberFlow value={fixed ? 8 : 6} className="font-semibold" /> passed
      </span>
      <span className={fixed ? "text-ink-faint" : "text-fail"}>
        <NumberFlow value={fixed ? 0 : 2} className="font-semibold" /> failed
      </span>
      <span className="text-ink-faint">Select a check to trace its evidence</span>
    </p>

    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
      <CheckList fixed={fixed} selected={selected} onSelect={onSelect} />
      <EvidencePanel fixed={fixed} selected={selected} />
    </div>
    <p className="mt-5 text-xs text-ink-faint">
      Illustrative results mirroring the bundled fixture behaviour, not a live run.{" "}
      <a href="/studio/" className="inline-flex items-center gap-1 text-brand hover:underline">
        Run real checks in the studio <ArrowRight size={12} />
      </a>
    </p>
  </div>
);

export default VerifyStage;
