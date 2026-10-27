'use client';

import { useEffect, useReducer } from 'react';
import {
  workbenchRequest,
  type AuditEvent,
  type Revision,
  type Session,
  type Suite,
} from '@/lib/workbench';
import { createSuiteState, suiteReducer } from '@/lib/workbenchState';

const useSuiteRevision = (token: string, session: Session) => {
  const [state, dispatch] = useReducer(suiteReducer, undefined, createSuiteState);
  const request = <T>(path: string, signal?: AbortSignal) =>
    workbenchRequest<T>(token, path, undefined, signal);

  useEffect(() => {
    const abort = new AbortController();
    const initialize = async () => {
      try {
        const [sample, revisions] = await Promise.all([
          workbenchRequest<Suite>(token, 'sample', undefined, abort.signal),
          workbenchRequest<Revision[]>(token, 'revisions', undefined, abort.signal),
        ]);
        const revision = revisions[0] ?? null;
        const events = revision
          ? await workbenchRequest<AuditEvent[]>(
              token,
              `revisions/${revision.id}/events`,
              undefined,
              abort.signal,
            )
          : [];
        const suite = revision?.suite ?? {
          ...sample,
          environment: session.environments[0]?.id ?? '',
          identities: sample.identities.map((identity) => ({
            ...identity,
            credential: session.demo ? identity.credential : '',
          })),
        };
        if (!abort.signal.aborted) dispatch({ type: 'loaded', suite, revision, revisions, events });
      } catch (error) {
        if (!abort.signal.aborted)
          dispatch({
            type: 'failed',
            message: error instanceof Error ? error.message : 'Unable to load suites',
          });
      }
    };
    void initialize();
    return () => abort.abort();
  }, [token, session]);

  const refresh = async (id: string) => {
    const [revisions, events] = await Promise.all([
      request<Revision[]>('revisions'),
      request<AuditEvent[]>(`revisions/${id}/events`),
    ]);
    dispatch({ type: 'refreshed', revisions, events });
  };
  const open = async (revision: Revision) => {
    const events = await request<AuditEvent[]>(`revisions/${revision.id}/events`);
    dispatch({
      type: 'loaded',
      suite: revision.suite,
      revision,
      revisions: state.revisions,
      events,
    });
  };
  const newSuite = async () => {
    const sample = await request<Suite>('sample');
    const suite = {
      ...sample,
      environment: session.environments[0]?.id ?? '',
      identities: sample.identities.map((identity) => ({
        ...identity,
        credential: session.demo ? identity.credential : '',
      })),
    };
    dispatch({ type: 'loaded', suite, revision: null, revisions: state.revisions, events: [] });
  };
  return {
    ...state,
    refresh,
    open,
    newSuite,
    dirty: JSON.stringify(state.suite) !== JSON.stringify(state.baseline),
    change: (suite: Suite) => dispatch({ type: 'changed', suite }),
    discard: () => dispatch({ type: 'discarded' }),
    saved: (revision: Revision) => dispatch({ type: 'saved', revision }),
    ran: (event: AuditEvent) => dispatch({ type: 'ran', event }),
  };
};
export default useSuiteRevision;
