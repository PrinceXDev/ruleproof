import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// The bordered, muted secondary button used in run and report toolbars.
const ToolbarButton = ({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type={type}
    className={cn(
      "flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-ink-muted hover:text-ink disabled:opacity-50",
      className
    )}
    {...props}
  />
);

export default ToolbarButton;
