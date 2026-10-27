'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileWarning } from 'lucide-react';
import { useReport } from '@/hooks/useReport';
import ReportShell from '@/components/report/ReportShell';
import ReportNotice from '@/components/report/ReportNotice';
import ReportView from '@/components/report/ReportView';

const ReportLoader = () => {
  const runId = useSearchParams().get('run')?.trim() ?? '';
  const state = useReport(runId);

  if (!runId) {
    return (
      <ReportNotice icon={<FileWarning size={22} />}>
        This link has no run in it. Open a run in the studio and use{' '}
        <span className="text-ink">Share report</span>.
      </ReportNotice>
    );
  }
  if (state.status === 'loading') return <ReportNotice>Loading report…</ReportNotice>;
  if (state.status === 'error')
    return <ReportNotice icon={<FileWarning size={22} />}>{state.message}</ReportNotice>;
  return <ReportView report={state.report} />;
};

// Static export can't pre-render per-run paths, so the run id travels as a
// query param and the page loads it client-side.
const ReportPage = () => (
  <ReportShell>
    <Suspense fallback={<ReportNotice>Loading report…</ReportNotice>}>
      <ReportLoader />
    </Suspense>
  </ReportShell>
);

export default ReportPage;
