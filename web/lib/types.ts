export type Role = "viewer" | "editor";
export type ActionKind = "read" | "update";
export type Scope = "own" | "other";
export type ExpectedLabel = "allow" | "deny" | "unauthenticated" | "not found" | "unexpected";
export type Verdict = "pass" | "fail" | "error";
export type Fixture = "broken" | "fixed";
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
  createdAt: string;
}

export interface History {
  lineage: Plan[];
  runs: Run[];
}

export interface ApiError {
  error: string;
}
