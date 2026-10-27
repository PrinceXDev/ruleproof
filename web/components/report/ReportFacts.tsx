import type { ReactNode } from 'react';
import type { Run } from '@/lib/types';
import { FIXTURE_LABEL } from '@/constants/fixtures';
import type { Report } from '@/hooks/useReport';

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="min-w-0">
    <dt className="text-xs text-ink-faint">{label}</dt>
    <dd className="mt-0.5 text-ink">{children}</dd>
  </div>
);

const ReportFacts = ({ run, revision }: { run: Run; revision: Report['revision'] }) => (
  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
    <Fact label="Fixture">{FIXTURE_LABEL[run.fixture].long}</Fact>
    <Fact label="Revision">{revision ? `${revision.index} of ${revision.total}` : '—'}</Fact>
    <Fact label="Run at">{new Date(run.createdAt).toLocaleString()}</Fact>
    <Fact label="Run id">
      <span className="break-all font-mono-tnum text-xs">{run.id}</span>
    </Fact>
  </dl>
);

export default ReportFacts;
