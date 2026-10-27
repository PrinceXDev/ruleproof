'use client';

import { useEffect, useState } from 'react';
import { workbenchRequest, type AuditEvent } from '@/lib/workbench';
import Activity from './Activity';

const RevisionActivity = ({ token, revisionId }: { token: string; revisionId?: string }) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!revisionId) return undefined;
    const abort = new AbortController();
    void workbenchRequest<AuditEvent[]>(
      token,
      `revisions/${revisionId}/events`,
      undefined,
      abort.signal,
    )
      .then((data) => {
        if (!abort.signal.aborted) setEvents(data);
      })
      .catch((failure: Error) => {
        if (!abort.signal.aborted) setError(failure.message);
      });
    return () => abort.abort();
  }, [token, revisionId]);
  return error ? (
    <p role="alert" className="text-sm text-fail">
      {error}
    </p>
  ) : (
    <Activity events={events} />
  );
};
export default RevisionActivity;
