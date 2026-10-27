import { cn } from '@/lib/cn';
import ColumnIntro from '@/components/landing/ColumnIntro';
import { MATRIX_FACTORS, MATRIX_HEADERS, MATRIX_ROWS } from '@/constants/landing';
import { LANDING_BAND, LANDING_CARD, LANDING_WRAP } from '@/constants/landing-styles';

const MatrixSection = () => (
  <section className={LANDING_BAND}>
    <div className={cn(LANDING_WRAP, 'grid gap-14 lg:grid-cols-2 lg:items-center')}>
      <div data-reveal>
        <ColumnIntro kicker="The coverage model" title="Every combination, written down.">
          Most access bugs live in the case nobody wrote a test for. RuleProof expands a rule into
          the full cross product of roles, actions and tenant scope — so “viewer updates their own
          asset” gets an explicit answer, even if your rule only implied it.
        </ColumnIntro>
        <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-sm">
          {MATRIX_FACTORS.map((x, i) => (
            <span key={x} className="flex items-center gap-3">
              <span className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-ink">
                {x}
              </span>
              {i < 2 && <span className="text-ink-faint">×</span>}
            </span>
          ))}
          <span className="text-ink-faint">=</span>
          <span className="rounded-lg bg-brand px-3 py-2 font-semibold text-brand-ink">
            8 checks
          </span>
        </div>
      </div>
      <div className={cn(LANDING_CARD, 'overflow-hidden')} data-reveal>
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Expected outcomes for the sample rule</caption>
          <thead>
            <tr className="border-b border-white/[.07] font-mono text-[10px] uppercase tracking-[.16em] text-ink-faint">
              {MATRIX_HEADERS.map((h) => (
                <th key={h} className="px-5 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[.05]">
            {MATRIX_ROWS.map(([r, a, own, other]) => (
              <tr key={`${r}${a}`}>
                <td className="px-5 py-4 text-ink">{r}</td>
                <td className="px-5 py-4 text-ink-muted">{a}</td>
                {[
                  { scope: 'own', status: own },
                  { scope: 'other', status: other },
                ].map(({ scope, status: s }) => (
                  <td key={scope} className="px-5 py-4">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 font-mono-tnum text-xs',
                        s === 200 ? 'bg-pass/10 text-pass' : 'bg-white/[.05] text-ink-muted',
                      )}
                    >
                      {s === 200 ? 'allow' : 'deny'} {s}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-white/[.07] px-5 py-3 text-xs text-ink-faint">
          Seeded-defect API: both <span className="text-fail">Other tenant · Read</span> cells
          return 200.
        </p>
      </div>
    </div>
  </section>
);

export default MatrixSection;
