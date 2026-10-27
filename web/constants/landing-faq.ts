export const FAQS: [question: string, answer: string][] = [
  [
    'Does a green matrix mean my app is secure?',
    'No. It means the approved scenarios passed against that fixture. RuleProof is deliberately explicit about what was checked — and what wasn’t.',
  ],
  [
    'Is an AI model guessing my policy?',
    'No. A bounded, deterministic parser in Go reads a small known vocabulary (viewer/editor, read/update, own/other tenant) sentence by sentence. Anything outside it becomes an assumption a human must acknowledge.',
  ],
  [
    'What happens if I edit an expectation after approving?',
    'Plans are immutable. Any edit creates a new child revision in the same lineage, and the old approval does not carry over — you must approve again.',
  ],
  [
    'Can I point it at my own API?',
    'Not from the hosted studio — it only targets the two bundled fixtures, so the public demo can’t be used against arbitrary URLs. The ruleproof-ci command you run yourself can target your own API with -base-url and your own tokens.',
  ],
  [
    'How does it stay enforced after today?',
    'Export the approved plan and run ruleproof-ci on every push. It verifies the plan is approved and unmodified, re-runs every check, and fails the build on any mismatch — with GitHub annotations, a job summary and JUnit XML.',
  ],
  [
    'How is a 500 or a redirect treated?',
    'As a mismatch. Statuses are compared exactly, so a crash or redirect never silently counts as a ‘denial’.',
  ],
  [
    'Are credentials stored in the evidence?',
    'No. Demo tokens are public labels, request headers are redacted in the inspector, and only the synthetic response body is captured.',
  ],
  [
    'Where does Wispr Flow fit in?',
    'Rules are meant to be spoken. Dictate into the normal Explain textarea with Wispr Flow — no fake microphone UI — and the parser handles natural spoken phrasing.',
  ],
];

export const QUICKSTART_TABS: { id: string; label: string; note: string; lines: string[] }[] = [
  {
    id: 'dev',
    label: 'Local dev',
    note: 'Two terminals: the Go API with both fixtures, and the Next.js UI with hot reload.',
    lines: ['go run ./cmd/server', 'cd web && npm install && npm run dev'],
  },
  {
    id: 'single',
    label: 'Single process',
    note: 'Static export served by the Go server — UI and API on one origin.',
    lines: ['cd web && npm run build && cd ..', 'go run ./cmd/server   # http://localhost:8080'],
  },
  {
    id: 'docker',
    label: 'Docker',
    note: 'One container: API, fixtures and UI. Listens on $PORT when set.',
    lines: ['docker build -t ruleproof .', 'docker run -p 8080:8080 ruleproof'],
  },
  {
    id: 'ci',
    label: 'CI gate',
    note: 'Export an approved plan from the studio, commit it, and fail the build on any mismatch. Exit 0 pass · 1 mismatch · 2 invalid plan.',
    lines: [
      'go run ./cmd/ruleproof-ci -bundle examples/tenant-isolation.bundle.json -fixture fixed',
      'go run ./cmd/ruleproof-ci -bundle plan.json -base-url https://staging.example.com -token viewer=$VIEWER_TOKEN',
    ],
  },
  {
    id: 'postgres',
    label: 'Postgres',
    note: 'SQLite by default. Point DATABASE_URL at Postgres to keep data — the same SQL runs on both.',
    lines: ['DATABASE_URL=postgres://user:pass@localhost:5432/ruleproof go run ./cmd/server'],
  },
];
