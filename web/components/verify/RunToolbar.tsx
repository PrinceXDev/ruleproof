'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Check, Download, Share2 } from 'lucide-react';
import type { Run } from '@/lib/types';
import { reportPath } from '@/lib/report';
import { useFlag } from '@/hooks/useFlag';
import RunCounts from '../evidence/RunCounts';
import ToolbarButton from '../ui/ToolbarButton';

const RunToolbar = ({
  run,
  running,
  bypass,
  onBypassChange,
  onRun,
  onCancel,
  onExport,
}: {
  run: Run | null;
  running: boolean;
  bypass: boolean;
  onBypassChange: (on: boolean) => void;
  onRun: () => void;
  onCancel: () => void;
  onExport: () => Promise<void>;
}) => {
  const [exporting, setExporting] = useState(false);
  const [exported, flashExported] = useFlag<true>();
  const [sharedRunId, flashShared] = useFlag<string>();

  const handleShare = async () => {
    if (!run) return;
    const url = window.location.origin + reportPath(run.id);
    try {
      await navigator.clipboard.writeText(url);
      flashShared(run.id);
    } catch {
      // Clipboard can be blocked; opening the report still gives a copyable URL.
      window.open(url, '_blank', 'noopener');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport();
      flashExported(true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      data-verify-reveal
      className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-panel px-4 py-3"
    >
      <div className="flex items-center gap-4 text-sm">
        {run ? (
          <RunCounts run={run} />
        ) : (
          <span className="text-ink-muted">{running ? 'Running checks…' : 'Not yet run'}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label
          className={clsx(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink-muted',
            running ? 'opacity-50' : 'cursor-pointer hover:text-ink',
          )}
          title="For every check that expects a deny, also try HEAD, a trailing slash, an upper-case ID, a spoofed tenant header and a method override."
        >
          <input
            type="checkbox"
            checked={bypass}
            disabled={running}
            onChange={(e) => onBypassChange(e.target.checked)}
            className="size-3.5 accent-[var(--color-brand)]"
          />
          Try bypass variants
        </label>
        {run && !running && (
          <>
            <ToolbarButton onClick={handleExport} disabled={exporting}>
              {exported ? <Check size={14} className="text-pass" /> : <Download size={14} />}
              {exported ? 'Exported' : 'Export JSON'}
            </ToolbarButton>
            <ToolbarButton
              onClick={handleShare}
              title="Copy a read-only link to this run's evidence report"
            >
              {sharedRunId === run.id ? (
                <Check size={14} className="text-pass" />
              ) : (
                <Share2 size={14} />
              )}
              {sharedRunId === run.id ? 'Link copied' : 'Share report'}
            </ToolbarButton>
          </>
        )}
        {running ? (
          <ToolbarButton onClick={onCancel} className="px-3.5">
            Cancel
          </ToolbarButton>
        ) : (
          <button
            type="button"
            onClick={onRun}
            className="flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-1.5 text-sm font-medium text-brand-ink hover:opacity-90"
          >
            {run ? 'Run again' : 'Run checks'}
          </button>
        )}
      </div>
    </div>
  );
};

export default RunToolbar;
