import type { Suite, SuiteCase } from '@/lib/workbench';
import { ArrowDown, ArrowUp, ShieldCheck, Trash2 } from 'lucide-react';
import AssertionsEditor from './AssertionsEditor';
import { cardClass } from './Controls';
import RequestEditor from './RequestEditor';
import StateEditor from './StateEditor';

const CheckDetails = ({
  current,
  suite,
  disabled,
  selected,
  move,
  onChange,
  setSelected,
  update,
}: {
  current: SuiteCase;
  suite: Suite;
  disabled: boolean;
  selected: string;
  move: (n: number) => void;
  onChange: (s: Suite) => void;
  setSelected: (s: string) => void;
  update: (p: Partial<SuiteCase>) => void;
}) => (
  <section className={`${cardClass} p-5`} key={current.id}>
    <div className="mb-5 flex items-center justify-between">
      <h3 className="flex items-center gap-2 font-medium">
        <ShieldCheck size={16} className="text-brand" />
        Check details
      </h3>
      <div className="flex gap-1">
        <button
          type="button"
          aria-label="Move check earlier"
          disabled={disabled || suite.cases[0]?.id === selected}
          className="rounded p-1.5 disabled:opacity-25"
          onClick={() => move(-1)}
        >
          <ArrowUp size={15} />
        </button>
        <button
          type="button"
          aria-label="Move check later"
          disabled={disabled || suite.cases.at(-1)?.id === selected}
          className="rounded p-1.5 disabled:opacity-25"
          onClick={() => move(1)}
        >
          <ArrowDown size={15} />
        </button>
        <button
          type="button"
          aria-label="Delete check"
          disabled={disabled}
          className="rounded p-1.5 text-ink-muted hover:text-fail"
          onClick={() => {
            onChange({
              ...suite,
              cases: suite.cases.filter((c) => c.id !== selected),
            });
            setSelected('');
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
    <fieldset disabled={disabled} className="space-y-4">
      <RequestEditor current={current} suite={suite} update={update} />
      <AssertionsEditor current={current} update={update} />
      <StateEditor current={current} suite={suite} update={update} />
    </fieldset>
  </section>
);
export default CheckDetails;
