import { ArrowRight, CornerDownRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SAMPLE_CASES } from '@/constants/landing-demo';
import { DEMO_EYEBROW } from '@/constants/landing-styles';

const EvidencePanel = ({ selected, fixed }: { selected: number; fixed: boolean }) => {
  const c = SAMPLE_CASES[selected];
  const actual = !fixed && c.action === 'read' ? 200 : c.expected;
  const pass = actual === c.expected;
  const excerpt = (() => {
    if (c.scope === 'other') {
      return "Neither role can access another tenant's assets.";
    }
    if (c.role === 'editor' && c.action === 'update') {
      return 'Editors can also update them.';
    }
    return 'Viewers can read assets in their own tenant.';
  })();

  return (
    <aside
      data-evidence
      aria-label="Selected check evidence"
      aria-live="polite"
      className={cn(
        'rounded-xl border p-5',
        pass ? 'border-white/[.08] bg-white/[.02]' : 'border-fail/30 bg-fail/[.04]',
      )}
    >
      <div className="flex items-center justify-between">
        <span className={DEMO_EYEBROW}>Linked evidence · 0{selected + 1}</span>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            pass ? 'bg-pass/10 text-pass' : 'bg-fail/15 text-fail',
          )}
        >
          {pass ? 'Passed' : 'Failed'}
        </span>
      </div>
      <p className={cn(DEMO_EYEBROW, 'mt-5')}>Source rule</p>
      <blockquote className="mt-2 border-l-2 border-brand pl-3 text-[15px] text-ink">
        {excerpt}
      </blockquote>
      {c.role === 'viewer' && c.action === 'update' && c.scope === 'own' && (
        <p className="mt-2 text-xs text-ink-faint">
          Read-only viewer access implies updates are denied in this bounded parser.
        </p>
      )}
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg bg-black/30 p-4">
        <div>
          <p className={DEMO_EYEBROW}>Expected</p>
          <p className="mt-1 font-mono-tnum text-3xl font-semibold text-ink">
            {c.expected}
            <span className="ml-1.5 text-xs font-normal text-ink-faint">
              {c.expected === 200 ? 'allow' : 'deny'}
            </span>
          </p>
        </div>
        <ArrowRight className="text-ink-faint" size={18} />
        <div>
          <p className={DEMO_EYEBROW}>Actual</p>
          <p
            className={cn(
              'mt-1 font-mono-tnum text-3xl font-semibold',
              pass ? 'text-pass' : 'text-fail',
            )}
          >
            {actual}
          </p>
        </div>
      </div>
      <p className={cn(DEMO_EYEBROW, 'mt-5')}>Request · demo-{c.role}-a</p>
      <code className="mt-2 block rounded-md bg-black/30 px-3 py-2 font-mono text-xs text-ink">
        <span className="text-brand">{c.action === 'read' ? 'GET' : 'PUT'}</span> /assets/
        {c.scope === 'own' ? 'a1' : 'b1'}
        <span className="text-ink-faint"> · Authorization: Bearer ••••</span>
      </code>
      <p className={cn(DEMO_EYEBROW, 'mt-4')}>Response body</p>
      <pre className="mt-2 overflow-x-auto rounded-md bg-black/30 px-3 py-2 font-mono text-xs text-ink-muted">
        {actual === 200
          ? JSON.stringify(
              { asset: c.scope === 'own' ? 'a1' : 'b1', tenant: c.scope === 'own' ? 'A' : 'B' },
              null,
              2,
            )
          : '(empty body)'}
      </pre>
      <p className="mt-4 flex gap-2 text-sm text-ink-muted">
        <CornerDownRight size={16} className="mt-0.5 shrink-0 text-ink-faint" />
        {pass
          ? 'The response status matches this approved expectation.'
          : 'Tenant A received Tenant B’s asset. The seeded API skips the ownership check on reads.'}
      </p>
    </aside>
  );
};

export default EvidencePanel;
