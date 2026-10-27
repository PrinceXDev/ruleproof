import { CheckCheck, Download, Loader2, Play, Plus, RotateCcw, Save } from 'lucide-react';
import { Button, Pill } from './Controls';
import type { LoadedWorkbench } from './useWorkbench';

const SuiteActions = ({ model }: { model: LoadedWorkbench }) => {
  const { revision, dirty, busy, editable, analysis, validation, canApprove, readOnly } = model;
  let label = 'Awaiting review';
  let tone: 'neutral' | 'warning' | 'good' = 'neutral';

  if (dirty || !revision) {
    label = 'Unsaved changes';
    tone = 'warning';
  } else if (revision.approvedBy) {
    label = `Approved by ${revision.approvedBy}`;
    tone = 'good';
  }
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={tone}>{label}</Pill>
        {revision && (
          <code className="text-[10px] text-ink-muted" title={revision.hash}>
            {revision.hash.slice(0, 12)}
          </code>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {dirty && (
          <Button disabled={!!busy} onClick={model.discard}>
            <RotateCcw size={14} />
            Discard changes
          </Button>
        )}
        <Button
          disabled={!!busy || dirty || readOnly}
          onClick={() => {
            void model.newSuite();
          }}
        >
          <Plus size={14} />
          New suite
        </Button>
        <Button
          disabled={!!busy || !revision}
          onClick={() => {
            void model.exportBundle();
          }}
        >
          <Download size={14} />
          Export
        </Button>
        <Button
          disabled={!editable || (!dirty && !!revision) || !analysis || !!validation}
          onClick={() => {
            void model.save();
          }}
        >
          <Save size={14} />
          Save revision
        </Button>
        <Button
          disabled={!!busy || !canApprove || !revision}
          onClick={() => {
            void model.approve();
          }}
        >
          <CheckCheck size={14} />
          Approve
        </Button>
        <Button
          primary
          disabled={!!busy || dirty || !revision?.approvedBy || readOnly}
          onClick={() => {
            void model.run(() => model.setTab('Runs'));
          }}
        >
          {busy === 'Running checks' ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <Play size={14} />
          )}
          Run checks
        </Button>
      </div>
    </div>
  );
};
export default SuiteActions;
