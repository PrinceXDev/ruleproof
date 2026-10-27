import type { Suite } from '@/lib/workbench';
import { cardClass, inputClass, Pill } from './Controls';

const CheckTable = ({
  suite,
  selected,
  filter,
  setFilter,
  setSelected,
}: {
  suite: Suite;
  selected: string;
  filter: string;
  setFilter: (s: string) => void;
  setSelected: (s: string) => void;
}) => (
  <div className={`${cardClass} overflow-hidden`}>
    <div className="border-b border-border p-3">
      <input
        aria-label="Filter checks"
        placeholder="Filter by route, identity, or scenario…"
        className={inputClass}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
    </div>
    <div className="max-h-[680px] overflow-auto">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 z-10 bg-panel-elevated text-ink-muted">
          <tr>
            <th className="p-3 font-medium">Identity / scope</th>
            <th className="p-3 font-medium">Request</th>
            <th className="p-3 font-medium">Expect</th>
          </tr>
        </thead>
        <tbody>
          {suite.cases
            .filter((c) =>
              `${c.identityId} ${c.path} ${c.scenario ?? ''}`
                .toLowerCase()
                .includes(filter.toLowerCase()),
            )
            .map((c) => (
              <tr
                key={c.id}
                className={`border-t border-border/70 ${c.id === selected ? 'bg-brand/5' : 'hover:bg-panel-elevated'}`}
              >
                <td className="p-3">
                  <button type="button" onClick={() => setSelected(c.id)} className="text-left">
                    <span className={c.id === selected ? 'text-brand' : 'text-ink'}>
                      {c.identityId}
                    </span>
                    <span className="mt-1 block text-[11px] text-ink-muted">
                      {c.scope}
                      {c.scenario ? ` · ${c.scenario}` : ''}
                    </span>
                  </button>
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => setSelected(c.id)}
                    className="text-left font-mono"
                  >
                    <span className="text-ink-muted">{c.method}</span>
                    <span className="mt-1 block max-w-60 truncate">{c.path}</span>
                  </button>
                </td>
                <td className="p-3">
                  <Pill tone={c.expectedStatus < 300 ? 'good' : 'warning'}>{c.expectedStatus}</Pill>
                  <span className="mt-1 block text-[10px] text-ink-muted">
                    {(c.assertions?.length ?? 0) + (c.state ? 1 : 0)} assertions
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {suite.cases.length === 0 && (
        <p className="p-8 text-center text-sm text-ink-muted">
          Add a check to start building your matrix.
        </p>
      )}
    </div>
  </div>
);
export default CheckTable;
