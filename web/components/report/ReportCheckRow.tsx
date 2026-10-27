import clsx from 'clsx';
import type { CheckResult, PlanCase } from '@/lib/types';
import { ACTION_LABEL, ROLE_LABEL, SCOPE_LABEL } from '@/constants/labels';
import { ResultBadge } from '../evidence/StatusBadges';
import RequestBlock from '../evidence/RequestBlock';
import ResponseBody from '../evidence/ResponseBody';
import LabeledSection from '../ui/LabeledSection';

// One check (or bypass attempt) that expands to its request and response.
const ReportCheckRow = ({ result, planCase }: { result: CheckResult; planCase?: PlanCase }) => {
  const { variant } = result;
  return (
    <li className={clsx('bg-panel', result.verdict === 'fail' && 'border-l-2 border-l-fail')}>
      <details className="group">
        <summary className="flex list-none flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 text-sm hover:bg-panel-elevated">
          <ResultBadge verdict={result.verdict} isVariant={Boolean(variant)} />
          <div className="min-w-0 flex-1">
            <div className="text-ink">
              {variant && <span>{variant.label} · </span>}
              {planCase ? (
                <>
                  {ROLE_LABEL[planCase.role]} {ACTION_LABEL[planCase.action].toLowerCase()}
                  <span className="text-ink-muted">
                    , {SCOPE_LABEL[planCase.scope].toLowerCase()}
                  </span>
                </>
              ) : (
                result.rule
              )}
            </div>
            <div className="mt-0.5 break-all font-mono-tnum text-xs text-ink-faint">
              {result.method} {result.path}
            </div>
          </div>
          <span className="font-mono-tnum text-xs text-ink-muted">
            {variant ? 'refusal' : result.expected_status} →{' '}
            <span className={result.verdict === 'pass' ? 'text-pass' : 'text-fail'}>
              {result.actual_status ?? 'no response'}
            </span>
          </span>
        </summary>

        <div className="space-y-4 border-t border-border bg-canvas/40 px-4 py-4 text-sm">
          {variant && <p className="text-ink-muted">{variant.why}</p>}
          <LabeledSection label="Request">
            <RequestBlock result={result} planCase={planCase} />
          </LabeledSection>
          <LabeledSection
            label={`Response · ${result.actual_status ?? 'none'} · ${result.duration_ms} ms`}
          >
            <ResponseBody body={result.body} />
          </LabeledSection>
          <LabeledSection label="Assertion">
            <p className="text-xs text-ink-muted">{result.detail}</p>
          </LabeledSection>
        </div>
      </details>
    </li>
  );
};

export default ReportCheckRow;
