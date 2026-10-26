"use client";

import { useRef } from "react";
import { gsap, useGSAP, Flip } from "@/lib/gsap";

// Animates the rule summary (#rule-summary-flip) between screens whenever the
// plan changes. Call the returned capture() just before the change.
const useRuleFlip = (planId: string | undefined) => {
  const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null);

  const capture = () => {
    const el = document.getElementById("rule-summary-flip");
    if (el) flipState.current = Flip.getState(el);
  };

  useGSAP(() => {
    if (!flipState.current) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      Flip.from(flipState.current!, {
        duration: 0.45,
        ease: "power2.inOut",
        absolute: true,
      });
    });
    flipState.current = null;
  }, [planId]);

  return capture;
};

export default useRuleFlip;
