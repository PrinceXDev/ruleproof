"use client";
import { useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { ArrowRight, Check, CornerDownRight, RotateCcw, X } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/button";

const rule =
  "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets.";
const cases = ["viewer", "editor"].flatMap((role) =>
  ["read", "update"].flatMap((action) =>
    ["own", "other"].map((scope) => ({
      role,
      action,
      scope,
      expected:
        scope === "own" && (action === "read" || role === "editor") ? 200 : 403,
    })),
  ),
);
const stages = ["Explain", "Review & approve", "Verify & inspect"];

const eyebrow =
  "font-mono text-[10px] font-medium uppercase tracking-[.18em] text-ink-faint";

export default function ProductDemo() {
  const [stage, setStage] = useState(0);
  const [approved, setApproved] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [selected, setSelected] = useState(1);
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-demo-content]", { y: 10, opacity: 0, duration: 0.35, ease: "power2.out" });
        gsap.from("[data-matrix-item]", { opacity: 0, y: 8, duration: 0.3, stagger: 0.04 });
        const evidence = ref.current?.querySelector("[data-evidence]");
        if (evidence) gsap.from(evidence, { x: 10, opacity: 0.4, duration: 0.3 });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [stage, selected, fixed], revertOnUpdate: true },
  );

  const c = cases[selected];
  const actual = !fixed && c.action === "read" ? 200 : c.expected;
  const pass = actual === c.expected;
  const excerpt =
    c.scope === "other"
      ? "Neither role can access another tenant's assets."
      : c.role === "editor" && c.action === "update"
        ? "Editors can also update them."
        : "Viewers can read assets in their own tenant.";

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#121513] shadow-[0_50px_140px_-40px_rgba(0,0,0,.9)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-4 py-3 sm:px-5">
        <span className={cn(eyebrow, "flex items-center gap-2")}>
          <span className="size-1.5 animate-pulse-ring rounded-full bg-brand" />
          Interactive sample
          <span className="hidden normal-case tracking-normal text-ink-faint/70 sm:inline">
            · runs in your browser, no live requests
          </span>
        </span>
        <button
          onClick={() => {
            setStage(0);
            setApproved(false);
            setFixed(false);
            setSelected(1);
          }}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <ol className="grid grid-cols-3 border-b border-white/[.07]" aria-label="Sample workflow">
        {stages.map((name, i) => {
          const done = i < stage || (i === 1 && approved);
          return (
            <li key={name}>
              <button
                aria-current={stage === i ? "step" : undefined}
                disabled={i === 2 && !approved}
                onClick={() => setStage(i)}
                className={cn(
                  "relative flex w-full items-center gap-2.5 px-3 py-3.5 text-left text-xs transition-colors sm:px-5 sm:text-[13px]",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  stage === i ? "bg-white/[.03] text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[10px]",
                    stage === i
                      ? "border-brand bg-brand text-brand-ink"
                      : done
                        ? "border-pass/50 text-pass"
                        : "border-white/15",
                  )}
                >
                  {done && stage !== i ? <Check size={12} /> : i + 1}
                </span>
                <span className="truncate">{name}</span>
                {stage === i && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" aria-hidden />
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="min-h-[520px] p-4 sm:p-7" data-demo-content>
        {stage === 0 && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
            <div>
              <p className={eyebrow}>The input · plain language</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Start with who can do what.
              </h3>
              <blockquote className="mt-5 rounded-xl border border-white/[.08] bg-black/25 p-5 text-lg leading-relaxed text-ink sm:text-xl">
                <span className="text-brand">“</span>
                {rule}
                <span className="text-brand">”</span>
              </blockquote>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-muted">
                The sample rule from the Evidence Studio. In the studio you type
                or dictate your own wording — RuleProof was designed around how
                people say rules out loud.
              </p>
              <button className={cn(buttonVariants(), "mt-6")} onClick={() => setStage(1)}>
                Generate sample checks <ArrowRight size={16} />
              </button>
            </div>
            <aside className="rounded-xl border border-white/[.08] bg-white/[.02] p-5">
              <p className={eyebrow}>What the parser extracts</p>
              <dl className="mt-4 divide-y divide-white/[.06] text-sm">
                {[
                  ["Roles", "Viewer · Editor"],
                  ["Actions", "Read · Update"],
                  ["Scope", "Own tenant · Other tenant"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-ink-faint">{k}</dt>
                    <dd className="text-right text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 rounded-lg bg-brand/[.07] p-4 font-mono text-xs text-ink-muted">
                2 roles × 2 actions × 2 scopes
                <p className="mt-1 font-sans text-2xl font-semibold text-brand">
                  = 8 expectations
                </p>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-ink-faint">
                Unsupported wording is never guessed — it becomes a visible
                assumption you must acknowledge before approval.
              </p>
            </aside>
          </div>
        )}

        {stage === 1 && (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={eyebrow}>The plan · sample revision 1</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Review before you run.
                </h3>
              </div>
              <button
                className={buttonVariants()}
                onClick={() => {
                  setApproved(true);
                  setStage(2);
                }}
              >
                {approved ? "View sample results" : "Approve & run sample"}
                <ArrowRight size={16} />
              </button>
            </div>
            <p className="mt-3 max-w-2xl text-sm text-ink-muted">
              These are proposed expectations, not results. Editing any of them
              in the studio creates a new revision that needs approval again.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {cases.map((item, i) => (
                <div
                  key={i}
                  data-matrix-item
                  className="flex items-center gap-4 rounded-xl border border-white/[.07] bg-white/[.02] px-4 py-3"
                >
                  <span className="font-mono text-[11px] text-ink-faint">0{i + 1}</span>
                  <span className="flex-1 text-sm capitalize text-ink">
                    {item.role} <b className="font-semibold">{item.action}</b>
                    <span className="block text-xs normal-case text-ink-faint">
                      {item.scope} tenant asset
                    </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      item.expected === 200
                        ? "border-pass/30 bg-pass/10 text-pass"
                        : "border-white/10 bg-white/[.04] text-ink-muted",
                    )}
                  >
                    {item.expected === 200 ? "Allow" : "Deny"}{" "}
                    <span className="font-mono-tnum">{item.expected}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stage === 2 && (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={eyebrow}>The result · approved sample plan</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {fixed ? "Same plan. Corrected API." : "Two reads cross the tenant boundary."}
                </h3>
              </div>
              <div
                className="flex rounded-lg border border-white/10 bg-black/30 p-1"
                role="group"
                aria-label="Sample fixture"
              >
                {[false, true].map((v) => (
                  <button
                    key={String(v)}
                    aria-pressed={fixed === v}
                    onClick={() => setFixed(v)}
                    className={cn(
                      "rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors",
                      fixed === v
                        ? v
                          ? "bg-pass/15 text-pass"
                          : "bg-fail/15 text-fail"
                        : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {v ? "Corrected" : "Seeded defect"}
                  </button>
                ))}
              </div>
            </div>
            <p
              className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm"
              role="status"
            >
              <span className="text-pass">
                <NumberFlow value={fixed ? 8 : 6} className="font-semibold" /> passed
              </span>
              <span className={fixed ? "text-ink-faint" : "text-fail"}>
                <NumberFlow value={fixed ? 0 : 2} className="font-semibold" /> failed
              </span>
              <span className="text-ink-faint">Select a check to trace its evidence</span>
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
              <div className="flex flex-col gap-1.5" aria-label="Sample check results">
                {cases.map((item, i) => {
                  const failed = !fixed && item.action === "read" && item.scope === "other";
                  return (
                    <button
                      key={i}
                      aria-pressed={selected === i}
                      onClick={() => setSelected(i)}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-all",
                        selected === i
                          ? "border-brand/50 bg-brand/[.06]"
                          : "border-white/[.06] bg-white/[.015] hover:border-white/15",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded-full",
                          failed ? "bg-fail/20 text-fail" : "bg-pass/15 text-pass",
                        )}
                      >
                        {failed ? <X size={11} strokeWidth={3} /> : <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className="flex-1 capitalize text-ink">
                        {item.role} · {item.action}
                        <span className="ml-2 text-xs normal-case text-ink-faint">
                          {item.scope} tenant
                        </span>
                      </span>
                      <span className={cn("text-xs", failed ? "text-fail" : "text-pass")}>
                        {failed ? "Failed" : "Passed"}
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-ink-faint transition-transform group-hover:translate-x-0.5"
                      />
                    </button>
                  );
                })}
              </div>

              <aside
                data-evidence
                aria-label="Selected check evidence"
                aria-live="polite"
                className={cn(
                  "rounded-xl border p-5",
                  pass ? "border-white/[.08] bg-white/[.02]" : "border-fail/30 bg-fail/[.04]",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={eyebrow}>Linked evidence · 0{selected + 1}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      pass ? "bg-pass/10 text-pass" : "bg-fail/15 text-fail",
                    )}
                  >
                    {pass ? "Passed" : "Failed"}
                  </span>
                </div>
                <p className={cn(eyebrow, "mt-5")}>Source rule</p>
                <blockquote className="mt-2 border-l-2 border-brand pl-3 text-[15px] text-ink">
                  {excerpt}
                </blockquote>
                {c.role === "viewer" && c.action === "update" && c.scope === "own" && (
                  <p className="mt-2 text-xs text-ink-faint">
                    Read-only viewer access implies updates are denied in this bounded parser.
                  </p>
                )}
                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg bg-black/30 p-4">
                  <div>
                    <p className={eyebrow}>Expected</p>
                    <p className="mt-1 font-mono-tnum text-3xl font-semibold text-ink">
                      {c.expected}
                      <span className="ml-1.5 text-xs font-normal text-ink-faint">
                        {c.expected === 200 ? "allow" : "deny"}
                      </span>
                    </p>
                  </div>
                  <ArrowRight className="text-ink-faint" size={18} />
                  <div>
                    <p className={eyebrow}>Actual</p>
                    <p
                      className={cn(
                        "mt-1 font-mono-tnum text-3xl font-semibold",
                        pass ? "text-pass" : "text-fail",
                      )}
                    >
                      {actual}
                    </p>
                  </div>
                </div>
                <p className={cn(eyebrow, "mt-5")}>Request · demo-{c.role}-a</p>
                <code className="mt-2 block rounded-md bg-black/30 px-3 py-2 font-mono text-xs text-ink">
                  <span className="text-brand">{c.action === "read" ? "GET" : "PUT"}</span> /assets/
                  {c.scope === "own" ? "a1" : "b1"}
                  <span className="text-ink-faint"> · Authorization: Bearer ••••</span>
                </code>
                <p className={cn(eyebrow, "mt-4")}>Response body</p>
                <pre className="mt-2 overflow-x-auto rounded-md bg-black/30 px-3 py-2 font-mono text-xs text-ink-muted">
                  {actual === 200
                    ? JSON.stringify(
                        { asset: c.scope === "own" ? "a1" : "b1", tenant: c.scope === "own" ? "A" : "B" },
                        null,
                        2,
                      )
                    : "(empty body)"}
                </pre>
                <p className="mt-4 flex gap-2 text-sm text-ink-muted">
                  <CornerDownRight size={16} className="mt-0.5 shrink-0 text-ink-faint" />
                  {pass
                    ? "The response status matches this approved expectation."
                    : "Tenant A received Tenant B’s asset. The seeded API skips the ownership check on reads."}
                </p>
              </aside>
            </div>
            <p className="mt-5 text-xs text-ink-faint">
              Illustrative results mirroring the bundled fixture behaviour, not a live run.{" "}
              <a href="/studio/" className="inline-flex items-center gap-1 text-brand hover:underline">
                Run real checks in the studio <ArrowRight size={12} />
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
