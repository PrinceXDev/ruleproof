"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { downloadJson } from "@/lib/download";

const actionClass =
  "flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-ink-muted hover:text-ink";

// Copy / download one check's evidence record.
const EvidenceActions = ({ resultId, json }: { resultId: string; json: string }) => {
  // Derived from which result's id was last copied, rather than reset via an
  // effect: it naturally reads as "not copied" the instant a different
  // result is selected, with no extra render pass.
  const [copiedForId, setCopiedForId] = useState<string | null>(null);
  const copied = copiedForId === resultId;

  const copyEvidence = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopiedForId(resultId);
    } catch {
      // clipboard may be unavailable (permissions, insecure context) — non-fatal
    }
  };

  return (
    <div className="flex items-center gap-2 border-t border-border px-5 py-3.5">
      <button type="button" onClick={copyEvidence} className={actionClass}>
        {copied ? <Check size={13} className="text-pass" /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy evidence"}
      </button>
      <button type="button" onClick={() => downloadJson(`ruleproof-evidence-${resultId}.json`, json)} className={actionClass}>
        <Download size={13} />
        Download JSON
      </button>
    </div>
  );
};

export default EvidenceActions;
