"use client";

import { useState } from "react";
import { CheckCircle2, Clock, DoorOpen, FileText, GitBranch, GitCompareArrows, XCircle } from "lucide-react";
import clsx from "clsx";
import type { History, Run } from "@/lib/types";
import { FIXTURE_LABEL } from "@/constants/fixtures";
import { reportPath } from "@/lib/report";
import Badge from "./Badge";
import RevisionDiff, { useRevisionDiff } from "./RevisionDiff";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { KIND_LABEL } from "@/constants/labels";

const HistoryPanel = ({
  history,
  onOpenRun,
  loading,
}: {
  history: History | null;
  onOpenRun: (run: Run) => void;
  loading: boolean;
}) => {
  const lineage = history?.lineage ?? [];
  // null = follow the default pair (the two most recent revisions).
  const [pair, setPair] = useState<{ base: string; head: string } | null>(null);
  const valid = (id?: string) => Boolean(id && lineage.some((p) => p.id === id));
  const head = pair && valid(pair.head) ? pair.head : lineage.at(-1)?.id;
  const base = pair && valid(pair.base) ? pair.base : lineage.at(-2)?.id;
  const diff = useRevisionDiff(lineage.length > 1 && head ? head : null, base);
  const nameOf = (id?: string) => `Revision ${lineage.findIndex((p) => p.id === id) + 1}`;

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
            <div className="flex items-center gap-2">
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => setPair({ base: lineage[i - 1].id, head: p.id })}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-panel-elevated hover:text-ink"
                >
                  <GitCompareArrows size={13} /> Compare with {i}
                </button>
              )}
              <Badge tone={p.approved ? "pass" : "neutral"}>{p.approved ? "Approved" : "Unapproved"}</Badge>
            </div>
          </li>
        ))}
      </ol>

      {lineage.length > 1 && base && head && (
        <>
          <div className="mb-2 mt-7 flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-xs font-medium uppercase tracking-wider text-ink-faint">Compare revisions</h2>
            <RevisionPicker
              label="Base revision"
              value={base}
              options={lineage.map((p) => p.id)}
              nameOf={nameOf}
              onChange={(v) => setPair({ base: v, head })}
            />
            <span className="text-xs text-ink-faint">→</span>
            <RevisionPicker
              label="Compared revision"
              value={head}
              options={lineage.map((p) => p.id)}
              nameOf={nameOf}
              onChange={(v) => setPair({ base, head: v })}
            />
          </div>
          {base === head ? (
            <p className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-ink-muted">
              Pick two different revisions to compare.
            </p>
          ) : (
            <RevisionDiff
              diff={diff.diff}
              loading={diff.loading}
              error={diff.error}
              baseLabel={nameOf(base)}
              headLabel={nameOf(head)}
            />
          )}
        </>
      )}

      <h2 className="mb-2 mt-7 text-xs font-medium uppercase tracking-wider text-ink-faint">Runs</h2>
      {history.runs.length === 0 ? (
        <p className="text-sm text-ink-faint">No runs yet.</p>
      ) : (
        <ul className="space-y-2">
          {history.runs.map((run) => (
            <li key={run.id} className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => onOpenRun(run)}
                className="flex min-w-0 flex-1 items-center justify-between rounded-md border border-border bg-panel px-3.5 py-2.5 text-left text-sm transition-colors hover:border-ink-faint"
              >
                <div className="flex items-center gap-3">
                  <Clock size={14} className="text-ink-faint" />
                  <span className="text-ink-muted">{new Date(run.createdAt).toLocaleString()}</span>
                  <Badge tone="neutral" className="capitalize">
                    {FIXTURE_LABEL[run.fixture].long}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 font-mono-tnum text-xs">
                  <span className={clsx("flex items-center gap-1", run.passCount > 0 ? "text-pass" : "text-ink-faint")}>
                    <CheckCircle2 size={13} /> {run.passCount}
                  </span>
                  <span className={clsx("flex items-center gap-1", run.failCount > 0 ? "text-fail" : "text-ink-faint")}>
                    <XCircle size={13} /> {run.failCount}
                  </span>
                  {run.bypass && (
                    <span
                      className={clsx("flex items-center gap-1", run.bypass.leaked > 0 ? "text-fail" : "text-ink-faint")}
                      title="Bypass attempts that got through"
                    >
                      <DoorOpen size={13} /> {run.bypass.leaked}
                    </span>
                  )}
                </div>
              </button>
              <a
                href={reportPath(run.id)}
                target="_blank"
                rel="noopener"
                aria-label="Open this run's evidence report"
                title="Open report"
                className="grid w-10 shrink-0 place-items-center rounded-md border border-border bg-panel text-ink-faint transition-colors hover:border-ink-faint hover:text-ink"
              >
                <FileText size={14} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistoryPanel;

const RevisionPicker = ({
  label,
  value,
  options,
  nameOf,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  nameOf: (id: string) => string;
  onChange: (id: string) => void;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger aria-label={label} className="min-h-9 min-w-32 py-1.5 text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((id) => (
        <SelectItem key={id} value={id}>
          {nameOf(id)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
