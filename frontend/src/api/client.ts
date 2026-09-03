// API client – all calls go through this module

import type {
  AnalysisResult,
  AggregatedStats,
  TenantConfig,
  ConflictRule,
  Conflict,
} from "../types";

const BASE = "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; version: string }>("/api/health"),

  analyzeAll: () => request<AggregatedStats>("/api/analyze-all"),

  analyze: (config: Record<string, unknown>) =>
    request<AnalysisResult>("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    }),

  listConfigurations: () =>
    request<{ count: number; configurations: TenantConfig[] }>("/api/configurations"),

  getConfiguration: (tenantId: string) =>
    request<TenantConfig>(`/api/configurations/${tenantId}`),

  listConflicts: () =>
    request<{ count: number; conflicts: Conflict[] }>("/api/conflicts"),

  getConflict: (id: string) => request<Conflict>(`/api/conflicts/${id}`),

  listRules: () => request<{ rules: ConflictRule[] }>("/api/rules"),
};
