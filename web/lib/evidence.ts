import type { CheckResult, Plan, PlanCase, Run } from "./types";

const safeParse = (body?: string) => {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

// The self-contained evidence record for one check, as copied or downloaded
// from the evidence drawer.
export const evidenceJson = (
  result: CheckResult,
  planCase: PlanCase,
  plan: Plan,
  run: Run | null,
  revisionLabel: string
): string =>
  JSON.stringify(
    {
      case: planCase.id,
      bypassVariant: result.variant ? { kind: result.variant.kind, label: result.variant.label } : undefined,
      role: planCase.role,
      action: planCase.action,
      scope: planCase.scope,
      requirementRevision: revisionLabel,
      planId: plan.id,
      expectedStatus: result.expected_status,
      actualStatus: result.actual_status,
      verdict: result.verdict,
      method: result.method,
      path: result.path,
      requestHeaders: result.headers,
      durationMs: result.duration_ms,
      runId: run?.id,
      fixture: run?.fixture,
      observedAt: run?.createdAt,
      responseBody: safeParse(result.body),
    },
    null,
    2
  );
