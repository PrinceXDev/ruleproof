import type { Suite, SuiteCase } from '@/lib/workbench';
import { Field, inputClass } from './Controls';

const StateEditor = ({
  current,
  suite,
  update,
}: {
  current: SuiteCase;
  suite: Suite;
  update: (patch: Partial<SuiteCase>) => void;
}) => (
  <div className="border-t border-border pt-4">
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="accent-brand"
        checked={!!current.state}
        onChange={(e) =>
          update({
            state: e.target.checked
              ? {
                  path: current.path,
                  pointer: '',
                  identityId: suite.identities[0]?.id ?? '',
                }
              : undefined,
          })
        }
      />
      Verify protected state is unchanged
    </label>
    {current.state && (
      <div className="mt-3 space-y-3">
        <Field label="Observer identity">
          <select
            className={inputClass}
            value={current.state.identityId}
            onChange={(e) =>
              update({
                state: {
                  ...current.state!,
                  identityId: e.target.value,
                },
              })
            }
          >
            {suite.identities.map((id) => (
              <option key={id.id} value={id.id}>
                {id.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="State read path">
          <input
            className={inputClass}
            value={current.state.path}
            onChange={(e) =>
              update({
                state: { ...current.state!, path: e.target.value },
              })
            }
          />
        </Field>
        <Field label="State pointer" hint="Leave empty to compare the whole JSON document.">
          <input
            className={inputClass}
            value={current.state.pointer}
            onChange={(e) =>
              update({
                state: {
                  ...current.state!,
                  pointer: e.target.value,
                },
              })
            }
          />
        </Field>
      </div>
    )}
  </div>
);
export default StateEditor;
