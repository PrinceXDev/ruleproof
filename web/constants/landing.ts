import {
  FileSearch,
  FlaskConical,
  Mic,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export const GITHUB_URL = "https://github.com/PrinceXDev/ruleproof";

export const NAV_LINKS: [href: string, label: string][] = [
  ["#problem", "Why"],
  ["#workflow", "How it works"],
  ["#demo", "Demo"],
  ["#features", "Features"],
  ["#architecture", "Architecture"],
  ["#faq", "FAQ"],
];

export const HERO_STATS: [value: string, label: string][] = [
  ["8", "explicit checks per rule"],
  ["0", "silent guesses"],
  ["1:1", "approval per revision"],
];

export const PIPELINE = [
  "Plain-language rule",
  "Sentence-scoped parser",
  "Source provenance",
  "Visible assumptions",
  "8-case plan",
  "Endpoint coverage",
  "Human approval",
  "Immutable revisions",
  "Exact-status runner",
  "Request & response evidence",
  "Revision diff",
  "CI gate",
];

export const PROBLEM_UI_ROWS = [
  { id: "a1", name: "Launch brief.pdf", tenant: "Tenant A", visible: true },
  { id: "a2", name: "Q3 roadmap.md", tenant: "Tenant A", visible: true },
  { id: "b1", name: "Tenant B asset", tenant: "hidden", visible: false },
];

export const WORKFLOW_STEPS: {
  n: string;
  title: string;
  body: string;
  detail: string[];
  icon: LucideIcon;
}[] = [
  {
    n: "01",
    title: "Explain the rule",
    body: "Type or dictate who can do what. The bounded parser extracts roles, actions and tenant scope — each tagged with the exact sentence it came from.",
    detail: ["viewer · editor", "read · update", "own · other tenant"],
    icon: Mic,
  },
  {
    n: "02",
    title: "Review the exact plan",
    body: "Eight explicit scenarios with expected HTTP statuses, plus a map of which API endpoints the rule covers. Override any expectation, acknowledge assumptions, then approve that specific revision.",
    detail: ["Endpoint gaps flagged", "Approval never carries over"],
    icon: FileSearch,
  },
  {
    n: "03",
    title: "Run against a fixture",
    body: "The approved requests go to the seeded-defect or corrected API with per-request timeouts. Statuses are matched exactly — a 500 is not a deny.",
    detail: ["Seeded defect: 6 pass · 2 fail", "Corrected: 8 pass"],
    icon: FlaskConical,
  },
  {
    n: "04",
    title: "Inspect the evidence",
    body: "Open any result: rule excerpt → expectation → request → response body, with a plain-language explanation. Replay history or export the JSON bundle.",
    detail: ["Rule → plan → request → response"],
    icon: ScanSearch,
  },
];

export const MATRIX_FACTORS = ["2 roles", "2 actions", "2 scopes"];

export const MATRIX_HEADERS = ["Role", "Action", "Own tenant", "Other tenant"];

export const MATRIX_ROWS: [role: string, action: string, own: number, other: number][] = [
  ["Viewer", "Read", 200, 403],
  ["Viewer", "Update", 403, 403],
  ["Editor", "Read", 200, 403],
  ["Editor", "Update", 200, 403],
];

export const ARCH_BROWSER_ITEMS = ["Landing + sample", "Evidence Studio", "Evidence drawer"];

export const ARCH_PACKAGES: [pkg: string, desc: string][] = [
  ["internal/api", "REST surface, JSON errors"],
  ["internal/rules", "Bounded sentence parser"],
  ["internal/check", "HTTP runner, exact match"],
  ["internal/store", "Immutable plans · SQLite/PG"],
];

export const ARCH_FIXTURE_ITEMS = [
  "Seeded defect — skips read ownership check",
  "Corrected — checks tenant on every request",
  "Two local servers, started with the API",
];

export const API_ENDPOINTS: [method: string, path: string, desc: string][] = [
  ["POST", "/api/plans", "Parse a rule into a new plan"],
  ["GET", "/api/plans/{id}", "Fetch a plan revision"],
  ["POST", "/api/plans/{id}/revise", "New revision from changed wording"],
  ["PATCH", "/api/plans/{id}/cases", "Override expectations → new revision"],
  ["POST", "/api/plans/{id}/acknowledge", "Acknowledge parser assumptions"],
  ["POST", "/api/plans/{id}/approve", "Approve this exact revision"],
  ["POST", "/api/runs", "Run an approved plan on a fixture"],
  ["GET", "/api/runs/{id}", "Fetch a run with evidence"],
  ["GET", "/api/plans/{id}/history", "Full lineage + every run"],
  ["GET", "/api/plans/{id}/diff", "What changed vs. the previous revision"],
  ["GET", "/api/plans/{id}/coverage", "Endpoints the rule covers, and the gaps"],
  ["GET", "/api/plans/{id}/export", "Download the evidence bundle"],
];

export const METHOD_COLOR: Record<string, string> = {
  GET: "text-pass",
  POST: "text-brand",
  PATCH: "text-attn",
};

export const SCOPE_CARDS: {
  title: string;
  icon: LucideIcon;
  tone: string;
  items: string[];
}[] = [
  {
    title: "A green matrix means",
    icon: ShieldCheck,
    tone: "text-pass",
    items: [
      "Each approved scenario returned exactly its expected status.",
      "Against that fixture, for that revision, at that time.",
      "With request and response kept as evidence.",
    ],
  },
  {
    title: "It does not mean",
    icon: ShieldAlert,
    tone: "text-attn",
    items: [
      "Your whole application is secure.",
      "Roles or actions outside viewer/editor · read/update were tested.",
      "Anything about your production API — only bundled fixtures are targeted.",
    ],
  },
];

export const FOOTER_ANCHORS: [href: string, label: string][] = [
  ["#api", "API"],
  ["#scope", "Scope"],
];
