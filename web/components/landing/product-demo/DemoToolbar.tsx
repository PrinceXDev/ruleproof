"use client";

import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/button";
import { DEMO_EYEBROW } from "@/constants/landing-styles";

const DemoToolbar = ({ onReset }: { onReset: () => void }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-4 py-3 sm:px-5">
    <span className={cn(DEMO_EYEBROW, "flex items-center gap-2")}>
      <span className="size-1.5 animate-pulse-ring rounded-full bg-brand" />
      Interactive sample
      <span className="hidden normal-case tracking-normal text-ink-faint/70 sm:inline">
        · runs in your browser, no live requests
      </span>
    </span>
    <button onClick={onReset} className={buttonVariants({ variant: "ghost", size: "sm" })}>
      <RotateCcw size={14} /> Reset
    </button>
  </div>
);

export default DemoToolbar;
