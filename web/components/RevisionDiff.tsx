"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, GitCompareArrows, Loader2, Minus, Plus, ShieldOff } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { CaseChange, ExpectedLabel, PlanDiff } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = { viewer: "Viewer", editor: "Editor" };
const ACTION_LABEL: Record<string, string> = { read: "Read", update: "Update", export: "Export" };
const SCOPE_LABEL: Record<string, string> = { own: "own tenant", other: "other tenant" };
const OUTCOME: Record<ExpectedLabel, string> = {
  allow: "Allow",
  deny: "Deny",
  unauthenticated: "Unauthenticated",
  "not found": "Not found",
  unexpected: "Unexpected",
};

type State = { key: string; diff: PlanDiff | null; error: string | null };

// Fetches the diff between headId and baseId (or headId's parent when baseId
// is omitted). Pass headId = null to skip fetching.
export function useRevisionDiff(headId: string | null, baseId?: string) {
  const key = `${headId}:${baseId ?? ""}`;
  const [state, setState] = useState<State>({ key: "", diff: null, error: null });

  useEffect(() => {
    if (!headId || headId === baseId) return;
    const controller = new AbortController();
    api
      .diff(headId, baseId, controller.signal)
      .then((diff) => setState({ key, diff, error: null }))
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState({ key, diff: null, error: e instanceof Error ? e.message : "Could not load the diff." });
      });
    return () => controller.abort();
  }, [headId, baseId, key]);

  // Stale results from a previous pair are never shown for the current one.
  const current = state.key === key ? state : { diff: null, error: null };
  return { ...current, loading: Boolean(headId) && headId !== baseId && state.key !== key };
}

export default function RevisionDiff({
  diff,
  loading,
  error,
  baseLabel,
  headLabel,
  compact = false,
}: {
  diff: PlanDiff | null;
  loading?: boolean;
  error?: string | null;
  baseLabel: string;
  headLabel: string;
  compact?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-panel px-4 py-4 text-sm text-ink-muted">
        <Loader2 size={14} className="animate-spin" /> Comparing {baseLabel} with {headLabel}…
      </div>
    );
  }
  if (error) {
    return <div className="rounded-xl border border-fail/30 bg-fail/5 px-4 py-3 text-sm text-fail">{error}</div>;
  }
  if (!diff) return null;

  const changed = diff.cases.filter((c) => c.change === "changed").length;
  const conceptsChanged = diff.conceptsAdded.length + diff.conceptsRemoved.length > 0;
  const assumptionsChanged = diff.assumptionsAdded.length + diff.assumptionsRemoved.length > 0;

  return (
    <section
      aria-label={`Changes from ${baseLabel} to ${headLabel}`}
      className="overflow-hidden rounded-xl border border-border bg-panel"
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-3">
        <GitCompareArrows size={16} className="text-brand" />
        <h2 className="text-sm font-medium text-ink">
          {baseLabel} <ArrowRight size={12} className="mx-0.5 inline text-ink-faint" /> {headLabel}
        </h2>
        <div className="flex flex-wrap gap-1.5 sm:ml-auto">
          {!diff.planChanged && <Chip>No changes</Chip>}
          {diff.textChanged && <Chip tone="brand">Wording changed</Chip>}
          {changed > 0 && (
            <Chip tone="attn">
              {changed} expectation{changed === 1 ? "" : "s"} changed
            </Chip>
          )}
          {diff.cases.length - changed > 0 && <Chip tone="attn">{diff.cases.length - changed} cases added/removed</Chip>}
          {diff.planChanged && <Chip>{diff.unchangedCases} unchanged</Chip>}
          {diff.approvalReset && (
            <Chip tone="fail">
              <ShieldOff size={11} /> Approval reset
            </Chip>
          )}
        </div>
      </header>

      <div className={cn("space-y-5 px-4 py-4", compact && "space-y-4")}>
        {diff.textChanged && (
          <Block title="Rule wording">
            <p className="rounded-lg bg-black/25 px-3.5 py-3 text-sm leading-relaxed text-ink-muted">
              {diff.text.map((op, i) =>
                op.op === "equal" ? (
                  <span key={i}>{op.text}</span>
                ) : op.op === "insert" ? (
                  <ins key={i} className="rounded-sm bg-pass/15 px-0.5 text-pass no-underline">
                    {op.text}
                  </ins>
                ) : (
                  <del
                    key={i}
                    className={cn(
                      "rounded-sm bg-fail/10 px-0.5 text-fail/80 decoration-fail/60",
                      diff.text[i + 1]?.op === "insert" && "mr-1",
                    )}
                  >
                    {op.text}
                  </del>
                ),
              )}
            </p>
          </Block>
        )}

        {diff.cases.length > 0 && (
          <Block title="Expectations">
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {diff.cases.map((c) => (
                <CaseRow key={c.caseId} c={c} />
              ))}
            </ul>
          </Block>
        )}

        {assumptionsChanged && (
          <Block title="Assumptions">
            <ul className="space-y-1.5 text-sm">
              {diff.assumptionsAdded.map((a) => (
                <li key={a} className="flex gap-2 rounded-lg border border-attn/30 bg-attn/5 px-3 py-2 text-ink">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-attn" />
                  <span>
                    <span className="mr-1.5 text-xs text-attn">New</span>
                    {a}
                  </span>
                </li>
              ))}
              {diff.assumptionsRemoved.map((a) => (
                <li key={a} className="flex gap-2 rounded-lg border border-border px-3 py-2 text-ink-faint">
                  <Minus size={14} className="mt-0.5 shrink-0" />
                  <span>
                    <span className="mr-1.5 text-xs">Resolved</span>
                    <span className="line-through">{a}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {conceptsChanged && !compact && (
          <Block title="Extracted concepts">
            <div className="flex flex-wrap gap-1.5">
              {diff.conceptsAdded.map((c) => (
                <span
                  key={`+${c.label}${c.value}`}
                  className="inline-flex items-center gap-1 rounded-md border border-pass/30 bg-pass/10 px-2 py-0.5 text-xs text-pass"
                >
                  <Plus size={11} /> {c.label}: {c.value}
                </span>
              ))}
              {diff.conceptsRemoved.map((c) => (
                <span
                  key={`-${c.label}${c.value}`}
                  className="inline-flex items-center gap-1 rounded-md border border-fail/30 bg-fail/10 px-2 py-0.5 text-xs text-fail/90 line-through"
                >
                  <Minus size={11} /> {c.label}: {c.value}
                </span>
              ))}
            </div>
          </Block>
        )}

        {diff.approvalReset && (
          <p className="flex gap-2 text-xs leading-relaxed text-ink-faint">
            <ShieldOff size={14} className="mt-px shrink-0 text-fail/80" />
            {baseLabel} was approved, but that approval covered a different plan. Approve {headLabel} before it can run.
          </p>
        )}
        {!diff.planChanged && (
          <p className="text-sm text-ink-muted">These revisions test exactly the same thing.</p>
        )}
      </div>
    </section>
  );
}

function CaseRow({ c }: { c: CaseChange }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-canvas/30 px-3.5 py-2.5 text-sm">
      <span className="min-w-0 flex-1">
        <span className="text-ink">
          {ROLE_LABEL[c.role]} · {ACTION_LABEL[c.action]}
        </span>
        <span className="ml-2 text-xs text-ink-faint">
          {SCOPE_LABEL[c.scope]} · {c.method} /assets/{c.assetId}{c.action === "export" && "/export"}
        </span>
      </span>
      <span className="flex items-center gap-2 font-mono-tnum text-xs">
        {c.fromLabel ? (
          <Outcome label={c.fromLabel} status={c.fromStatus} muted={c.change === "changed"} />
        ) : (
          <span className="text-ink-faint">new case</span>
        )}
        <ArrowRight size={12} className="text-ink-faint" />
        {c.toLabel ? (
          <Outcome label={c.toLabel} status={c.toStatus} />
        ) : (
          <span className="text-fail">removed</span>
        )}
      </span>
    </li>
  );
}

function Outcome({ label, status, muted }: { label: ExpectedLabel; status?: number; muted?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5",
        muted
          ? "border-border text-ink-faint line-through"
          : label === "allow"
            ? "border-pass/30 bg-pass/10 text-pass"
            : "border-attn/30 bg-attn/10 text-attn",
      )}
    >
      {OUTCOME[label]} {status}
    </span>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-faint">{title}</h3>
      {children}
    </div>
  );
}

function Chip({ tone = "neutral", children }: { tone?: "neutral" | "brand" | "attn" | "fail"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tone === "neutral" && "border-border text-ink-muted",
        tone === "brand" && "border-brand/30 bg-brand/10 text-brand",
        tone === "attn" && "border-attn/30 bg-attn/10 text-attn",
        tone === "fail" && "border-fail/30 bg-fail/10 text-fail",
      )}
    >
      {children}
    </span>
  );
}
