'use client';

import { SUITE_LIMITS } from '@/constants/workbench';

import type { Suite, SuiteCase } from '@/lib/workbench';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import CheckTable from './CheckTable';
import CheckDetails from './CheckDetails';
import { Button, cardClass } from './Controls';

const CheckEditor = ({
  suite,
  onChange,
  disabled,
}: {
  suite: Suite;
  onChange: (suite: Suite) => void;
  disabled: boolean;
}) => {
  const [selected, setSelected] = useState(suite.cases[0]?.id ?? '');
  const [filter, setFilter] = useState('');
  const current = suite.cases.find((c) => c.id === selected);
  const update = (patch: Partial<SuiteCase>) =>
    onChange({
      ...suite,
      cases: suite.cases.map((c) => (c.id === selected ? { ...c, ...patch } : c)),
    });
  const add = () => {
    const id = `check-${crypto.randomUUID().slice(0, 8)}`;
    onChange({
      ...suite,
      cases: [
        ...suite.cases,
        {
          id,
          identityId: suite.identities[0]?.id ?? '',
          scope: 'own',
          method: 'GET',
          path: '/assets/a1',
          expectedStatus: 200,
        },
      ],
    });
    setSelected(id);
  };
  const move = (direction: number) => {
    const cases = [...suite.cases];
    const i = cases.findIndex((c) => c.id === selected);
    if (i + direction < 0 || i + direction >= cases.length) return;
    [cases[i], cases[i + direction]] = [cases[i + direction], cases[i]];
    onChange({ ...suite, cases });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Permission matrix</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Each row is an explicit expectation. Select a check to add deeper assertions.
          </p>
        </div>
        <Button disabled={disabled || suite.cases.length >= SUITE_LIMITS.checks} onClick={add}>
          <Plus size={15} />
          Add check
        </Button>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <CheckTable
          suite={suite}
          selected={selected}
          filter={filter}
          setFilter={setFilter}
          setSelected={setSelected}
        />
        {current ? (
          <CheckDetails
            key={current.id}
            current={current}
            suite={suite}
            disabled={disabled}
            selected={selected}
            move={move}
            onChange={onChange}
            setSelected={setSelected}
            update={update}
          />
        ) : (
          <div className={`${cardClass} p-10 text-center text-sm text-ink-muted`}>
            Select a check to review its request and assertions.
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckEditor;
