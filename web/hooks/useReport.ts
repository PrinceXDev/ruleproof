'use client';

import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '@/lib/api';
import type { Plan, Run } from '@/lib/types';

export interface Report {
  run: Run;
  plan: Plan;
  revision: { index: number; total: number } | null;
}

export type ReportState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; report: Report };

const loadError = (e: unknown): string => {
  if (e instanceof ApiRequestError && e.status === 404) {
    return 'No run matches this link. Check that it was copied in full.';
  }
  return 'The report could not be loaded. Try again in a moment.';
};

// Loads a run with the plan revision it was made against.
export const useReport = (runId: string): ReportState => {
  const [state, setState] = useState<ReportState>({ status: 'loading' });

  useEffect(() => {
    if (!runId) return undefined;
    const controller = new AbortController();
    (async () => {
      try {
        const run = await api.getRun(runId, controller.signal);
        const plan = await api.getPlan(run.planId, controller.signal);
        // The revision label is a nicety; the report stands without it.
        const history = await api.history(plan.rootPlanId, controller.signal).catch(() => null);
        const index = history?.lineage.findIndex((p) => p.id === plan.id) ?? -1;
        setState({
          status: 'ready',
          report: {
            run,
            plan,
            revision: index >= 0 ? { index: index + 1, total: history!.lineage.length } : null,
          },
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setState({ status: 'error', message: loadError(e) });
      }
    })();
    return () => controller.abort();
  }, [runId]);

  return state;
};
