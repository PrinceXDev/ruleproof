import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const Chip = ({ tone = "neutral", children }: { tone?: "neutral" | "brand" | "attn" | "fail"; children: ReactNode }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
      tone === "neutral" && "border-border text-ink-muted",
      tone === "brand" && "border-brand/30 bg-brand/10 text-brand",
      tone === "attn" && "border-attn/30 bg-attn/10 text-attn",
      tone === "fail" && "border-fail/30 bg-fail/10 text-fail",
    )}
  >
    {children}
  </span>
);

export default Chip;
