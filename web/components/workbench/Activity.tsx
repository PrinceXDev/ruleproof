'use client';

import type { AuditEvent, Evidence } from '@/lib/workbench';
import { CheckCircle2, ChevronDown, Clock3, FileCheck2, Play } from 'lucide-react';
import { useState } from 'react';
import { Pill, cardClass } from './Controls';

const Activity = ({ events }: { events: AuditEvent[] }) => {
  const [selected, setSelected] = useState<string | null>(null);
  if (!events.length)
    return (
      <div className={`${cardClass} p-12 text-center`}>
        <Clock3 size={28} className="mx-auto mb-3 text-ink-muted" />
        <h2 className="font-medium">Your evidence trail starts here.</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Save a revision to record its author, approvals, and executions.
        </p>
      </div>
    );
  return (
    <div className="space-y-4">
      {events.map((event) => {
        const run = event.kind === 'run' ? (event.content as Evidence) : null;
        const Icon = (() => {
          if (run) {
            return Play;
          }
          if (event.kind === 'approved') {
            return CheckCircle2;
          }
          return FileCheck2;
        })();
        return (
          <article key={event.id} className={`${cardClass} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-panel-elevated p-2.5 text-brand">
                  <Icon size={17} />
                </span>
                <div>
                  <h3 className="text-sm font-medium">
                    {(() => {
                      if (run) {
                        return 'Verification completed';
                      }
                      if (event.kind === 'approved') {
                        return 'Revision approved';
                      }
                      return 'Revision created';
                    })()}
                  </h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    {event.actor} · {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {run && (
                <div className="flex gap-2">
                  <Pill tone="good">{run.passed} passed</Pill>
                  <Pill tone={run.failed ? 'bad' : 'neutral'}>{run.failed} failed</Pill>
                  <Pill tone={run.errors ? 'warning' : 'neutral'}>{run.errors} errors</Pill>
                </div>
              )}
            </div>
            {run && (
              <>
                <div className="flex flex-wrap gap-x-6 gap-y-2 border-y border-border bg-canvas/40 px-5 py-3 text-[11px] text-ink-muted">
                  <span>
                    Environment <strong className="ml-1 text-ink">{run.environment}</strong>
                  </span>
                  <span>
                    Build <code>{run.buildCommit || 'Not recorded'}</code>
                  </span>
                  <span>
                    Data <code>{run.dataVersion || 'Not recorded'}</code>
                  </span>
                  <span title={run.suiteHash}>
                    Suite <code>{run.suiteHash.slice(0, 12)}</code>
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {run.results.map((result) => {
                    const key = `${event.id}/${result.id}`;
                    const open = selected === key;
                    return (
                      <div key={key}>
                        <button
                          type="button"
                          onClick={() => setSelected(open ? null : key)}
                          aria-expanded={open}
                          className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-panel-elevated"
                        >
                          <Pill
                            tone={(() => {
                              if (result.verdict === 'pass') {
                                return 'good';
                              }
                              if (result.verdict === 'fail') {
                                return 'bad';
                              }
                              return 'warning';
                            })()}
                          >
                            {result.verdict}
                          </Pill>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-mono text-xs">
                              {result.method} {result.path}
                            </p>
                            <p className="mt-1 text-[11px] text-ink-muted">
                              {result.actor} · expected {result.expected_status} · observed{' '}
                              {result.actual_status ?? '—'}
                            </p>
                          </div>
                          <span className="text-xs text-ink-muted">{result.duration_ms} ms</span>
                          <ChevronDown size={14} className={open ? 'rotate-180' : ''} />
                        </button>
                        {open && (
                          <div className="space-y-3 border-t border-border bg-canvas/60 p-5">
                            <p className="text-sm">{result.detail}</p>
                            {result.assertionResults
                              ?.map((a, occurrence) => ({
                                ...a,
                                key: `${a.path}-${a.operator}-${occurrence}`,
                              }))
                              .map((a) => (
                                <div key={a.key} className="flex items-center gap-2 text-xs">
                                  <Pill tone={a.passed ? 'good' : 'bad'}>
                                    {a.passed ? 'passed' : 'failed'}
                                  </Pill>
                                  <code>{a.path || '/ (document)'}</code>
                                  <span className="text-ink-muted">{a.operator}</span>
                                </div>
                              ))}
                            <div className="flex gap-2">
                              {result.redacted && <Pill>Redacted before storage</Pill>}
                              {result.truncated && (
                                <Pill tone="warning">Evidence preview truncated</Pill>
                              )}
                            </div>
                            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-canvas p-4 text-xs text-ink-muted">
                              {result.body || 'No response body captured.'}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </article>
        );
      })}
    </div>
  );
};

export default Activity;
