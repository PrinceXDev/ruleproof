"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Ban, Check, CheckCircle2, Clock, DoorOpen, Download, Loader2, Search, TerminalSquare, XCircle } from "lucide-react";
import type { CheckResult, Fixture, Plan, Run } from "@/lib/types";
import { FIXTURE_LABEL } from "@/lib/fixtures";
import Badge from "./Badge";
import CopyButton from "./landing/CopyButton";
import { useGSAP, gsap } from "@/lib/gsap";

const ROLE_LABEL: Record<string, string> = { viewer: "Viewer", editor: "Editor" };
const ACTION_LABEL: Record<string, string> = { read: "Read", update: "Update", export: "Export" };
const SCOPE_LABEL: Record<string, string> = { own: "Own tenant", other: "Other tenant" };

type RowState = "queued" | "running" | "pass" | "fail" | "error" | "cancelled";

export default function VerifyScreen({
  plan,
  run,
  running,
  cancelled,
  fixture,
  bypass,
  onBypassChange,
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
  bypass: boolean;
  onBypassChange: (on: boolean) => void;
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
      announceRef.current.textContent =
        `Run complete: ${run.passCount} passed, ${run.failCount} failed.` +
        (run.bypass ? ` ${run.bypass.leaked} of ${run.variants.length} bypass attempts got through.` : "");
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
        Running the approved plan against the <span className="text-ink">{FIXTURE_LABEL[fixture].long.toLowerCase()}</span> fixture.
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
              {run.bypass && (
                <span className={clsx("flex items-center gap-1.5", run.bypass.leaked > 0 ? "text-fail" : "text-ink-muted")}>
                  <DoorOpen size={15} /> <span className="font-mono-tnum">{run.bypass.leaked}</span> bypassed
                </span>
              )}
            </>
          ) : (
            <span className="text-ink-muted">{running ? "Running checks…" : "Not yet run"}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={clsx(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink-muted",
              running ? "opacity-50" : "cursor-pointer hover:text-ink"
            )}
            title="For every check that expects a deny, also try HEAD, a trailing slash, an upper-case ID, a spoofed tenant header and a method override."
          >
            <input
              type="checkbox"
              checked={bypass}
              disabled={running}
              onChange={(e) => onBypassChange(e.target.checked)}
              className="size-3.5 accent-[var(--color-brand)]"
            />
            Try bypass variants
          </label>
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
          {runSummary(run, plan)}
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

      {run && !running && (
        <BypassSection run={run} plan={plan} bypassOn={bypass} onSelect={onSelectResult} selectedId={selectedId} />
      )}

      {run && !running && <CiHint plan={plan} bypass={bypass} />}
    </div>
  );
}

// Points from a one-off run to keeping the rule enforced: the exported
// bundle is exactly what cmd/ruleproof-ci verifies and re-runs.
// Names the actions that actually leaked, so a plan that also tests export
// doesn't report every failure as a "read".
function runSummary(run: Run, plan: Plan): string {
  const leaked = run.bypass?.leaked ?? 0;
  if (run.failCount + run.errorCount === 0) {
    if (leaked > 0) {
      return `All approved checks passed, but ${leaked} bypass ${leaked === 1 ? "attempt" : "attempts"} got through. The fix only covers the exact requests.`;
    }
    return run.bypass
      ? `Cross-tenant access returns 403. All approved checks passed, and all ${run.variants.length} bypass attempts were refused.`
      : "Cross-tenant access returns 403. All approved checks passed.";
  }
  const byId = new Map(plan.cases.map((c) => [c.id, c]));
  const leakedActions = new Set<string>();
  for (const r of run.results) {
    const c = byId.get(r.id);
    if (r.verdict === "fail" && c?.scope === "other" && r.actual_status === 200) leakedActions.add(c.action);
  }
  if (leakedActions.size === 0) return `${run.failCount + run.errorCount} checks did not match the approved expectations.`;
  const actions = [...leakedActions].join(" and ");
  return `Cross-tenant ${actions} returned asset data when access should have been denied.`;
}

// Bypass attempts that got in (or were inconclusive) are listed in full; held
// ones fold away, since a healthy API refuses dozens of them.
function BypassSection({
  run,
  plan,
  bypassOn,
  onSelect,
  selectedId,
}: {
  run: Run;
  plan: Plan;
  bypassOn: boolean;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  if (!run.bypass) {
    if (!bypassOn) return null;
    return (
      <p className="mt-4 text-sm text-ink-faint" data-verify-reveal>
        This run did not try bypass variants. Run again to include them.
      </p>
    );
  }
  const byId = new Map(plan.cases.map((c) => [c.id, c]));
  const open = [
    ...run.variants.filter((v) => v.verdict === "fail"),
    ...run.variants.filter((v) => v.verdict === "error"),
  ];
  const held = run.variants.filter((v) => v.verdict === "pass");
  const { leaked, inconclusive } = run.bypass;

  const row = (r: CheckResult) => {
    const c = byId.get(r.variant!.of);
    const headers = Object.entries(r.headers ?? {});
    return (
      <li
        key={r.id}
        className={clsx(
          "flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 text-sm",
          r.verdict === "fail" && "border-l-2 border-l-fail",
          selectedId === r.id && "bg-panel-elevated"
        )}
      >
        <VariantBadge verdict={r.verdict} />
        <div className="min-w-0 flex-1">
          <div className="text-ink">
            {r.variant!.label}
            {c && (
              <span className="text-ink-muted">
                {" "}· {ROLE_LABEL[c.role]} {ACTION_LABEL[c.action].toLowerCase()}, {SCOPE_LABEL[c.scope].toLowerCase()}
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate font-mono-tnum text-xs text-ink-faint">
            {r.method} {r.path}
            {headers.map(([k, v]) => ` · ${k}: ${v}`).join("")}
            {r.actual_status ? ` → ${r.actual_status}` : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelect(r.id)}
          className={clsx(
            "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs",
            r.verdict === "fail"
              ? "border border-fail/30 bg-fail/5 font-medium text-fail hover:bg-fail/10"
              : "text-ink-faint hover:text-ink"
          )}
        >
          {r.verdict === "fail" && <Search size={12} />}
          {r.verdict === "fail" ? "Inspect" : "Details"}
        </button>
      </li>
    );
  };

  return (
    <section data-verify-reveal className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
          <DoorOpen size={16} className={leaked > 0 ? "text-fail" : "text-brand"} /> Bypass attempts
        </h2>
        <span className="font-mono-tnum text-xs text-ink-faint">
          {run.variants.length} tried · {held.length} held · {leaked} leaked
          {inconclusive > 0 && ` · ${inconclusive} inconclusive`} · catalog {run.bypass.catalog}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-ink-muted">
        Every check that expects a deny, sent again in shapes that often slip past an access check. A refusal (401,
        403, 404, 405) holds; any 2xx is a leak.
      </p>
      <div className="mt-3 overflow-hidden rounded-lg border border-border">
        {open.length > 0 ? (
          <ul className="divide-y divide-border bg-panel">{open.map(row)}</ul>
        ) : (
          <p className="flex items-center gap-2 bg-panel px-4 py-3 text-sm text-pass">
            <CheckCircle2 size={15} /> All {held.length} attempts were refused.
          </p>
        )}
        {held.length > 0 && (
          <details className="group border-t border-border">
            <summary className="cursor-pointer list-none px-4 py-2.5 text-xs text-ink-faint hover:text-ink">
              <span className="group-open:hidden">Show {held.length} held attempts</span>
              <span className="hidden group-open:inline">Hide held attempts</span>
            </summary>
            <ul className="divide-y divide-border border-t border-border">{held.map(row)}</ul>
          </details>
        )}
      </div>
    </section>
  );
}

function VariantBadge({ verdict }: { verdict: string }) {
  if (verdict === "pass")
    return (
      <Badge tone="pass">
        <CheckCircle2 size={11} /> Held
      </Badge>
    );
  if (verdict === "fail")
    return (
      <Badge tone="fail">
        <DoorOpen size={11} /> Leaked
      </Badge>
    );
  return (
    <Badge tone="attn">
      <Ban size={11} /> Inconclusive
    </Badge>
  );
}

function CiHint({ plan, bypass }: { plan: Plan; bypass: boolean }) {
  const flags = bypass ? "-fixture fixed -bypass" : "-fixture fixed";
  const commands = [
    `go run ./cmd/ruleproof-ci -bundle ruleproof-plan-${plan.id}.json ${flags}`,
    `go run ./cmd/ruleproof-ci -server http://localhost:8080 -plan ${plan.id} ${flags}`,
  ];
  return (
    <section data-verify-reveal className="mt-8 rounded-xl border border-border bg-panel p-5">
      <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
        <TerminalSquare size={16} className="text-brand" /> Keep this rule enforced in CI
      </h2>
      <p className="mt-1.5 text-sm text-ink-muted">
        Export this approved plan and run it on every push. The build fails on any mismatch, and the CLI refuses
        plans that are unapproved or were edited after approval.
      </p>
      <div className="mt-4 space-y-2">
        {commands.map((cmd) => (
          <div
            key={cmd}
            className="flex items-center gap-3 rounded-lg border border-border bg-canvas py-1 pl-3.5 pr-1 font-mono text-xs"
          >
            <span className="select-none text-brand">$</span>
            <code className="flex-1 overflow-x-auto whitespace-nowrap py-2 text-ink">{cmd}</code>
            <CopyButton text={cmd} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Exit code 0 = all checks passed · 1 = mismatch · 2 = invalid or unapproved plan. Writes GitHub annotations,
        a job summary, and JUnit XML with <code className="font-mono">-junit</code>.
      </p>
    </section>
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
