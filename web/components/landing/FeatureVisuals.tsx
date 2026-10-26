import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { COVERAGE_ROWS, type FeatureVisualId } from "@/constants/landing-features";

// Small illustrative snippets rendered under some of the feature tiles.
export const FEATURE_VISUALS: Record<FeatureVisualId, ReactNode> = {
  provenance: (
    <div className="mt-6 space-y-2 rounded-xl border border-white/[.07] bg-black/30 p-4 text-sm">
      <p className="text-ink-muted">
        <mark className="rounded bg-brand/15 px-1 text-brand">Editors</mark> can also{" "}
        <mark className="rounded bg-pass/15 px-1 text-pass">update</mark> them.
      </p>
      <p className="font-mono text-[11px] text-ink-faint">
        → role: editor · action: update · source: sentence 2
      </p>
    </div>
  ),
  coverage: (
    <div className="mt-6 divide-y divide-white/[.06] rounded-xl border border-white/[.07] bg-black/30 font-mono text-[11.5px]">
      {COVERAGE_ROWS.map(([method, path, tone, note]) => (
        <div key={method + path} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
          <span className="w-9 text-ink-faint">{method}</span>
          <span className="text-ink">{path}</span>
          <span className={cn("ml-auto", tone)}>{note}</span>
        </div>
      ))}
    </div>
  ),
  revisions: (
    <div className="mt-5 flex items-center gap-2 font-mono text-[11px]">
      <span className="rounded border border-pass/30 bg-pass/10 px-2 py-1 text-pass">rev 1 ✓</span>
      <span className="h-px flex-1 bg-white/15" />
      <span className="rounded border border-attn/30 bg-attn/10 px-2 py-1 text-attn">rev 2 · needs approval</span>
    </div>
  ),
  diff: (
    <div className="mt-5 rounded-xl border border-white/[.07] bg-black/30 p-4 text-sm leading-relaxed text-ink-muted">
      Editors can <del className="rounded bg-fail/10 px-1 text-fail/80">also</del>{" "}
      <ins className="rounded bg-pass/15 px-1 text-pass no-underline">read and</ins> update them.
      <p className="mt-2 font-mono text-[11px] text-ink-faint">
        viewer · update · own <span className="line-through">deny 403</span> →{" "}
        <span className="text-pass">allow 200</span>
      </p>
    </div>
  ),
  ci: (
    <pre className="mt-5 overflow-x-auto rounded-xl border border-white/[.07] bg-black/30 p-4 font-mono text-[11.5px] leading-relaxed text-ink-muted">
      <span className="text-brand">$</span> ruleproof-ci -bundle plan.json -fixture broken{"\n"}
      {"  "}<span className="text-fail">FAIL</span> viewer read other tenant  want 403 got 200{"\n"}
      {"  "}6 passed · <span className="text-fail">2 failed</span>{"  "}
      <span className="text-ink-faint">→ exit 1</span>
    </pre>
  ),
};
