'use client';

import { useState } from 'react';
import type { Execution, ExecutionDetail } from '@/lib/executions';
import { workbenchRequest, type Session } from '@/lib/workbench';
import { EXECUTION_EVENT_KINDS, EXECUTION_LABELS } from '@/constants/executions';
import Activity from './Activity';
import { Button, Field, Pill, cardClass, inputClass } from './Controls';

interface Props {
  run: Execution;
  token: string;
  session: Session;
  update: (id: string, action: 'cancel' | 'recover', reason?: string) => Promise<void>;
}
const ExecutionCard = ({ run, token, session, update }: Props) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<ExecutionDetail | null>(null);
  const active = ['running', 'cancelling'].includes(run.status);

  const operate = async (job: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await job();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Execution update failed');
    } finally {
      setBusy(false);
    }
  };

  const { evidence } = run;
  return (
    <article className={`${cardClass} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Pill tone={run.status === 'completed' ? 'good' : 'neutral'}>
              {EXECUTION_LABELS[run.status]}
            </Pill>
            <h3 className="text-sm font-medium">{run.environment}</h3>
            {run.recoveryRequired && !active && <Pill tone="bad">Recovery required</Pill>}
          </div>
          <p className="text-xs text-ink-muted">
            {run.actor} · {new Date(run.createdAt).toLocaleString()} · revision{' '}
            {run.revisionId.slice(0, 8)}
          </p>
          {run.currentCase && (
            <p className="font-mono text-xs">Last checkpoint: {run.currentCase}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="good">{evidence?.passed ?? 0} passed</Pill>
          <Pill tone={evidence?.failed ? 'bad' : 'neutral'}>{evidence?.failed ?? 0} failed</Pill>
          <Pill tone={evidence?.errors ? 'warning' : 'neutral'}>
            {evidence?.errors ?? 0} errors
          </Pill>
          {run.status === 'running' && session.role !== 'viewer' && (
            <Button
              disabled={busy}
              onClick={() => {
                void operate(() => update(run.id, 'cancel'));
              }}
            >
              Stop run
            </Button>
          )}
          <Button
            disabled={busy || !evidence}
            onClick={() => {
              void operate(async () => {
                if (detail) {
                  setDetail(null);
                  return;
                }
                setDetail(await workbenchRequest<ExecutionDetail>(token, `executions/${run.id}`));
              });
            }}
          >
            {detail ? 'Hide evidence' : 'Inspect evidence'}
          </Button>
        </div>
      </div>
      {run.recoveryRequired && !active && (
        <div className="space-y-3 border-t border-border bg-attn/5 p-5">
          <p className="text-sm">
            Some requests may have changed the target. Verify its state and confirm the previous
            worker has stopped before releasing this environment.
          </p>
          <p className="text-xs text-ink-muted">
            Recovery becomes available after {new Date(run.deadline).toLocaleTimeString()}.
            Interrupted requests are never replayed automatically.
          </p>
          {session.role === 'reviewer' && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-64 flex-1">
                <Field label="Recovery notes">
                  <input
                    className={inputClass}
                    value={reason}
                    maxLength={1000}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Record target inspection and worker shutdown"
                  />
                </Field>
              </div>
              <Button
                disabled={busy || reason.trim().length < 10 || !run.recoveryAvailable}
                onClick={() => {
                  void operate(() => update(run.id, 'recover', reason));
                }}
              >
                Confirm recovery and release
              </Button>
            </div>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="px-5 pb-4 text-sm text-fail">
          {error}
        </p>
      )}
      {detail?.evidence && (
        <div className="border-t border-border p-4">
          <Activity
            events={[
              {
                id: run.id,
                revisionId: run.revisionId,
                actor: run.actor,
                createdAt: run.createdAt,
                kind: EXECUTION_EVENT_KINDS[detail.status],
                content: detail.evidence,
              },
            ]}
          />
        </div>
      )}
    </article>
  );
};
export default ExecutionCard;
