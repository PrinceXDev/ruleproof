'use client';

import { LogOut } from 'lucide-react';
import { Pill } from './Controls';

import type { LoadedWorkbench } from './useWorkbench';

const WorkbenchHeader = ({ model }: { model: LoadedWorkbench }) => {
  const { session, signOut } = model;

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[.2em] text-brand">
            Authorization workbench
          </span>
          <Pill>{session.workspace}</Pill>
          {session.demo && <Pill>Local demo</Pill>}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Confidence in every permission.</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Reviewed contracts. Real requests. Evidence you can trace.
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <div className="text-right">
          <p className="font-medium">{session.name}</p>
          <p className="mt-1 capitalize text-ink-muted">
            {session.role}
            {session.separateReviewer ? ' · independent review' : ''}
          </p>
        </div>

        {!session.demo && (
          <button
            type="button"
            aria-label="Sign out"
            className="rounded-lg border border-border p-2 text-ink-muted"
            onClick={signOut}
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </header>
  );
};
export default WorkbenchHeader;
