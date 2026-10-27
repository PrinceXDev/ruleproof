'use client';

import { useState } from 'react';
import type { Session, Suite } from '@/lib/workbench';
import type { WorkbenchTab } from '@/constants/workbench';
import useSuiteRevision from '@/hooks/workbench/useSuiteRevision';
import useSuiteAnalysis from '@/hooks/workbench/useSuiteAnalysis';
import useWorkbenchActions from '@/hooks/workbench/useWorkbenchActions';

const useWorkbench = (token: string, session: Session, signOut: () => void) => {
  const draft = useSuiteRevision(token, session);
  const inspection = useSuiteAnalysis(token, draft.suite);
  const actions = useWorkbenchActions(token, draft);
  const [tab, setTab] = useState<WorkbenchTab>('Checks');
  const readOnly = session.role === 'viewer';
  const canApprove =
    session.role === 'reviewer' &&
    !draft.dirty &&
    !draft.revision?.approvedBy &&
    !!inspection.analysis &&
    !inspection.validation &&
    !inspection.analysis.gaps &&
    !inspection.analysis.conflicts.length &&
    (!session.separateReviewer || draft.revision?.author !== session.name);

  return {
    session,
    signOut,
    tab,
    setTab,
    readOnly,
    canApprove,
    suite: draft.suite,
    revision: draft.revision,
    revisions: draft.revisions,
    events: draft.events,
    dirty: draft.dirty,
    loading: draft.loading,
    editorVersion: draft.editorVersion,
    editable: !readOnly && !actions.busy,
    change: (suite: Suite) => {
      draft.change(suite);
      actions.clearNotice();
    },
    discard: draft.discard,
    ...inspection,
    ...actions,
    error: actions.error || draft.error,
  };
};
export default useWorkbench;
export type WorkbenchModel = ReturnType<typeof useWorkbench>;
export type LoadedWorkbench = WorkbenchModel & { suite: Suite };
