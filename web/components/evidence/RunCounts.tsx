import clsx from 'clsx';
import { Ban, CheckCircle2, DoorOpen, XCircle } from 'lucide-react';
import type { Run } from '@/lib/types';

// Passed / failed / error / bypass counters for a finished run.
const RunCounts = ({ run, longBypass = false }: { run: Run; longBypass?: boolean }) => (
  <>
    <span className="flex items-center gap-1.5 text-pass">
      <CheckCircle2 size={15} /> <span className="font-mono-tnum">{run.passCount}</span> passed
    </span>
    <span
      className={clsx(
        'flex items-center gap-1.5',
        run.failCount > 0 ? 'text-fail' : 'text-ink-faint',
      )}
    >
      <XCircle size={15} /> <span className="font-mono-tnum">{run.failCount}</span> failed
    </span>
    {run.errorCount > 0 && (
      <span className="flex items-center gap-1.5 text-attn">
        <Ban size={15} /> <span className="font-mono-tnum">{run.errorCount}</span> error
      </span>
    )}
    {run.bypass && (
      <span
        className={clsx(
          'flex items-center gap-1.5',
          run.bypass.leaked > 0 ? 'text-fail' : 'text-ink-muted',
        )}
      >
        <DoorOpen size={15} /> <span className="font-mono-tnum">{run.bypass.leaked}</span>
        {longBypass ? (
          <>
            {' '}
            of <span className="font-mono-tnum">{run.variants.length}</span> bypass attempts got
            through
          </>
        ) : (
          ' bypassed'
        )}
      </span>
    )}
  </>
);

export default RunCounts;
