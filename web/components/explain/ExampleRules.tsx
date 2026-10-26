"use client";

import { EXAMPLE_RULES } from "@/constants/rules";

const ExampleRules = ({ text, onTextChange }: { text: string; onTextChange: (t: string) => void }) => (
  <div className="mt-5">
    <p className="mb-2 text-xs text-ink-faint">Try an example</p>
    <div className="flex flex-wrap gap-2">
      {EXAMPLE_RULES.map((ex) => (
        <button
          key={ex.label}
          type="button"
          onClick={() => onTextChange(ex.text)}
          aria-pressed={text === ex.text}
          className="group rounded-lg border border-border bg-panel px-3 py-2 text-left transition-colors hover:border-ink-faint aria-pressed:border-brand/50 aria-pressed:bg-brand/[.06]"
        >
          <span className="block text-[13px] text-ink">{ex.label}</span>
          <span className="block text-[11px] text-ink-faint">{ex.hint}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => onTextChange("")}
        className="rounded-lg px-3 py-2 text-[13px] text-ink-faint transition-colors hover:text-ink"
      >
        Clear
      </button>
    </div>
  </div>
);

export default ExampleRules;
