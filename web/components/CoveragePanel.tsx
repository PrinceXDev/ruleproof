"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileJson, Loader2, Plus, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import type { CoverageReport } from "@/lib/types";
import Badge from "./Badge";

type State = { planId: string; report: CoverageReport | null; error: string | null };

export default function CoveragePanel({
  planId,
  onAddSentence,
}: {
  planId: string;
  onAddSentence: (sentence: string) => void;
}) {
  const [state, setState] = useState<State>({ planId: "", report: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    api
      .coverage(planId, controller.signal)
      .then((report) => setState({ planId, report, error: null }))
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState({ planId, report: null, error: e instanceof Error ? e.message : "Could not load coverage." });
      });
    return () => controller.abort();
  }, [planId]);

  if (state.planId !== planId) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-panel px-4 py-4 text-sm text-ink-muted">
        <Loader2 size={14} className="animate-spin" /> Mapping your rule onto the API…
      </div>
    );
  }
  if (state.error || !state.report) {
    return <div className="rounded-xl border border-fail/30 bg-fail/5 px-4 py-3 text-sm text-fail">{state.error}</div>;
  }

  const { report } = state;
  const gaps = report.total - report.covered;

  return (
    <section aria-label="API endpoint coverage" className="overflow-hidden rounded-xl border border-border bg-panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          {gaps > 0 ? (
            <ShieldAlert size={15} className="text-attn" />
          ) : (
            <CheckCircle2 size={15} className="text-pass" />
          )}
          <span className="font-medium text-ink">
            API coverage ·{" "}
            <span className="font-mono-tnum">
              {report.covered} of {report.total}
            </span>{" "}
            endpoints
          </span>
          {gaps > 0 && <Badge tone="attn">{gaps === 1 ? "1 endpoint has no rule" : `${gaps} endpoints have no rule`}</Badge>}
        </div>
        <a
          href="/api/fixtures/openapi.json"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink"
        >
          <FileJson size={13} /> {report.specTitle}
        </a>
      </header>

      <ul className="divide-y divide-border">
        {report.operations.map((op) => (
          <li key={`${op.method} ${op.path}`} className="flex flex-col gap-2 px-4 py-3 text-sm md:flex-row md:items-start">
            <div className="flex min-w-0 items-center gap-2 md:w-72 md:shrink-0">
              <span className="w-10 font-mono-tnum text-xs text-ink-faint">{op.method}</span>
              <span className="truncate font-mono-tnum text-ink">{op.path}</span>
            </div>
            {op.covered ? (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-ink-muted">
                <Badge tone="pass">
                  {op.checks} checks
                </Badge>
                {op.snippet && <span className="min-w-0 truncate text-xs italic">“{op.snippet}”</span>}
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-ink-muted">
                  Your rule says nothing about <span className="text-attn">{op.action}</span>, so nothing tests who can
                  call it.
                </p>
                {op.supported && op.suggestion ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-border bg-panel-elevated px-2.5 py-1.5 text-xs text-ink">
                      “{op.suggestion}”
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddSentence(op.suggestion!)}
                      className="flex items-center gap-1.5 rounded-md border border-brand/40 px-2.5 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/10"
                    >
                      <Plus size={12} /> Add to rule
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-ink-faint">“{op.action}” is not in RuleProof’s vocabulary yet.</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
