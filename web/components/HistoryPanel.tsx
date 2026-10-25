"use client";

import { CheckCircle2, Clock, GitBranch, XCircle } from "lucide-react";
import clsx from "clsx";
import type { History, Run } from "@/lib/types";
import Badge from "./Badge";

const KIND_LABEL: Record<string, string> = { root: "Original", revision: "Revised wording", edit: "Edited expectation" };

export default function HistoryPanel({
  history,
  onOpenRun,
  loading,
}: {
  history: History | null;
  onOpenRun: (run: Run) => void;
  loading: boolean;
}) {
  if (loading) {
    return <div className="px-6 py-10 text-sm text-ink-muted">Loading history…</div>;
  }
  if (!history || history.lineage.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <GitBranch className="mx-auto mb-3 text-ink-faint" size={28} />
        <p className="text-sm text-ink-muted">No checks yet. Explain a rule to start building history.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Run history</h1>
      <p className="mt-1 text-sm text-ink-muted">Every revision and run for this rule, oldest revision first.</p>

      <h2 className="mb-2 mt-7 text-xs font-medium uppercase tracking-wider text-ink-faint">Revisions</h2>
      <ol className="space-y-2">
        {history.lineage.map((p, i) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-md border border-border bg-panel px-3.5 py-2.5 text-sm"
          >
            <div>
              <span className="font-mono-tnum text-ink">Revision {i + 1}</span>
              <span className="ml-2 text-ink-faint">{KIND_LABEL[p.kind]}</span>
            </div>
            <Badge tone={p.approved ? "pass" : "neutral"}>{p.approved ? "Approved" : "Unapproved"}</Badge>
          </li>
        ))}
      </ol>

      <h2 className="mb-2 mt-7 text-xs font-medium uppercase tracking-wider text-ink-faint">Runs</h2>
      {history.runs.length === 0 ? (
        <p className="text-sm text-ink-faint">No runs yet.</p>
      ) : (
        <ul className="space-y-2">
          {history.runs.map((run) => (
            <li key={run.id}>
              <button
                type="button"
                onClick={() => onOpenRun(run)}
                className="flex w-full items-center justify-between rounded-md border border-border bg-panel px-3.5 py-2.5 text-left text-sm transition-colors hover:border-ink-faint"
              >
                <div className="flex items-center gap-3">
                  <Clock size={14} className="text-ink-faint" />
                  <span className="text-ink-muted">{new Date(run.createdAt).toLocaleString()}</span>
                  <Badge tone="neutral" className="capitalize">
                    {run.fixture === "broken" ? "Seeded defect" : "Corrected"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 font-mono-tnum text-xs">
                  <span className={clsx("flex items-center gap-1", run.passCount > 0 ? "text-pass" : "text-ink-faint")}>
                    <CheckCircle2 size={13} /> {run.passCount}
                  </span>
                  <span className={clsx("flex items-center gap-1", run.failCount > 0 ? "text-fail" : "text-ink-faint")}>
                    <XCircle size={13} /> {run.failCount}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
