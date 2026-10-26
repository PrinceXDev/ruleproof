export type Role = "viewer" | "editor";
export type ActionKind = "read" | "update" | "export";
export type Scope = "own" | "other";
export type ExpectedLabel = "allow" | "deny" | "unauthenticated" | "not found" | "unexpected";
export type Verdict = "pass" | "fail" | "error";
export type Fixture = "broken" | "partial" | "fixed";
export type PlanKind = "root" | "revision" | "edit";

export interface PlanCase {
  id: string;
  actor: string;
  role: Role;
  action: ActionKind;
  method: string;
  scope: Scope;
  assetId: string;
  assetOwner: string;
  expectedStatus: number;
  expectedLabel: ExpectedLabel;
}

export interface Concept {
  label: string;
  value: string;
  snippet?: string;
}

export interface Plan {
  id: string;
  rootPlanId: string;
  parentPlanId?: string;
  kind: PlanKind;
  ruleText: string;
  cases: PlanCase[];
  assumptions: string[] | null;
  concepts: Concept[] | null;
  hash: string;
  assumptionsAcknowledged: boolean;
  approved: boolean;
  approvedAt?: string;
  createdAt: string;
}

export interface CheckResult {
  id: string;
  rule: string;
  actor: string;
  method: string;
  path: string;
  expected_status: number;
  actual_status?: number;
  verdict: Verdict;
  detail: string;
  duration_ms: number;
  body?: string;
  headers?: Record<string, string>; // extra, non-credential headers a bypass attempt sent
  variant?: Variant;
}

// A bypass attempt derived at run time from an approved deny case. It holds
// on any refusal (401/403/404/405) and leaks on any 2xx.
export interface Variant {
  of: string; // id of the approved case
  kind: string;
  label: string;
  why: string;
}

export interface BypassSummary {
  catalog: string;
  held: number;
  leaked: number;
  inconclusive: number;
}

export interface Run {
  id: string;
  planId: string;
  planHash: string;
  fixture: Fixture;
  results: CheckResult[];
  passCount: number;
  failCount: number;
  errorCount: number;
  variants: CheckResult[];
  bypass?: BypassSummary; // absent when the run did not try bypass variants
  createdAt: string;
}

export interface History {
  lineage: Plan[];
  runs: Run[];
}

export interface ApiError {
  error: string;
}

export interface TextOp {
  op: "equal" | "insert" | "delete";
  text: string;
}

export interface CaseChange {
  caseId: string;
  role: Role;
  action: ActionKind;
  scope: Scope;
  method: string;
  assetId: string;
  change: "changed" | "added" | "removed";
  fromStatus?: number;
  toStatus?: number;
  fromLabel?: ExpectedLabel;
  toLabel?: ExpectedLabel;
}

export interface PlanDiff {
  baseId: string;
  headId: string;
  textChanged: boolean;
  text: TextOp[];
  cases: CaseChange[];
  unchangedCases: number;
  assumptionsAdded: string[];
  assumptionsRemoved: string[];
  conceptsAdded: Concept[];
  conceptsRemoved: Concept[];
  planChanged: boolean;
  approvalReset: boolean;
}

export interface CoverageOperation {
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
  action: string;
  checks: number;
  covered: boolean;
  snippet?: string;
  supported: boolean;
  suggestion?: string;
}

export interface CoverageReport {
  specTitle: string;
  operations: CoverageOperation[];
  covered: number;
  total: number;
}
