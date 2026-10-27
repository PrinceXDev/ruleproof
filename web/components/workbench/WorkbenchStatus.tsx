import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import type { WorkbenchModel } from './useWorkbench';

const WorkbenchStatus = ({ model }: { model: WorkbenchModel }) => {
  const { error, validation, notice, busy, analysis } = model;
  const problem = error || validation;
  const message = problem || (busy ? `${busy}…` : notice);
  let Icon = ShieldCheck;
  if (problem) Icon = AlertTriangle;
  else if (busy) Icon = Loader2;
  return (
    <div className="space-y-3">
      {message && (
        <div
          aria-live="polite"
          role={problem ? 'alert' : 'status'}
          className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${problem ? 'border-fail/30 bg-fail/5 text-fail' : 'border-brand/20 bg-brand/5 text-brand'}`}
        >
          <Icon size={16} className={`mt-0.5 shrink-0 ${busy && !problem ? 'animate-spin' : ''}`} />
          <span>{message}</span>
        </div>
      )}
      {analysis?.conflicts.map((conflict) => (
        <div
          role="alert"
          key={conflict}
          className="rounded-lg border border-fail/30 bg-fail/5 p-4 text-sm text-fail"
        >
          <strong>Resolve before approval:</strong> {conflict}
        </div>
      ))}
    </div>
  );
};
export default WorkbenchStatus;
