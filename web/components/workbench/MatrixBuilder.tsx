'use client';

import { SUITE_LIMITS } from '@/constants/workbench';

import type { Operation, Suite } from '@/lib/workbench';
import { useState } from 'react';
import { Button, Field, inputClass } from './Controls';

const MatrixBuilder = ({
  operation,
  suite,
  onChange,
  onClose,
}: {
  operation: Operation;
  suite: Suite;
  onChange: (suite: Suite) => void;
  onClose: () => void;
}) => {
  const [own, setOwn] = useState('');
  const [other, setOther] = useState('');
  const [ownStatus, setOwnStatus] = useState(200);
  const [otherStatus, setOtherStatus] = useState(403);

  return (
    <div className="mt-4 rounded-lg border border-brand/25 bg-brand/5 p-4">
      <h4 className="text-sm font-medium">Generate explicit identity × scope checks</h4>
      <p className="mt-1 text-xs text-ink-muted">
        Applies these reviewed expectations to all {suite.identities.length} identities. Adjust
        individual rows in Checks.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Own-scope concrete path">
          <input
            className={inputClass}
            placeholder={operation.path}
            value={own}
            onChange={(e) => setOwn(e.target.value)}
          />
        </Field>
        <Field label="Other-scope concrete path">
          <input
            className={inputClass}
            placeholder={operation.path}
            value={other}
            onChange={(e) => setOther(e.target.value)}
          />
        </Field>
        <Field label="Own-scope expected status">
          <input
            type="number"
            min={200}
            max={599}
            className={inputClass}
            value={ownStatus}
            onChange={(e) => setOwnStatus(Number(e.target.value))}
          />
        </Field>
        <Field label="Other-scope expected status">
          <input
            type="number"
            min={200}
            max={599}
            className={inputClass}
            value={otherStatus}
            onChange={(e) => setOtherStatus(Number(e.target.value))}
          />
        </Field>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          primary
          disabled={
            !own.startsWith('/') ||
            !other.startsWith('/') ||
            /[{}]/.test(own + other) ||
            suite.cases.length + suite.identities.length * 2 > SUITE_LIMITS.checks
          }
          onClick={() => {
            const cases = suite.identities.flatMap((id) =>
              [
                { scope: 'own', path: own, expectedStatus: ownStatus },
                { scope: 'other', path: other, expectedStatus: otherStatus },
              ].map((c) => ({
                ...c,
                id: `check-${crypto.randomUUID().slice(0, 8)}`,
                identityId: id.id,
                method: operation.method,
              })),
            );
            onChange({ ...suite, cases: [...suite.cases, ...cases] });
            onClose();
          }}
        >
          Add {suite.identities.length * 2} checks
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
};
export default MatrixBuilder;
