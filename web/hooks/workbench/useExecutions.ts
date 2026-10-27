'use client';

import { useCallback, useEffect, useState } from 'react';
import { EXECUTION_POLL_MS } from '@/constants/executions';
import type { Execution } from '@/lib/executions';
import { workbenchRequest } from '@/lib/workbench';

const useExecutions = (token: string) => {
  const [runs, setRuns] = useState<Execution[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const refresh = useCallback(() => setRefreshVersion((value) => value + 1), []);

  useEffect(() => {
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const data = await workbenchRequest<Execution[]>(
          token,
          'executions',
          undefined,
          abort.signal,
        );

        if (!abort.signal.aborted) {
          setRuns(data);
          setError('');
        }
      } catch (failure) {
        if (!abort.signal.aborted)
          setError(failure instanceof Error ? failure.message : 'Unable to refresh executions');
      } finally {
        if (!abort.signal.aborted) {
          setLoading(false);
          timer = setTimeout(() => {
            void poll();
          }, EXECUTION_POLL_MS);
        }
      }
    };
    void poll();
    return () => {
      abort.abort();
      clearTimeout(timer);
    };
  }, [token, refreshVersion]);

  const update = async (id: string, action: 'cancel' | 'recover', reason?: string) => {
    await workbenchRequest(token, `executions/${id}/${action}`, { reason });
    refresh();
  };

  return { runs, loading, error, refresh, update };
};
export default useExecutions;
