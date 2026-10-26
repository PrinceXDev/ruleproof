"use client";

import { useRef } from "react";
import { Braces, Check, X } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";

const RULE =
  "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets.";

const CONCEPTS = ["viewer", "editor", "read", "update", "own tenant", "other tenant"];

// Same 8 cases and seeded-defect outcomes as the Go fixture: the broken API
// skips the ownership check on reads only.
const CELLS = ["viewer", "editor"].flatMap((role) =>
  ["read", "update"].flatMap((action) =>
    ["own", "other"].map((scope) => {
      const expected =
        scope === "own" && (action === "read" || role === "editor") ? 200 : 403;
      const actual = action === "read" && scope === "other" ? 200 : expected;
      return { role, action, scope, expected, actual };
    }),
  ),
);

export default function HeroConsole() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.6, delay: 0.6 });
        tl.from("[data-char]", { opacity: 0, duration: 0.01, stagger: 0.014 })
          .from(
            "[data-concept]",
            { opacity: 0, y: 6, scale: 0.9, duration: 0.3, stagger: 0.06, ease: "back.out(2)" },
            "-=0.2",
          )
          .from("[data-cell]", { opacity: 0, y: 8, duration: 0.3, stagger: 0.05 }, "+=0.1")
          .from("[data-run-bar]", { scaleX: 0, duration: 1.1, ease: "power1.inOut" }, "+=0.15")
          .from(
            "[data-mark]",
            { opacity: 0, scale: 0.4, duration: 0.22, stagger: 0.12, ease: "back.out(3)" },
            "<",
          )
          .from("[data-fail-glow]", { opacity: 0, duration: 0.3, stagger: 0.1 }, "-=0.2")
          .from("[data-verdict]", { opacity: 0, y: 12, duration: 0.45, ease: "power3.out" })
          .to("[data-console-body]", { opacity: 0, duration: 0.4 }, "+=3.4");
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="relative">
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-[40px] bg-[radial-gradient(closest-side,rgba(213,248,121,.16),transparent)] blur-2xl"
      />
      <figure
        aria-label="Animated sample: a rule becomes eight checks, two of which fail against the seeded-defect API"
        className="overflow-hidden rounded-2xl border border-white/10 bg-[#121513]/90 shadow-[0_40px_120px_-30px_rgba(0,0,0,.9),inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur"
      >
        <div className="flex items-center gap-3 border-b border-white/[.07] px-4 py-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
          </div>
          <span className="flex min-w-0 items-center gap-1.5 truncate font-mono text-[11px] text-ink-faint">
            <Braces size={13} className="shrink-0" />
            <span className="truncate">evidence-studio / run · seeded-defect</span>
          </span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-brand">
            <span className="size-1.5 animate-pulse-ring rounded-full bg-brand" /> sample
          </span>
        </div>

        <div data-console-body className="space-y-4 p-4 sm:p-5">
          <section>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[.18em] text-ink-faint">
              01 · Rule
            </p>
            <p className="min-h-[3.6em] text-[13px] leading-relaxed text-ink sm:text-sm">
              <span className="text-brand">“</span>
              {RULE.split("").map((ch, i) => (
                <span key={i} data-char>
                  {ch}
                </span>
              ))}
              <span className="text-brand">”</span>
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {CONCEPTS.map((c) => (
                <span
                  key={c}
                  data-concept
                  className="rounded-md border border-brand/25 bg-brand/[.07] px-2 py-0.5 font-mono text-[10.5px] text-brand"
                >
                  {c}
                </span>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[.18em] text-ink-faint">
              <span>02 · Approved plan → run</span>
              <span>8 checks</span>
            </div>
            <div className="relative mb-2 h-px overflow-hidden bg-white/[.06]">
              <div data-run-bar className="absolute inset-0 origin-left bg-brand" />
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {CELLS.map((c, i) => {
                const fail = c.actual !== c.expected;
                return (
                  <div
                    key={i}
                    data-cell
                    className="relative overflow-hidden rounded-lg border border-white/[.07] bg-white/[.025] px-2.5 py-2"
                  >
                    {fail && (
                      <span
                        data-fail-glow
                        aria-hidden
                        className="absolute inset-0 rounded-lg border border-fail/60 bg-fail/[.09]"
                      />
                    )}
                    <div className="relative flex items-start justify-between gap-1">
                      <span className="text-[11px] leading-tight text-ink-muted">
                        <span className="text-ink">{c.role}</span> · {c.action}
                        <span className="block text-[10px] text-ink-faint">{c.scope} tenant</span>
                      </span>
                      <span
                        data-mark
                        className={cn(
                          "grid size-4 shrink-0 place-items-center rounded-full",
                          fail ? "bg-fail text-[#2a0d0b]" : "bg-pass/90 text-[#0b2a1a]",
                        )}
                      >
                        {fail ? <X size={10} strokeWidth={3} /> : <Check size={10} strokeWidth={3} />}
                      </span>
                    </div>
                    <p className="relative mt-1.5 font-mono-tnum text-[10.5px] text-ink-faint">
                      {c.expected} →{" "}
                      <span className={fail ? "text-fail" : "text-ink-muted"}>{c.actual}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            data-verdict
            className="rounded-xl border border-fail/30 bg-[linear-gradient(135deg,rgba(255,142,134,.12),rgba(255,142,134,.02))] p-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-medium text-fail">
                <X size={15} strokeWidth={2.5} /> Cross-tenant read allowed
              </p>
              <p className="font-mono-tnum text-[11px] text-ink-muted">
                <span className="text-pass">6 passed</span> · <span className="text-fail">2 failed</span>
              </p>
            </div>
            <p className="mt-2 rounded-md bg-black/30 px-2.5 py-1.5 font-mono text-[11px] text-ink-muted">
              GET /assets/b1 <span className="text-ink-faint">as</span> viewer@A →{" "}
              <span className="text-fail">200</span>{" "}
              <span className="text-ink-faint">{'{"asset":"b1","tenant":"B"}'}</span>
            </p>
          </section>
        </div>
      </figure>
    </div>
  );
}
