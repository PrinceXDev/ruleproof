'use client';

import { useEffect, useState } from 'react';
import { workbenchRequest, type Session } from '@/lib/workbench';

interface Connection {
  attempt: number;
  token: string;
  session: Session | null;
  loading: boolean;
  error: string;
}

const useWorkspaceSession = () => {
  const [connection, setConnection] = useState<Connection>({
    attempt: 0,
    token: '',
    session: null,
    loading: true,
    error: '',
  });
  const { token, attempt } = connection;
  useEffect(() => {
    const abort = new AbortController();
    workbenchRequest<Session>(token, 'session', undefined, abort.signal)
      .then((session) => {
        if (!abort.signal.aborted)
          setConnection({ attempt, token, session, loading: false, error: '' });
      })
      .catch((error: unknown) => {
        if (!abort.signal.aborted)
          setConnection({
            attempt,
            token,
            session: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Unable to connect to workspace',
          });
      });
    return () => abort.abort();
  }, [token, attempt]);

  const signIn = (value: string) =>
    setConnection((previous) => ({
      attempt: previous.attempt + 1,
      token: value,
      session: null,
      loading: true,
      error: '',
    }));
  const signOut = () =>
    setConnection((previous) => ({
      attempt: previous.attempt + 1,
      token: '',
      session: null,
      loading: false,
      error: '',
    }));

  return { ...connection, signIn, signOut };
};
export default useWorkspaceSession;
