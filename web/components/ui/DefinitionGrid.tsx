import type { ReactNode } from "react";

// Two-column key/value list in small monospace, as used for request and timing details.
const DefinitionGrid = ({ rows }: { rows: [string, ReactNode][] }) => (
  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono-tnum text-xs">
    {rows.map(([term, value]) => (
      <div key={term} className="contents">
        <dt className="text-ink-faint">{term}</dt>
        <dd className="truncate text-ink">{value}</dd>
      </div>
    ))}
  </dl>
);

export default DefinitionGrid;
