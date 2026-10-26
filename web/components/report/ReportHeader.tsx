"use client";

import { Printer } from "lucide-react";
import CopyButton from "../landing/CopyButton";
import ToolbarButton from "../ui/ToolbarButton";

const ReportHeader = () => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">Evidence report</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Does the API follow the rule?</h1>
    </div>
    <div className="flex items-center gap-2 print:hidden">
      <div className="flex items-center gap-1 rounded-md border border-border pl-3 text-sm text-ink-muted">
        Copy link <CopyButton text={typeof window === "undefined" ? "" : window.location.href} />
      </div>
      <ToolbarButton onClick={() => window.print()}>
        <Printer size={14} /> Print / PDF
      </ToolbarButton>
    </div>
  </div>
);

export default ReportHeader;
