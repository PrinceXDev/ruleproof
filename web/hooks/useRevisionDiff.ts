'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { PlanDiff } from '@/lib/types';

type State = { key: string; diff: PlanDiff | null; error: string | null };

// Fetches the diff between headId and baseId (or headId's parent when baseId
// is omitted). Pass headId = null to skip fetching.
const useRevisionDiff = (headId: string | null, baseId?: string) => {
  const key = `${headId}:${baseId ?? ''}`;
  const [state, setState] = useState<State>({ key: '', diff: null, error: null });

  useEffect(() => {
    if (!headId || headId === baseId) return undefined;
    const controller = new AbortController();
    api
      .diff(headId, baseId, controller.signal)
      .then((diff) => setState({ key, diff, error: null }))
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setState({
          key,
          diff: null,
          error: e instanceof Error ? e.message : 'Could not load the diff.',
        });
      });
    return () => controller.abort();
  }, [headId, baseId, key]);

  // Stale results from a previous pair are never shown for the current one.
  const current = state.key === key ? state : { diff: null, error: null };
  return { ...current, loading: Boolean(headId) && headId !== baseId && state.key !== key };
};

export default useRevisionDiff;
