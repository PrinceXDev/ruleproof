'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { Plan, Run } from '@/lib/types';
import { useGSAP, gsap } from '@/lib/gsap';

// Flashes the result rows whose verdict changed and announces the run to
// screen readers. Returns the ref for the aria-live region.
export const useRunFlash = (
  rootRef: RefObject<HTMLDivElement | null>,
  plan: Plan,
  run: Run | null,
) => {
  const announceRef = useRef<HTMLDivElement>(null);
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
      run.results.forEach((r) => {
        const changed = prior ? prior.get(r.id) !== r.verdict : r.verdict === 'fail';
        if (!changed) return;
        const flash = r.verdict === 'pass' ? 'rgba(120,220,170,0.22)' : 'rgba(255,142,134,0.18)';
        gsap.fromTo(
          `[data-result-row="${r.id}"]`,
          { backgroundColor: flash },
          { backgroundColor: 'rgba(0,0,0,0)', duration: 1.1, ease: 'power1.out' },
        );
      });
    })();

    prevVerdicts.current = new Map(run.results.map((r) => [r.id, r.verdict]));

    if (announceRef.current) {
      announceRef.current.textContent = `Run complete: ${run.passCount} passed, ${run.failCount} failed.${
        run.bypass
          ? ` ${run.bypass.leaked} of ${run.variants.length} bypass attempts got through.`
          : ''
      }`;
    }
  }, [run, rowsCtx]);

  return announceRef;
};
