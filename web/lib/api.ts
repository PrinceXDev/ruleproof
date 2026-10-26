import type { CoverageReport, Fixture, History, Plan, PlanDiff, Run } from "./types";

export class ApiRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore — not all error bodies are JSON
    }
    throw new ApiRequestError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createPlan: (text: string, signal?: AbortSignal) =>
    request<Plan>("/api/plans", { method: "POST", body: JSON.stringify({ text }), signal }),

  getPlan: (id: string, signal?: AbortSignal) => request<Plan>(`/api/plans/${id}`, { signal }),

  revisePlan: (id: string, text: string, signal?: AbortSignal) =>
    request<Plan>(`/api/plans/${id}/revise`, { method: "POST", body: JSON.stringify({ text }), signal }),

  editCases: (id: string, overrides: Record<string, number>, signal?: AbortSignal) =>
    request<Plan>(`/api/plans/${id}/cases`, { method: "PATCH", body: JSON.stringify({ overrides }), signal }),

  acknowledge: (id: string, signal?: AbortSignal) =>
    request<Plan>(`/api/plans/${id}/acknowledge`, { method: "POST", signal }),

  approve: (id: string, signal?: AbortSignal) => request<Plan>(`/api/plans/${id}/approve`, { method: "POST", signal }),

  history: (id: string, signal?: AbortSignal) => request<History>(`/api/plans/${id}/history`, { signal }),

  // base defaults to the plan's parent revision on the server.
  diff: (id: string, base?: string, signal?: AbortSignal) =>
    request<PlanDiff>(`/api/plans/${id}/diff${base ? `?base=${encodeURIComponent(base)}` : ""}`, { signal }),

  coverage: (id: string, signal?: AbortSignal) => request<CoverageReport>(`/api/plans/${id}/coverage`, { signal }),

  exportBundle: (id: string, signal?: AbortSignal) =>
    request<Record<string, unknown>>(`/api/plans/${id}/export`, { signal }),

  createRun: (planId: string, fixture: Fixture, signal?: AbortSignal) =>
    request<Run>("/api/runs", { method: "POST", body: JSON.stringify({ planId, fixture }), signal }),

  getRun: (id: string, signal?: AbortSignal) => request<Run>(`/api/runs/${id}`, { signal }),
};
