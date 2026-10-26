"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { DEMO_STAGES } from "@/constants/landing-demo";

const DemoStepper = ({
  stage,
  approved,
  onSelect,
}: {
  stage: number;
  approved: boolean;
  onSelect: (stage: number) => void;
}) => (
  <ol className="grid grid-cols-3 border-b border-white/[.07]" aria-label="Sample workflow">
    {DEMO_STAGES.map((name, i) => {
      const done = i < stage || (i === 1 && approved);
      return (
        <li key={name}>
          <button
            aria-current={stage === i ? "step" : undefined}
            disabled={i === 2 && !approved}
            onClick={() => onSelect(i)}
            className={cn(
              "relative flex w-full items-center gap-2.5 px-3 py-3.5 text-left text-xs transition-colors sm:px-5 sm:text-[13px]",
              "disabled:cursor-not-allowed disabled:opacity-40",
              stage === i ? "bg-white/[.03] text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[10px]",
                stage === i
                  ? "border-brand bg-brand text-brand-ink"
                  : done
                    ? "border-pass/50 text-pass"
                    : "border-white/15",
              )}
            >
              {done && stage !== i ? <Check size={12} /> : i + 1}
            </span>
            <span className="truncate">{name}</span>
            {stage === i && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" aria-hidden />
            )}
          </button>
        </li>
      );
    })}
  </ol>
);

export default DemoStepper;
