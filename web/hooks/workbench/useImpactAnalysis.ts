'use client';

import { useEffect, useRef, useState } from 'react';
import { SUITE_LIMITS } from '@/constants/workbench';
import type { ImpactReport } from '@/lib/impact';
import { workbenchRequest, type Revision } from '@/lib/workbench';

const useImpactAnalysis = (token: string, revision: Revision | null) => {
  const [state, setState] = useState({
    report: null as ImpactReport | null,
    loading: false,
    error: '',
    filename: '',
  });
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const analyze = async (file: File | undefined) => {
    if (!file || !revision) return;
    active.current?.abort();
    const abort = new AbortController();
    active.current = abort;
    setState({ report: null, loading: true, error: '', filename: file.name });
    try {
      if (file.size > SUITE_LIMITS.specBytes)
        throw new Error('Choose an OpenAPI JSON document of at most 512 KiB.');
      const spec = JSON.parse(await file.text());
      if (abort.signal.aborted) return;
      const report = await workbenchRequest<ImpactReport>(
        token,
        `revisions/${revision.id}/impact`,
        { spec },
        abort.signal,
      );
      if (report.suiteHash !== revision.hash)
        throw new Error('The comparison baseline changed. Reload the saved revision.');
      if (!abort.signal.aborted)
        setState({ report, loading: false, error: '', filename: file.name });
    } catch (error) {
      if (!abort.signal.aborted)
        setState({
          report: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Impact analysis failed',
          filename: file.name,
        });
    }
  };
  return { ...state, analyze };
};
export default useImpactAnalysis;
