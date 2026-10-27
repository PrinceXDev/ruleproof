'use client';

import { useRef } from 'react';
import { GitBranch, Loader2, Upload } from 'lucide-react';
import type { Revision } from '@/lib/workbench';
import { Button, cardClass } from './Controls';

interface Props {
  revision: Revision | null;
  dirty: boolean;
  loading: boolean;
  error: string;
  analyze: (file: File | undefined) => Promise<void>;
}

const ImpactUpload = ({ revision, dirty, loading, error, analyze }: Props) => {
  const input = useRef<HTMLInputElement>(null);

  return (
    <section className={`${cardClass} p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-brand">
            <GitBranch size={16} />
            Authorization impact analysis
          </p>
          <h2 className="mt-3 text-xl font-semibold">Understand what a change puts at risk.</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Compare a candidate OpenAPI document with this saved revision. Trace changed operations
            and shared dependencies to permission checks, protected-state observers, and complete
            scenarios.
          </p>
        </div>
        <Button
          primary
          disabled={!revision || dirty || loading}
          onClick={() => input.current?.click()}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          Analyze candidate spec
        </Button>
      </div>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label="Candidate OpenAPI JSON for impact analysis"
        onChange={(event) => {
          const { currentTarget } = event;
          void analyze(currentTarget.files?.[0]);
          currentTarget.value = '';
        }}
      />
      <p className="mt-4 text-xs text-ink-muted">
        {revision
          ? `Baseline: ${revision.suite.name} · revision ${revision.id.slice(0, 8)}`
          : 'Save a revision to establish a comparison baseline.'}
      </p>
      {dirty && (
        <p role="status" className="mt-3 text-sm text-attn">
          Save or discard your edits before analyzing the saved contract.
        </p>
      )}
      {loading && (
        <p role="status" className="mt-3 text-sm text-ink-muted">
          Tracing specification dependencies…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-fail">
          {error}
        </p>
      )}
    </section>
  );
};
export default ImpactUpload;
