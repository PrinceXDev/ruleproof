"use client";

import { useRef, useState, type ReactNode } from "react";
import { Check, Copy, Download, X } from "lucide-react";
import clsx from "clsx";
import type { CheckResult, Plan, PlanCase, Run } from "@/lib/types";
import Badge from "./Badge";
import JsonView from "./JsonView";
import { useDialog } from "@/lib/useDialog";
import { useGSAP, gsap } from "@/lib/gsap";

const ROLE_LABEL: Record<string, string> = { viewer: "Viewer", editor: "Editor" };
const ACTION_LABEL: Record<string, string> = { read: "Read", update: "Update", export: "Export" };
const SCOPE_LABEL: Record<string, string> = { own: "own tenant", other: "another tenant" };

export default function EvidenceDrawer({
  open,
  onClose,
  result,
  planCase,
  plan,
  run,
  revisionLabel,
}: {
  open: boolean;
  onClose: () => void;
  result: CheckResult | null;
  planCase: PlanCase | null;
  plan: Plan;
  run: Run | null;
  revisionLabel: string;
}) {
  const dialogRef = useDialog<HTMLDivElement>(open, onClose);
  const panelRef = useRef<HTMLDivElement>(null);
  // Derived from which result's id was last copied, rather than reset via an
  // effect: it naturally reads as "not copied" the instant a different
  // result is selected, with no extra render pass.
  const [copiedForId, setCopiedForId] = useState<string | null>(null);
  const copied = copiedForId === result?.id;

  useGSAP(
    () => {
      if (!open) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          panelRef.current,
          { opacity: 0, x: 24 },
          { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
        );
      });
      return () => mm.revert();
    },
    { dependencies: [open, result?.id] }
  );

  if (!open || !result || !planCase) return null;

  const passed = result.verdict === "pass";
  const isCrossTenantLeak = planCase.scope === "other" && result.verdict === "fail";

  const evidenceJson = JSON.stringify(
    {
      case: planCase.id,
      role: planCase.role,
      action: planCase.action,
      scope: planCase.scope,
      requirementRevision: revisionLabel,
      planId: plan.id,
      expectedStatus: result.expected_status,
      actualStatus: result.actual_status,
      verdict: result.verdict,
      method: result.method,
      path: result.path,
      durationMs: result.duration_ms,
      runId: run?.id,
      fixture: run?.fixture,
      observedAt: run?.createdAt,
      responseBody: safeParse(result.body),
    },
    null,
    2
  );

  async function copyEvidence() {
    try {
      await navigator.clipboard.writeText(evidenceJson);
      setCopiedForId(result!.id);
    } catch {
      // clipboard may be unavailable (permissions, insecure context) — non-fatal
    }
  }

  function downloadEvidence() {
    const blob = new Blob([evidenceJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ruleproof-evidence-${planCase!.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-30 md:pointer-events-none md:bg-transparent" role="presentation">
      <div
        className="absolute inset-0 bg-black/50 md:hidden"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-title"
        className={clsx(
          "pointer-events-auto absolute inset-y-0 right-0 flex w-full flex-col border-l border-border bg-panel shadow-2xl md:w-[420px]"
        )}
      >
        <div ref={panelRef} className="flex h-full flex-col">
          <div className="flex items-start justify-between border-b border-border px-5 py-4">
            <div>
              <h2 id="evidence-title" className="text-sm font-semibold text-ink">
                {ROLE_LABEL[planCase.role]} → {ACTION_LABEL[planCase.action]} → {planCase.scope === "own" ? "Own tenant" : "Other tenant"}
              </h2>
              <div className="mt-1.5">
                <Badge tone={passed ? "pass" : result.verdict === "fail" ? "fail" : "attn"}>
                  {passed ? "Passed" : result.verdict === "fail" ? "Failed" : "Error"}
                </Badge>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close evidence inspector"
              className="rounded p-1 text-ink-faint hover:bg-panel-elevated hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 text-sm">
            {isCrossTenantLeak && (
              <p className="mb-4 rounded-md border border-fail/30 bg-fail/5 px-3 py-2.5 text-ink">
                The {planCase.role} belongs to tenant {planCase.assetOwner === "A" ? "B" : "A"}. This response
                contains an asset from tenant {planCase.assetOwner}.
              </p>
            )}

            <Section label="Requirement excerpt">
              <p className="text-ink-muted">“{plan.ruleText}”</p>
            </Section>

            <Section label="Revision & plan">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono-tnum text-xs">
                <dt className="text-ink-faint">Revision</dt>
                <dd className="text-ink">{revisionLabel}</dd>
                <dt className="text-ink-faint">Plan</dt>
                <dd className="truncate text-ink">{plan.id}</dd>
              </dl>
            </Section>

            <Section label="Expected vs. actual">
              <div className="flex items-center gap-3 font-mono-tnum text-xs">
                <span className="rounded border border-border px-2 py-1 text-ink-muted">
                  expected {result.expected_status}
                </span>
                <span className="text-ink-faint">→</span>
                <span
                  className={clsx(
                    "rounded border px-2 py-1",
                    passed ? "border-pass/30 text-pass" : "border-fail/30 text-fail"
                  )}
                >
                  observed {result.actual_status ?? "no response"}
                </span>
              </div>
            </Section>

            <Section label="Request">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono-tnum text-xs">
                <dt className="text-ink-faint">Method</dt>
                <dd className="text-ink">{result.method}</dd>
                <dt className="text-ink-faint">Endpoint</dt>
                <dd className="text-ink">{result.path}</dd>
                <dt className="text-ink-faint">Identity</dt>
                <dd className="text-ink">
                  demo-{planCase.role}-a ({SCOPE_LABEL[planCase.scope] === "own tenant" ? "tenant A" : "tenant A"})
                </dd>
                <dt className="text-ink-faint">Asset tenant</dt>
                <dd className="text-ink">tenant {planCase.assetOwner}</dd>
              </dl>
            </Section>

            <Section label="Request headers (redacted)">
              <div className="rounded-md border border-border bg-panel-elevated px-3 py-2 font-mono-tnum text-xs text-ink-muted">
                <div>Authorization: Bearer ••••••••</div>
                <div>Accept: application/json</div>
              </div>
            </Section>

            <Section label="Response body">
              {result.body ? (
                <div className="rounded-md border border-border bg-panel-elevated px-3 py-2">
                  <JsonView value={result.body} />
                </div>
              ) : (
                <p className="text-xs text-ink-faint">No response body captured.</p>
              )}
            </Section>

            <Section label="Assertion">
              <p className="text-xs text-ink-muted">{result.detail}</p>
            </Section>

            <Section label="Timing">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono-tnum text-xs">
                <dt className="text-ink-faint">Observed</dt>
                <dd className="text-ink">{run ? new Date(run.createdAt).toLocaleTimeString() : "—"}</dd>
                <dt className="text-ink-faint">Duration</dt>
                <dd className="text-ink">{result.duration_ms} ms</dd>
              </dl>
            </Section>

            <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
              This reflects the approved scenarios for this plan only. It does not prove the whole application is
              secure.
            </p>
          </div>

          <div className="flex items-center gap-2 border-t border-border px-5 py-3.5">
            <button
              type="button"
              onClick={copyEvidence}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
            >
              {copied ? <Check size={13} className="text-pass" /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy evidence"}
            </button>
            <button
              type="button"
              onClick={downloadEvidence}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
            >
              <Download size={13} />
              Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-faint">{label}</h3>
      {children}
    </div>
  );
}

function safeParse(body?: string) {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}
