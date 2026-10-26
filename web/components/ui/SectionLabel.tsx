import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const SectionLabel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <h3 className={cn("mb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-faint", className)}>
    {children}
  </h3>
);

export default SectionLabel;
