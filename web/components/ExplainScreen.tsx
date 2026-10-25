"use client";

import { AlertTriangle, Eye, Mic, Pencil, Sparkles } from "lucide-react";
import { useRef } from "react";
import type { Concept } from "@/lib/types";
import { useGSAP, gsap } from "@/lib/gsap";

const SAMPLE_RULE =
  "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets.";

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
    <div ref={rootRef} className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[1fr_280px]">
      <div data-explain-reveal>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">What should your API allow?</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Describe who can do what. Review the checks before anything runs.
        </p>

        <div id="rule-summary-flip" className="mt-6">
          <label htmlFor="rule-input" className="mb-2 block text-xs font-medium text-ink-muted">
            Access rule
          </label>
          <textarea
            id="rule-input"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="e.g. Editors can update assets in their own tenant, but viewers cannot..."
            rows={6}
            className="w-full resize-y rounded-lg border border-border bg-panel px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-ink-faint focus:border-brand/50"
          />
          <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
            <Mic size={13} />
            Type or dictate with Wispr.
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onGenerate}
              disabled={loading || !text.trim()}
              className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles size={15} />
              {loading ? "Generating…" : hasPlan ? "Update checks" : "Generate checks"}
            </button>
            <button
              type="button"
              onClick={() => onTextChange(SAMPLE_RULE)}
              className="rounded-md border border-border px-3.5 py-2 text-sm text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
            >
              Load example
            </button>
            <button
              type="button"
              onClick={() => onTextChange("")}
              className="rounded-md border border-border px-3.5 py-2 text-sm text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
            >
              Clear
            </button>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
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

      <aside data-explain-reveal className="h-fit rounded-lg border border-border bg-panel p-4">
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
