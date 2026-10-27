export const SAMPLE_RULE =
  "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets.";

export const EXAMPLE_RULES = [
  {
    label: 'Tenant isolation',
    hint: 'The sample · 0 assumptions',
    text: SAMPLE_RULE,
  },
  {
    label: 'Editors only',
    hint: 'Needs a clarification',
    text: 'Only editors can read or update assets.',
  },
  {
    label: 'Read-only viewers',
    hint: 'Implied denials',
    text: "Viewers have read-only access to their own tenant's assets. Editors can read and update assets in their own tenant.",
  },
];
