import { HTTP_METHODS, REQUEST_SCOPES } from '@/constants/workbench';
import type { Suite, SuiteCase } from '@/lib/workbench';
import { Field, inputClass } from './Controls';

const RequestEditor = ({
  current,
  suite,
  update,
}: {
  current: SuiteCase;
  suite: Suite;
  update: (patch: Partial<SuiteCase>) => void;
}) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Identity">
        <select
          className={inputClass}
          value={current.identityId}
          onChange={(e) => update({ identityId: e.target.value })}
        >
          {suite.identities.map((id) => (
            <option key={id.id} value={id.id}>
              {id.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Scope">
        <input
          className={inputClass}
          value={current.scope}
          onChange={(e) => update({ scope: e.target.value })}
          list="suite-scopes"
        />
        <datalist id="suite-scopes">
          {REQUEST_SCOPES.map((scope) => (
            <option key={scope} value={scope}>
              {scope}
            </option>
          ))}
        </datalist>
      </Field>
    </div>
    <div className="grid grid-cols-[100px_1fr] gap-3">
      <Field label="Method">
        <select
          className={inputClass}
          value={current.method}
          onChange={(e) => update({ method: e.target.value })}
        >
          {HTTP_METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </Field>
      <Field label="Expected status">
        <input
          className={inputClass}
          type="number"
          min={200}
          max={599}
          value={current.expectedStatus}
          onChange={(e) => update({ expectedStatus: Number(e.target.value) })}
        />
      </Field>
    </div>
    <Field label="Request path" hint="Use a concrete resource ID and query parameters when needed.">
      <input
        className={`${inputClass} font-mono`}
        value={current.path}
        onChange={(e) => update({ path: e.target.value })}
      />
    </Field>
    <Field label="Request body · JSON">
      <textarea
        rows={3}
        className={`${inputClass} font-mono text-xs`}
        value={current.body ?? ''}
        onChange={(e) => update({ body: e.target.value })}
        placeholder='{"name":"Updated asset"}'
      />
    </Field>
    <Field
      label="Ordered scenario"
      hint="Checks with the same scenario name run in table order. A failure blocks later steps in that scenario."
    >
      <input
        className={inputClass}
        value={current.scenario ?? ''}
        onChange={(e) => update({ scenario: e.target.value })}
        placeholder="e.g. grant-read-revoke"
      />
    </Field>
  </>
);
export default RequestEditor;
