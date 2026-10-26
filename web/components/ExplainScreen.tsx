"use client";

import { AlertTriangle, Eye, Loader2, Mic, Pencil, Sparkles } from "lucide-react";
import { useRef } from "react";
import type { Concept } from "@/lib/types";
import { useGSAP, gsap } from "@/lib/gsap";
import { buttonVariants } from "./ui/button";

const EXAMPLES = [
  {
    label: "Tenant isolation",
    hint: "The sample · 0 assumptions",
    text: "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets.",
  },
  {
    label: "Editors only",
    hint: "Needs a clarification",
    text: "Only editors can read or update assets.",
  },
  {
    label: "Read-only viewers",
    hint: "Implied denials",
    text: "Viewers have read-only access to their own tenant's assets. Editors can read and update assets in their own tenant.",
  },
];

function wordCount(t: string) {
  return t.trim() ? t.trim().split(/\s+/).length : 0;
}
function sentenceCount(t: string) {
  return t.split(/[.!?]+/).filter((s) => s.trim()).length;
}

export default function ExplainScreen({
  text,
  onTextChange,
  onGenerate,
  loading,
  concepts,
  assumptions,
  hasPlan,
  onStartOver,
}: {
  text: string;
  onTextChange: (t: string) => void;
  onGenerate: () => void;
  loading: boolean;
  concepts: Concept[] | null;
  assumptions: string[] | null;
  hasPlan: boolean;
  onStartOver: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-explain-reveal]", {
          opacity: 0,
          y: 10,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.06,
        });
      });
      return () => mm.revert();
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1fr_300px]">
      <div data-explain-reveal>
        <p className="font-mono text-[11px] uppercase tracking-[.2em] text-brand">Step 1 · Explain</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
          What should your API allow?
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-muted">
          Describe who can do what, in plain language. Nothing runs until you review and approve the checks.
        </p>

        <div id="rule-summary-flip" className="mt-8">
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
                <kbd className="rounded border border-border bg-panel-elevated px-1.5 py-0.5 font-mono">Ctrl</kbd>
                <kbd className="rounded border border-border bg-panel-elevated px-1.5 py-0.5 font-mono">Enter</kbd>
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

          <div className="mt-5">
            <p className="mb-2 text-xs text-ink-faint">Try an example</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
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

          <p className="mt-6 text-xs leading-relaxed text-ink-faint">
            Supported scope: viewer and editor roles, read and update actions, and own-vs-other-tenant asset
            ownership. Anything outside that vocabulary is surfaced as a clarification rather than guessed.
          </p>

          {hasPlan && (
            <button
              type="button"
              onClick={onStartOver}
              className="mt-3 text-xs text-ink-faint underline-offset-2 hover:text-ink hover:underline"
            >
              Start a completely new rule instead
            </button>
          )}
        </div>

        {(concepts?.length || assumptions?.length) ? (
          <div data-explain-reveal className="mt-8 space-y-4">
            {concepts && concepts.length > 0 && (
              <div>
                <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
                  Extracted concepts
                </h2>
                <ul className="space-y-1.5">
                  {concepts.map((c) => (
                    <li
                      key={c.label}
                      className="flex items-start gap-2 rounded-md border border-border bg-panel px-3 py-2 text-sm"
                    >
                      <Eye size={14} className="mt-0.5 shrink-0 text-ink-faint" />
                      <div>
                        <span className="text-ink-muted">{c.label}:</span> <span className="text-ink">{c.value}</span>
                        {c.snippet && (
                          <div className="mt-0.5 font-mono-tnum text-[11px] text-ink-faint">“{c.snippet}”</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {assumptions && assumptions.length > 0 && (
              <div>
                <h2 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-attn">
                  <AlertTriangle size={13} />
                  Clarification needed
                </h2>
                <ul className="space-y-1.5">
                  {assumptions.map((a) => (
                    <li
                      key={a}
                      className="rounded-md border border-attn/30 bg-attn/5 px-3 py-2 text-sm text-ink"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <aside data-explain-reveal className="h-fit rounded-xl border border-border bg-panel p-5 lg:mt-[104px]">
        <h2 className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-faint">
          <Pencil size={12} />
          Fixture reference
        </h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-ink-faint">Roles</dt>
            <dd className="text-ink">Viewer, Editor</dd>
          </div>
          <div>
            <dt className="text-ink-faint">Actions</dt>
            <dd className="text-ink">Read asset, Update asset</dd>
          </div>
          <div>
            <dt className="text-ink-faint">Resource scope</dt>
            <dd className="text-ink">Own tenant, Other tenant</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
