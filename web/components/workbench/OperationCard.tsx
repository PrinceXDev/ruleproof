import type { Operation, Suite } from '@/lib/workbench';
import { Plus } from 'lucide-react';
import { Button, Field, Pill, cardClass, inputClass } from './Controls';
import MatrixBuilder from './MatrixBuilder';

interface Props {
  operation: Operation;
  suite: Suite;
  disabled: boolean;
  builder: string;
  setBuilder: (key: string) => void;
  onChange: (suite: Suite) => void;
}
const OperationCard = ({ operation, suite, disabled, builder, setBuilder, onChange }: Props) => {
  const operationKey = `${operation.method} ${operation.path}`;
  return (
    <article className={`${cardClass} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Pill>{operation.method}</Pill>
          <h3 className="break-all font-mono text-sm">{operation.path}</h3>
        </div>
        <Pill
          tone={(() => {
            if (operation.checks) {
              return 'good';
            }
            if (operation.exclusion) {
              return 'neutral';
            }
            return 'warning';
          })()}
        >
          {(() => {
            if (operation.checks) {
              return `${operation.checks} checks`;
            }
            if (operation.exclusion) {
              return 'Excluded with reason';
            }
            return 'Uncovered';
          })()}
        </Pill>
      </div>
      {operation.summary && <p className="mt-2 text-xs text-ink-muted">{operation.summary}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {operation.combinations.map((combo) => (
          <Pill key={combo} tone="good">
            {combo}
          </Pill>
        ))}
      </div>
      {operation.missing.length > 0 && (
        <details className="mt-3 text-xs text-ink-muted">
          <summary>{operation.missing.length} identity / scope combinations untested</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {operation.missing.map((combo) => (
              <Pill key={combo} tone="warning">
                {combo}
              </Pill>
            ))}
          </div>
        </details>
      )}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Field label="Exclusion reason · optional">
            <input
              disabled={disabled}
              className={inputClass}
              value={suite.exclusions?.[operationKey] ?? ''}
              placeholder="Explain why this operation is out of scope"
              onChange={(e) => {
                const exclusions = { ...suite.exclusions };
                if (e.target.value) exclusions[operationKey] = e.target.value;
                else delete exclusions[operationKey];
                onChange({ ...suite, exclusions });
              }}
            />
          </Field>
        </div>
        <Button
          disabled={disabled}
          onClick={() => setBuilder(builder === operationKey ? '' : operationKey)}
        >
          <Plus size={14} />
          Build matrix
        </Button>
      </div>
      {builder === operationKey && (
        <MatrixBuilder
          operation={operation}
          suite={suite}
          onChange={onChange}
          onClose={() => setBuilder('')}
        />
      )}
    </article>
  );
};
export default OperationCard;
