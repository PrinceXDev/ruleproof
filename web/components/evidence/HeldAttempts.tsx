import type { ReactNode } from 'react';

// Folds away the bypass attempts that were refused.
const HeldAttempts = ({ count, children }: { count: number; children: ReactNode }) => {
  if (count === 0) return null;
  return (
    <details className="group border-t border-border">
      <summary className="list-none px-4 py-2.5 text-xs text-ink-faint hover:text-ink print:hidden">
        <span className="group-open:hidden">Show {count} held attempts</span>
        <span className="hidden group-open:inline">Hide held attempts</span>
      </summary>
      <ul className="divide-y divide-border border-t border-border">{children}</ul>
    </details>
  );
};

export default HeldAttempts;
