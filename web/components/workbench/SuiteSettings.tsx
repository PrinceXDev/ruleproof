import { Field, cardClass, inputClass } from './Controls';
import SuiteActions from './SuiteActions';
import type { LoadedWorkbench } from './useWorkbench';

const SuiteSettings = ({ model }: { model: LoadedWorkbench }) => {
  const { session, suite, revision, revisions, busy, dirty, editable, change } = model;
  return (
    <section className={`${cardClass} p-5`}>
      <div className="grid gap-4 lg:grid-cols-[minmax(180px,1fr)_220px_260px]">
        <Field label="Suite name">
          <input
            className={inputClass}
            maxLength={120}
            disabled={!editable}
            value={suite.name}
            onChange={(event) => change({ ...suite, name: event.target.value })}
          />
        </Field>
        <Field label="Environment">
          <select
            className={inputClass}
            disabled={!editable}
            value={suite.environment}
            onChange={(event) => change({ ...suite, environment: event.target.value })}
          >
            {session.environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Saved revision"
          hint={dirty ? 'Save or discard changes to switch revisions.' : undefined}
        >
          <select
            aria-label="Saved revision"
            className={inputClass}
            disabled={!!busy || dirty}
            value={revision?.id ?? ''}
            onChange={(event) => {
              const next = revisions.find((item) => item.id === event.target.value);
              if (next) {
                void model.openRevision(next);
              }
            }}
          >
            <option value="">Unsaved draft</option>
            {revisions.map((item, index) => (
              <option key={item.id} value={item.id}>
                {item.suite.name} · {revisions.length - index} ·{' '}
                {item.approvedBy ? 'approved' : 'review needed'}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <details className="mt-4">
        <summary className="text-xs text-ink-muted">Rule, build context, and data version</summary>
        <div className="mt-4 space-y-4">
          <Field label="Rule statement">
            <textarea
              className={inputClass}
              rows={2}
              maxLength={16000}
              disabled={!editable}
              value={suite.ruleText}
              onChange={(event) => change({ ...suite, ruleText: event.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Build commit">
              <input
                className={inputClass}
                disabled={!editable}
                value={suite.buildCommit ?? ''}
                placeholder="Git commit deployed to this environment"
                onChange={(event) => change({ ...suite, buildCommit: event.target.value })}
              />
            </Field>
            <Field label="Test data version">
              <input
                className={inputClass}
                disabled={!editable}
                value={suite.dataVersion ?? ''}
                onChange={(event) => change({ ...suite, dataVersion: event.target.value })}
              />
            </Field>
          </div>
        </div>
      </details>
      <SuiteActions model={model} />
      {session.separateReviewer && revision?.author === session.name && !revision.approvedBy && (
        <p className="mt-3 text-xs text-attn">Another reviewer must approve your revision.</p>
      )}
    </section>
  );
};
export default SuiteSettings;
