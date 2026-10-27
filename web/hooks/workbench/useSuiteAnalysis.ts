'use client';

import { useEffect, useState } from 'react';
import { ANALYSIS_DEBOUNCE_MS } from '@/constants/workbench';
import { workbenchRequest, type Analysis, type Suite } from '@/lib/workbench';

const useSuiteAnalysis = (token: string, suite: Suite | null) => {
  const [state, setState] = useState<{
    source: Suite | null;
    report: Analysis | null;
    error: string;
  }>({
    source: null,
    report: null,
    error: '',
  });
  useEffect(() => {
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      if (!suite) return;
      try {
        const report = await workbenchRequest<Analysis>(token, 'analyze', suite, abort.signal);
        if (!abort.signal.aborted)
          setState({ source: suite, report, error: report.validationError ?? '' });
      } catch (error) {
        if (!abort.signal.aborted)
          setState({
            source: suite,
            report: null,
            error: error instanceof Error ? error.message : 'Validation failed',
          });
      }
    }, ANALYSIS_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [suite, token]);
  const current = state.source === suite;
  return {
    analysis: current ? state.report : null,
    validation: current ? state.error : '',
    analyzing: !!suite && !current,
  };
};
export default useSuiteAnalysis;
