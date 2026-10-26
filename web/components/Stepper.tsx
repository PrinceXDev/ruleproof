"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { STUDIO_STEPS } from "@/constants/navigation";

export type StepStatus = "done" | "active" | "pending";

const Stepper = ({
  current,
  viewing,
  onNavigate,
}: {
  current: 0 | 1 | 2;
  viewing?: 0 | 1 | 2;
  onNavigate?: (i: 0 | 1 | 2) => void;
}) => {
  const active = viewing ?? current;
  const badgeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prevCurrent = useRef(current);

  // The moment a step completes (e.g. approving a plan advances Review ->
  // Verify), give just that badge a quick, restrained pop — not a full
  // re-animation of the whole stepper.
  useGSAP(() => {
    if (current <= prevCurrent.current) {
      prevCurrent.current = current;
      return;
    }
    const completedIndex = prevCurrent.current;
    prevCurrent.current = current;
    const el = badgeRefs.current[completedIndex];
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(el, { scale: 0.88 }, { scale: 1, duration: 0.35, ease: "back.out(2.5)" });
    });
    return () => mm.revert();
  }, [current]);

  return (
    <ol className="flex items-center gap-2" aria-label="Workflow progress">
      {STUDIO_STEPS.map((step, i) => {
        const status: StepStatus = i < current ? "done" : i === current ? "active" : "pending";
        const clickable = Boolean(onNavigate) && i <= current && i !== active;
        return (
          <li key={step.n} className="flex items-center gap-2">
            <button
              ref={(el) => {
                badgeRefs.current[i] = el;
              }}
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onNavigate?.(i as 0 | 1 | 2) : undefined}
              className={clsx(
                "flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                i === active && status === "active" && "border-brand/40 bg-brand/10 text-ink",
                i === active && status === "done" && "border-pass/40 bg-pass/10 text-pass",
                i !== active && status === "done" && "border-pass/30 bg-pass/5 text-pass/80",
                status === "pending" && "border-border bg-transparent text-ink-faint",
                clickable ? "cursor-pointer hover:opacity-80" : "cursor-default"
              )}
              aria-current={i === active ? "step" : undefined}
            >
              {status === "done" ? (
                <Check size={12} strokeWidth={2.5} />
              ) : (
                <span className="font-mono-tnum">{step.n}</span>
              )}
              <span>{step.label}</span>
            </button>
            {i < STUDIO_STEPS.length - 1 && <span className="h-px w-5 bg-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
};

export default Stepper;
