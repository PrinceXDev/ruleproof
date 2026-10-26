"use client";

import type { ReactNode } from "react";
import { Loader2, Mic, Sparkles } from "lucide-react";
import { buttonVariants } from "../ui/button";

const wordCount = (t: string) => t.trim() ? t.trim().split(/\s+/).length : 0;
const sentenceCount = (t: string) => t.split(/[.!?]+/).filter((s) => s.trim()).length;

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded border border-border bg-panel-elevated px-1.5 py-0.5 font-mono">{children}</kbd>
);

const RuleInput = ({
  text,
  onTextChange,
  onGenerate,
  loading,
  hasPlan,
}: {
  text: string;
  onTextChange: (t: string) => void;
  onGenerate: () => void;
  loading: boolean;
  hasPlan: boolean;
}) => (
  <div className="overflow-hidden rounded-xl border border-border bg-panel shadow-[0_20px_60px_-30px_rgba(0,0,0,.8)] transition-colors focus-within:border-brand/50">
    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
      <label htmlFor="rule-input" className="text-xs font-medium text-ink-muted">
        Access rule
      </label>
      <span className="font-mono-tnum text-[11px] text-ink-faint">
        {wordCount(text)} words · {sentenceCount(text)} sentences
      </span>
    </div>
    <textarea
      id="rule-input"
      value={text}
      onChange={(e) => onTextChange(e.target.value)}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && text.trim() && !loading) onGenerate();
      }}
      placeholder="e.g. Editors can update assets in their own tenant, but viewers cannot..."
      rows={5}
      className="block w-full resize-y bg-transparent px-4 py-4 text-base leading-relaxed text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none"
    />
    <div className="flex flex-wrap items-center gap-2 border-t border-border bg-canvas/40 px-3 py-2.5">
      <span className="flex items-center gap-1.5 px-1 text-xs text-ink-faint">
        <Mic size={13} className="text-brand" />
        Dictate with Wispr Flow, or type
      </span>
      <span className="ml-auto hidden items-center gap-1 text-[11px] text-ink-faint sm:flex">
        <Kbd>Ctrl</Kbd>
        <Kbd>Enter</Kbd>
      </span>
      <button
        type="button"
        onClick={onGenerate}
        disabled={loading || !text.trim()}
        className={buttonVariants({ size: "sm" })}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {loading ? "Generating…" : hasPlan ? "Update checks" : "Generate checks"}
      </button>
    </div>
  </div>
);

export default RuleInput;
