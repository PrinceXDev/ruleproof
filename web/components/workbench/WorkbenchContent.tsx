'use client';

import { Loader2 } from 'lucide-react';
import { WORKBENCH_TABS } from '@/constants/workbench';
import type { Session } from '@/lib/workbench';
import useWorkbench from './useWorkbench';
import WorkbenchHeader from './WorkbenchHeader';
import SuiteSettings from './SuiteSettings';
import WorkbenchStatus from './WorkbenchStatus';
import WorkbenchSummary from './WorkbenchSummary';
import CheckEditor from './CheckEditor';
import Identities from './Identities';
import Coverage from './Coverage';
import RevisionActivity from './RevisionActivity';
import Executions from './Executions';

interface Props {
  token: string;
  session: Session;
  signOut: () => void;
}
const WorkbenchContent = ({ token, session, signOut }: Props) => {
  const model = useWorkbench(token, session, signOut);
  const { suite, tab, setTab, events, editable, change, analysis } = model;
  if (model.loading)
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-3 p-20 text-sm text-ink-muted"
      >
        <Loader2 size={18} className="animate-spin" />
        Loading authorization suites…
      </div>
    );
  if (!suite)
    return (
      <div className="p-8">
        <WorkbenchStatus model={model} />
      </div>
    );
  const loaded = { ...model, suite };
  const environment = session.environments.find((item) => item.id === suite.environment);
  return (
    <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-7 md:px-8 md:py-9">
      <WorkbenchHeader model={loaded} />
      <SuiteSettings model={loaded} />
      <WorkbenchStatus model={model} />
      <WorkbenchSummary model={loaded} />
      <nav
        aria-label="Workbench views"
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {WORKBENCH_TABS.map((label) => (
          <button
            key={label}
            type="button"
            aria-current={tab === label ? 'page' : undefined}
            onClick={() => setTab(label)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${tab === label ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink'}`}
          >
            {label}
            {label === 'Activity' && events.length > 0 && (
              <span className="ml-2 text-xs opacity-60">{events.length}</span>
            )}
          </button>
        ))}
      </nav>
      {tab === 'Checks' && (
        <CheckEditor
          key={model.editorVersion}
          suite={suite}
          onChange={change}
          disabled={!editable}
        />
      )}
      {tab === 'Identities' && (
        <Identities
          suite={suite}
          onChange={change}
          disabled={!editable}
          credentials={environment?.credentials ?? []}
        />
      )}
      {tab === 'API coverage' && (
        <Coverage
          suite={suite}
          analysis={analysis}
          onChange={change}
          disabled={!editable}
          drift={model.drift}
          onError={model.setError}
          onDrift={model.compareSpec}
        />
      )}
      {tab === 'Runs' && <Executions token={token} session={session} />}
      {tab === 'Activity' && (
        <RevisionActivity key={model.revision?.id} token={token} revisionId={model.revision?.id} />
      )}
      <footer className="pb-5 text-xs leading-relaxed text-ink-muted">
        A pass applies to the reviewed scenarios. Missing combinations remain visible in API
        coverage. Credentials are resolved by the server; evidence is redacted before storage.
      </footer>
    </div>
  );
};
export default WorkbenchContent;
