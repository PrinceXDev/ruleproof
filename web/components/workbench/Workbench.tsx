'use client';

import { Loader2 } from 'lucide-react';
import useWorkspaceSession from '@/hooks/workbench/useWorkspaceSession';
import WorkbenchLogin from './WorkbenchLogin';
import WorkbenchContent from './WorkbenchContent';

const Workbench = () => {
  const connection = useWorkspaceSession();
  if (connection.loading)
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-3 p-20 text-sm text-ink-muted"
      >
        <Loader2 size={18} className="animate-spin" />
        Connecting to workspace…
      </div>
    );
  if (!connection.session) return <WorkbenchLogin connection={connection} />;
  return (
    <WorkbenchContent
      key={`${connection.session.workspace}/${connection.session.name}`}
      token={connection.token}
      session={connection.session}
      signOut={connection.signOut}
    />
  );
};
export default Workbench;
