import type { ReactNode } from 'react';

const ReportNotice = ({ icon, children }: { icon?: ReactNode; children: ReactNode }) => (
  <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-ink-muted">
    {icon && <div className="mb-3 flex justify-center text-ink-faint">{icon}</div>}
    <p>{children}</p>
  </div>
);

export default ReportNotice;
