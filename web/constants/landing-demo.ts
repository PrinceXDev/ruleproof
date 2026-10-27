// Sample data shared by the hero console animation and the interactive product demo.
export { SAMPLE_RULE } from './rules';

export const SAMPLE_CONCEPTS = ['viewer', 'editor', 'read', 'update', 'own tenant', 'other tenant'];

export const SAMPLE_CASES = ['viewer', 'editor'].flatMap((role) =>
  ['read', 'update'].flatMap((action) =>
    ['own', 'other'].map((scope) => ({
      role,
      action,
      scope,
      expected: scope === 'own' && (action === 'read' || role === 'editor') ? 200 : 403,
    })),
  ),
);

export type SampleCase = (typeof SAMPLE_CASES)[number];

// Same 8 cases and seeded-defect outcomes as the Go fixture: the broken API
// skips the ownership check on reads only.
export const HERO_CELLS = SAMPLE_CASES.map((c) => ({
  ...c,
  actual: c.action === 'read' && c.scope === 'other' ? 200 : c.expected,
}));

export const DEMO_STAGES = ['Explain', 'Review & approve', 'Verify & inspect'];

export const DEMO_PARSED: [label: string, value: string][] = [
  ['Roles', 'Viewer · Editor'],
  ['Actions', 'Read · Update'],
  ['Scope', 'Own tenant · Other tenant'],
];
