"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Ban, Check, CheckCircle2, Clock, Download, Loader2, Search, XCircle } from "lucide-react";
import type { Fixture, Plan, Run } from "@/lib/types";
import Badge from "./Badge";
import { useGSAP, gsap } from "@/lib/gsap";

const ROLE_LABEL: Record<string, string> = { viewer: "Viewer", editor: "Editor" };
const ACTION_LABEL: Record<string, string> = { read: "Read", update: "Update" };
const SCOPE_LABEL: Record<string, string> = { own: "Own tenant", other: "Other tenant" };

type RowState = "queued" | "running" | "pass" | "fail" | "error" | "cancelled";

export default function VerifyScreen({
  plan,
  run,
  running,
  cancelled,
  fixture,
  onRun,
  onCancel,
  onSelectResult,
  selectedId,
  onExport,
}: {
  plan: Plan;
  run: Run | null;
  running: boolean;
  cancelled: boolean;
  fixture: Fixture;
  onRun: () => void;
  onCancel: () => void;
  onSelectResult: (caseId: string) => void;
  selectedId: string | null;
  onExport: () => Promise<void>;
}) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await onExport();
      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } finally {
      setExporting(false);
    }
  }

  const rootRef = useRef<HTMLDivElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-verify-reveal]", { opacity: 0, y: 8, duration: 0.4, ease: "power2.out", stagger: 0.04 });
      });
      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [plan.id] }
  );

  const rowsCtx = useGSAP({ scope: rootRef });
  const prevRunId = useRef<string | null>(null);
  const prevPlanId = useRef(plan.id);
  // By-case verdict from whichever run was last shown — including one
  // loaded from a different fixture's cache — so toggling fixtures and
  // comparing broken vs. corrected animates exactly the rows that changed,
  // not the whole matrix.
  const prevVerdicts = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    if (plan.id !== prevPlanId.current) {
      prevPlanId.current = plan.id;
      prevVerdicts.current = null; // a different plan makes the old comparison meaningless
    }
  }, [plan.id]);

  useEffect(() => {
    if (!run || run.id === prevRunId.current) return;
    prevRunId.current = run.id;

    const prior = prevVerdicts.current;
    rowsCtx.contextSafe(() => {
      for (const r of run.results) {
        const changed = prior ? prior.get(r.id) !== r.verdict : r.verdict === "fail";
        if (!changed) continue;
        const flash = r.verdict === "pass" ? "rgba(120,220,170,0.22)" : "rgba(255,142,134,0.18)";
        gsap.fromTo(
          `[data-result-row="${r.id}"]`,
          { backgroundColor: flash },
          { backgroundColor: "rgba(0,0,0,0)", duration: 1.1, ease: "power1.out" }
        );
      }
    })();

    prevVerdicts.current = new Map(run.results.map((r) => [r.id, r.verdict]));

    if (announceRef.current) {
      announceRef.current.textContent = `Run complete: ${run.passCount} passed, ${run.failCount} failed.`;
    }
  }, [run, rowsCtx]);

  function stateFor(caseId: string): RowState {
    if (running) return "running";
    if (!run) return cancelled ? "cancelled" : "queued";
    const r = run.results.find((x) => x.id === caseId);
    if (!r) return "queued";
    if (r.verdict === "pass") return "pass";
    if (r.verdict === "fail") return "fail";
    return "error";
  }

  return (
    <div ref={rootRef} className="mx-auto max-w-5xl px-6 py-10">
      <div aria-live="polite" className="sr-only" ref={announceRef} />

      <h1 className="text-2xl font-semibold tracking-tight text-ink">Does the API follow the rule?</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Running the approved plan against the <span className="text-ink">{fixture === "broken" ? "seeded-defect" : "corrected"}</span> fixture.
      </p>

      <div data-verify-reveal className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-panel px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          {run ? (
            <>
              <span className="flex items-center gap-1.5 text-pass">
                <CheckCircle2 size={15} /> <span className="font-mono-tnum">{run.passCount}</span> passed
              </span>
              <span className="flex items-center gap-1.5 text-fail">
                <XCircle size={15} /> <span className="font-mono-tnum">{run.failCount}</span> failed
              </span>
              {run.errorCount > 0 && (
                <span className="flex items-center gap-1.5 text-attn">
                  <Ban size={15} /> <span className="font-mono-tnum">{run.errorCount}</span> error
                </span>
              )}
            </>
          ) : (
            <span className="text-ink-muted">{running ? "Running checks…" : "Not yet run"}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {run && !running && (
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-ink-muted hover:text-ink disabled:opacity-50"
            >
              {exported ? <Check size={14} className="text-pass" /> : <Download size={14} />}
              {exported ? "Exported" : "Export JSON"}
            </button>
          )}
          {running ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-border px-3.5 py-1.5 text-sm text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={onRun}
              className="flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-1.5 text-sm font-medium text-brand-ink hover:opacity-90"
            >
              {run ? "Run again" : "Run checks"}
            </button>
          )}
        </div>
      </div>

      {run && (
        <p className="mt-2 text-sm text-ink-muted" data-verify-reveal>
          {fixture === "broken"
            ? run.failCount > 0
              ? "Cross-tenant read returned asset data when access should have been denied."
              : "No failures observed this run."
            : "Cross-tenant read now returns 403. All approved checks passed."}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <table className="hidden w-full text-sm md:table">
          <thead>
            <tr className="border-b border-border bg-panel text-left text-xs uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Action</th>
              <th className="px-4 py-2.5 font-medium">Scope</th>
              <th className="px-4 py-2.5 font-medium">Expected</th>
              <th className="px-4 py-2.5 font-medium">Result</th>
              <th className="w-28 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {plan.cases.map((c) => {
              const state = stateFor(c.id);
              const result = run?.results.find((r) => r.id === c.id);
              return (
                <tr
                  key={c.id}
                  data-result-row={c.id}
                  className={clsx(
                    "border-b border-border last:border-0",
                    state === "fail" && "border-l-2 border-l-fail",
                    selectedId === c.id && "bg-panel-elevated"
                  )}
                >
                  <td className="px-4 py-2.5 text-ink">{ROLE_LABEL[c.role]}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{ACTION_LABEL[c.action]}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{SCOPE_LABEL[c.scope]}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{c.expectedLabel === "allow" ? "Allow" : "Deny"}</td>
                  <td className="px-4 py-2.5">
                    <ResultBadge state={state} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {state === "fail" && result && (
                      <button
                        type="button"
                        onClick={() => onSelectResult(c.id)}
                        className="flex items-center gap-1 rounded-md border border-fail/30 bg-fail/5 px-2.5 py-1 text-xs font-medium text-fail hover:bg-fail/10"
                      >
                        <Search size={12} />
                        Inspect
                      </button>
                    )}
                    {state !== "fail" && result && (
                      <button
                        type="button"
                        onClick={() => onSelectResult(c.id)}
                        className="text-xs text-ink-faint hover:text-ink"
                      >
                        Details
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <ul className="divide-y divide-border md:hidden">
          {plan.cases.map((c) => {
            const state = stateFor(c.id);
            const result = run?.results.find((r) => r.id === c.id);
            return (
              <li
                key={c.id}
                className={clsx("space-y-1.5 bg-panel px-4 py-3 text-sm", state === "fail" && "border-l-2 border-l-fail")}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">
                    {ROLE_LABEL[c.role]} · {ACTION_LABEL[c.action]}
                  </span>
                  <ResultBadge state={state} />
                </div>
                <div className="text-ink-muted">
                  {SCOPE_LABEL[c.scope]} · expected {c.expectedLabel === "allow" ? "Allow" : "Deny"}
                </div>
                {result && (
                  <button
                    type="button"
                    onClick={() => onSelectResult(c.id)}
                    className="text-xs font-medium text-brand underline-offset-2 hover:underline"
                  >
                    {state === "fail" ? "Inspect evidence" : "View details"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ResultBadge({ state }: { state: RowState }) {
  switch (state) {
    case "queued":
      return (
        <Badge tone="neutral">
          <Clock size={11} /> Queued
        </Badge>
      );
    case "running":
      return (
        <Badge tone="neutral">
          <Loader2 size={11} className="animate-spin" /> Running
        </Badge>
      );
    case "pass":
      return (
        <Badge tone="pass">
          <CheckCircle2 size={11} /> Passed
        </Badge>
      );
    case "fail":
      return (
        <Badge tone="fail">
          <XCircle size={11} /> Failed
        </Badge>
      );
    case "error":
      return (
        <Badge tone="attn">
          <Ban size={11} /> Error
        </Badge>
      );
    case "cancelled":
      return <Badge tone="neutral">Cancelled</Badge>;
  }
}
