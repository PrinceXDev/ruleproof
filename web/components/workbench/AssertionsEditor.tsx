'use client';

import type { Assertion, SuiteCase } from '@/lib/workbench';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ASSERTION_OPERATORS, VALUE_OPERATORS, SUITE_LIMITS } from '@/constants/workbench';
import { inputClass } from './Controls';

const AssertionValue = ({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) => {
  const [raw, setRaw] = useState(JSON.stringify(value === undefined ? '' : value));
  const [invalid, setInvalid] = useState(false);
  return (
    <div>
      <input
        aria-label="Expected JSON value"
        className={inputClass}
        value={raw}
        aria-invalid={invalid}
        onChange={(e) => {
          setRaw(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setInvalid(false);
          } catch {
            setInvalid(true);
            onChange(undefined);
          }
        }}
      />
      {invalid && (
        <p role="alert" className="mt-1 text-xs text-fail">
          Enter a JSON value, for example &quot;A&quot;, 2, or true. Saving is blocked until this
          value is valid.
        </p>
      )}
    </div>
  );
};
const AssertionsEditor = ({
  current,
  update,
}: {
  current: SuiteCase;
  update: (patch: Partial<SuiteCase>) => void;
}) => {
  const [keys, setKeys] = useState(() => current.assertions?.map(() => crypto.randomUUID()) ?? []);
  const assertion = (i: number, patch: Partial<Assertion>) =>
    update({
      assertions: current?.assertions?.map((a, index) => (index === i ? { ...a, ...patch } : a)),
    });
  return (
    <div className="border-t border-border pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium">Response assertions</h4>
        <button
          type="button"
          className="text-xs text-brand"
          disabled={(current.assertions?.length ?? 0) >= SUITE_LIMITS.assertions}
          onClick={() => {
            setKeys([...keys, crypto.randomUUID()]);
            update({
              assertions: [
                ...(current.assertions ?? []),
                { path: '/tenant', operator: 'equals', value: 'A' },
              ],
            });
          }}
        >
          + Add assertion
        </button>
      </div>
      {current.assertions?.map((a, i) => (
        <div key={keys[i]} className="mb-3 space-y-2 rounded-lg border border-border p-3">
          <div className="flex gap-2">
            <input
              aria-label={`Assertion ${i + 1} JSON pointer`}
              className={`${inputClass} min-w-0 font-mono text-xs`}
              value={a.path}
              onChange={(e) => assertion(i, { path: e.target.value })}
              placeholder="/items/*/tenant"
            />
            <button
              type="button"
              aria-label={`Remove assertion ${i + 1}`}
              onClick={() => {
                setKeys(keys.filter((_, index) => index !== i));
                update({
                  assertions: current.assertions?.filter((_, index) => i !== index),
                });
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
          <select
            aria-label={`Assertion ${i + 1} operator`}
            className={inputClass}
            value={a.operator}
            onChange={(e) =>
              assertion(i, {
                operator: e.target.value as Assertion['operator'],
              })
            }
          >
            {ASSERTION_OPERATORS.map((operator) => (
              <option key={operator.value} value={operator.value}>
                {operator.label}
              </option>
            ))}
          </select>
          {VALUE_OPERATORS.includes(a.operator) && (
            <AssertionValue value={a.value} onChange={(value) => assertion(i, { value })} />
          )}
        </div>
      ))}
      <p className="text-[11px] leading-relaxed text-ink-muted">
        Pointers use /field or /items/*/tenant. “Every array item” fails on an empty array; use
        equals [] when emptiness is expected.
      </p>
    </div>
  );
};
export default AssertionsEditor;
