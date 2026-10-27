export const EXECUTION_POLL_MS = 1500;
export const EXECUTION_LABELS = {
  running: 'Running',
  cancelling: 'Stopping',
  completed: 'Completed',
  cancelled: 'Cancelled',
  interrupted: 'Interrupted',
} as const;
export const EXECUTION_EVENT_LABELS: Record<string, string> = {
  run: 'Verification completed',
  approved: 'Revision approved',
  created: 'Revision created',
  execution_interrupted: 'Execution interrupted',
  execution_cancelled: 'Execution cancelled',
  execution_progress: 'Execution checkpoint',
  cancel_requested: 'Cancellation requested',
  recovered: 'Environment released after review',
};
export const EXECUTION_EVENT_KINDS = {
  running: 'execution_progress',
  cancelling: 'execution_progress',
  cancelled: 'execution_cancelled',
  interrupted: 'execution_interrupted',
  completed: 'run',
} as const;
