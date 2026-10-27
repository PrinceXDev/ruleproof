'use client';

import { SUITE_LIMITS, DRIFT_KINDS } from '@/constants/workbench';

import type { Analysis, Drift, Suite } from '@/lib/workbench';
import { FileJson, GitCompareArrows, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button, Pill, cardClass } from './Controls';
import OperationCard from './OperationCard';

const Coverage = ({
  suite,
  analysis,
  onChange,
  onDrift,
  drift,
  disabled,
  onError,
}: {
  suite: Suite;
  analysis: Analysis | null;
  onChange: (suite: Suite) => void;
  onDrift: (spec: Record<string, unknown>) => Promise<void>;
  drift: Drift | null;
  disabled: boolean;
  onError: (error: string) => void;
}) => {
  const input = useRef<HTMLInputElement>(null);
  const driftInput = useRef<HTMLInputElement>(null);
  const [builder, setBuilder] = useState('');
  const read = async (file: File | undefined, compare: boolean) => {
    if (!file) return;
    try {
      if (file.size > SUITE_LIMITS.specBytes)
        throw new Error('OpenAPI documents must be at most 512 KiB.');
      const spec = JSON.parse(await file.text());
      if (!String(spec.openapi).startsWith('3.') || !spec.paths)
        throw new Error('Choose an OpenAPI 3 JSON document.');
      if (compare) await onDrift(spec);
      else onChange({ ...suite, spec, exclusions: {} });
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Import failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Every operation deserves a decision.</h2>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">
            Object, collection, search, and bulk endpoints are included. Coverage tracks the actual
            method, route, identity, and scope.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={disabled} onClick={() => input.current?.click()}>
            <Upload size={15} />
            Import OpenAPI
          </Button>
          <Button disabled={disabled} onClick={() => driftInput.current?.click()}>
            <GitCompareArrows size={15} />
            Compare spec
          </Button>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label="Import OpenAPI JSON"
        onChange={(e) => {
          void read(e.target.files?.[0], false);
          e.target.value = '';
        }}
      />
      <input
        ref={driftInput}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label="Compare OpenAPI JSON"
        onChange={(e) => {
          void read(e.target.files?.[0], true);
          e.target.value = '';
        }}
      />
      {drift && (
        <div className={`${cardClass} p-5`}>
          <h3 className="mb-3 font-medium">Changes from the saved revision</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {DRIFT_KINDS.map((kind) => (
              <div key={kind}>
                <Pill tone={drift[kind].length ? 'warning' : 'good'}>
                  {drift[kind].length} {kind}
                </Pill>
                {drift[kind].map((op) => (
                  <p key={op} className="mt-2 break-all font-mono text-xs text-ink-muted">
                    {op}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {!analysis && (
        <div className={`${cardClass} p-8 text-center text-sm text-ink-muted`}>
          <FileJson className="mx-auto mb-3" size={24} />
          Resolve the validation message to inspect this specification.
        </div>
      )}
      {analysis?.operations.map((op) => {
        const key = `${op.method} ${op.path}`;
        return (
          <OperationCard
            key={key}
            operation={op}
            suite={suite}
            disabled={disabled}
            builder={builder}
            setBuilder={setBuilder}
            onChange={onChange}
          />
        );
      })}
    </div>
  );
};
export default Coverage;
