export const IMPACT_PAGE_SIZE = 20;
export const IMPACT_FILTERS = [
  { value: 'changes', label: 'Affected & uncertain' },
  { value: 'all', label: 'All operations' },
  { value: 'unaffected', label: 'Unchanged in spec' },
] as const;
export const IMPACT_CERTAINTY_LABELS = {
  affected: 'Affected',
  uncertain: 'Uncertain',
  unaffected: 'Unchanged in spec',
} as const;
