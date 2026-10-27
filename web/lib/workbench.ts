import type { CheckResult } from './types';

export interface Identity {
  id: string;
  label: string;
  role: string;
  tenant: string;
  credential?: string;
}

export interface Assertion {
  path: string;
  operator: 'equals' | 'allEqual' | 'absent' | 'exists';
  value?: unknown;
}

export interface SuiteCase {
  id: string;
  identityId: string;
  scope: string;
  method: string;
  path: string;
  expectedStatus: number;
  body?: string;
  assertions?: Assertion[];
  state?: { path: string; pointer: string; identityId: string };
  scenario?: string;
}

export interface Suite {
  name: string;
  ruleText: string;
  environment: string;
  identities: Identity[];
  cases: SuiteCase[];
  spec: Record<string, unknown>;
  exclusions?: Record<string, string>;
  buildCommit?: string;
  dataVersion?: string;
}

export interface Revision {
  id: string;
  parentId?: string;
  suite: Suite;
  hash: string;
  author: string;
  approvedBy?: string;
  createdAt: string;
}

export interface Operation {
  method: string;
  path: string;
  summary: string;
  fingerprint: string;
  checks: number;
  combinations: string[];
  missing: string[];
  exclusion?: string;
}

export interface Analysis {
  validationError?: string;
  operations: Operation[];
  conflicts: string[];
  gaps: number;
  covered: number;
  specHash: string;
}

export interface Drift {
  added: string[];
  changed: string[];
  removed: string[];
}

export interface Evidence {
  suiteHash: string;
  specHash: string;
  environment: string;
  buildCommit: string;
  dataVersion: string;
  createdAt: string;
  results: CheckResult[];
  passed: number;
  failed: number;
  errors: number;
}

export interface AuditEvent {
  id: string;
  revisionId: string;
  actor: string;
  kind: string;
  content: Evidence | Record<string, never>;
  createdAt: string;
}

export interface Session {
  name: string;
  workspace: string;
  role: 'author' | 'reviewer' | 'viewer';
  demo: boolean;
  separateReviewer: boolean;
  environments: { id: string; label: string; credentials: string[] }[];
}

export const workbenchRequest = async <T>(
  token: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> => {
  const response = await fetch(`/api/workbench/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`);
  return data as T;
};

export const downloadJSON = (name: string, data: unknown) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};
