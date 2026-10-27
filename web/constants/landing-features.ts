import {
  Ban,
  Database,
  Download,
  GitBranch,
  GitCompareArrows,
  History,
  Mic,
  Quote,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export type FeatureVisualId = 'provenance' | 'coverage' | 'revisions' | 'diff' | 'ci';

export const FEATURES: {
  title: string;
  body: string;
  icon: LucideIcon;
  className: string;
  visual?: FeatureVisualId;
}[] = [
  {
    className: 'md:col-span-4',
    icon: Quote,
    title: 'Source-sentence provenance',
    body: 'Every extracted role, action and scope carries the sentence it came from. Analysis is sentence-scoped, so unrelated clauses never get conflated.',
    visual: 'provenance',
  },
  {
    className: 'md:col-span-2',
    icon: Sparkles,
    title: 'Assumptions, never guesses',
    body: 'Wording outside the vocabulary becomes a visible assumption. Approval is blocked until a human acknowledges it.',
  },
  {
    className: 'md:col-span-6',
    icon: Radar,
    title: 'The endpoint you forgot',
    body: 'RuleProof maps your rule onto the API’s OpenAPI spec and flags every object-level endpoint the rule never mentions. Add one sentence and the new checks catch the leak nobody was looking for.',
    visual: 'coverage',
  },
  {
    className: 'md:col-span-2',
    icon: GitBranch,
    title: 'Immutable revisions',
    body: 'Change a word or an expectation and you get a new child plan in the same lineage. Old approvals stay with old plans.',
    visual: 'revisions',
  },
  {
    className: 'md:col-span-3',
    icon: GitCompareArrows,
    title: 'Revision diff',
    body: 'Re-approving? See exactly what changed: word-level rule edits, every flipped expectation, new or resolved assumptions — and whether an old approval was reset.',
    visual: 'diff',
  },
  {
    className: 'md:col-span-3',
    icon: Workflow,
    title: 'CI gate',
    body: 'Commit the approved plan and run it on every push. The build fails on any mismatch — and refuses plans that are unapproved or edited after approval.',
    visual: 'ci',
  },
  {
    className: 'md:col-span-2',
    icon: Ban,
    title: 'Exact status matching',
    body: 'Want 403, got 500? That’s a failure. Redirects and crashes never masquerade as a denial.',
  },
  {
    className: 'md:col-span-2',
    icon: ScanSearch,
    title: 'Evidence inspector',
    body: 'An accessible drawer with the rule excerpt, revision IDs, redacted request headers and a highlighted response body.',
  },
  {
    className: 'md:col-span-3',
    icon: History,
    title: 'Run history & replay',
    body: 'Every run is stored against the exact revision it tested. Reopen any past run and compare seeded vs corrected side by side.',
  },
  {
    className: 'md:col-span-3',
    icon: Download,
    title: 'Exportable evidence bundle',
    body: 'One JSON file with the rule, every revision, approvals and runs — attach it to a ticket, a PR or an audit trail.',
  },
  {
    className: 'md:col-span-2',
    icon: Database,
    title: 'SQLite or Postgres',
    body: 'Embedded SQLite out of the box. Set DATABASE_URL and the same SQL runs on Postgres.',
  },
  {
    className: 'md:col-span-2',
    icon: Mic,
    title: 'Voice-first input',
    body: 'Dictate rules with Wispr Flow into a plain textarea. The parser was tuned on how people say rules out loud.',
  },
  {
    className: 'md:col-span-2',
    icon: ShieldCheck,
    title: 'Accessible by default',
    body: 'Focus-trapped drawer, Radix primitives, keyboard everything, reduced-motion support, 390px to 1440px.',
  },
];

export const COVERAGE_ROWS: [method: string, path: string, tone: string, note: string][] = [
  ['GET', '/assets/{id}', 'text-pass', '4 checks'],
  ['PUT', '/assets/{id}', 'text-pass', '4 checks'],
  ['GET', '/assets/{id}/export', 'text-attn', 'no rule → cross-tenant export leaks'],
];
