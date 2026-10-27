export const WORKBENCH_TABS = ['Checks', 'API coverage', 'Identities', 'Activity'] as const;
export type WorkbenchTab = (typeof WORKBENCH_TABS)[number];

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
export const REQUEST_SCOPES = [
  'own',
  'other',
  'same-tenant-nonowner',
  'mixed-tenant-bulk',
] as const;
export const ASSERTION_OPERATORS = [
  { value: 'equals', label: 'Equals JSON value' },
  { value: 'allEqual', label: 'Every array item equals' },
  { value: 'absent', label: 'Field must be absent' },
  { value: 'exists', label: 'Field must exist' },
] as const;
export const VALUE_OPERATORS = ['equals', 'allEqual'];
export const DRIFT_KINDS = ['added', 'changed', 'removed'] as const;
export const SUITE_LIMITS = { identities: 32, checks: 256, assertions: 32, specBytes: 512 * 1024 };
export const ANALYSIS_DEBOUNCE_MS = 350;
export const WORKBENCH_INPUT_CLASS =
  'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand disabled:opacity-50';
export const WORKBENCH_CARD_CLASS = 'rounded-xl border border-border bg-panel';
export const PILL_TONES = {
  neutral: 'bg-panel-elevated text-ink-muted',
  good: 'bg-pass/10 text-pass',
  warning: 'bg-attn/10 text-attn',
  bad: 'bg-fail/10 text-fail',
};
