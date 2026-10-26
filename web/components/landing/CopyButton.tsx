"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="grid size-8 place-items-center rounded-md text-ink-faint transition-colors hover:bg-white/[.06] hover:text-ink"
    >
      {copied ? <Check size={14} className="text-pass" /> : <Copy size={14} />}
    </button>
  );
}
