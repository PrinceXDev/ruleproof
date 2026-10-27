'use client';

import { useRef, useState } from 'react';
import {
  downloadJSON,
  workbenchRequest,
  type AuditEvent,
  type Drift,
  type Revision,
} from '@/lib/workbench';
import type useSuiteRevision from './useSuiteRevision';

const useWorkbenchActions = (token: string, draft: ReturnType<typeof useSuiteRevision>) => {
  const [status, setStatus] = useState({ busy: '', error: '', notice: '' });
  const [drift, setDrift] = useState<Drift | null>(null);
  const active = useRef(false);
  const request = <T>(path: string, body?: unknown) => workbenchRequest<T>(token, path, body);
  const perform = async (name: string, job: () => Promise<string>) => {
    if (active.current) return;
    active.current = true;
    setStatus({ busy: name, error: '', notice: '' });
    try {
      const notice = await job();
      setStatus({ busy: '', error: '', notice });
    } catch (error) {
      setStatus({
        busy: '',
        error: error instanceof Error ? error.message : 'Request failed',
        notice: '',
      });
    } finally {
      active.current = false;
    }
  };
  const save = () =>
    perform('Saving', async () => {
      const saved = await request<Revision>('revisions', {
        parentId: draft.revision?.id ?? '',
        suite: draft.suite,
      });
      draft.saved(saved);
      await draft.refresh(saved.id);
      return 'Revision saved. Review and approve this exact contract.';
    });
  const approve = () =>
    perform('Approving', async () => {
      const approved = await request<Revision>(`revisions/${draft.revision!.id}/approve`, {});
      draft.saved(approved);
      await draft.refresh(approved.id);
      return 'Revision approved and ready to verify.';
    });
  const run = (onComplete: () => void) =>
    perform('Running checks', async () => {
      const event = await request<AuditEvent>(`revisions/${draft.revision!.id}/run`, {});
      draft.ran(event);
      onComplete();
      return 'Execution recorded. Inspect each result below.';
    });
  const exportBundle = () =>
    perform('Exporting', async () => {
      downloadJSON('ruleproof-suite.json', await request(`revisions/${draft.revision!.id}/export`));
      return 'Exported the saved revision and its evidence.';
    });
  const openRevision = (revision: Revision) =>
    perform('Loading revision', async () => {
      await draft.open(revision);
      setDrift(null);
      return '';
    });
  const newSuite = () =>
    perform('New suite', async () => {
      await draft.newSuite();
      setDrift(null);
      return '';
    });
  const compareSpec = async (spec: Record<string, unknown>) => {
    if (!draft.revision) throw new Error('Save a revision before comparing specifications.');
    setDrift(await request<Drift>(`revisions/${draft.revision.id}/drift`, { spec }));
  };
  return {
    ...status,
    drift,
    save,
    approve,
    run,
    exportBundle,
    openRevision,
    newSuite,
    compareSpec,
    setError: (error: string) => setStatus((previous) => ({ ...previous, error })),
    clearNotice: () => setStatus((previous) => ({ ...previous, notice: '' })),
  };
};
export default useWorkbenchActions;
