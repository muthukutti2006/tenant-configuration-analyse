// API client – all calls go through this module

import type {
  AnalysisResult,
  AggregatedStats,
  TenantConfig,
  ConflictRule,
  Conflict,
  DriftReport,
  BaselineRecord,
  CatalogRule,
  ExperimentResult,
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
  // ── Original Review-1 endpoints ────────────────────────────────────────
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

  // ── Review-2: Baseline Store ────────────────────────────────────────────
  listBaselines: () =>
    request<{ count: number; baselines: BaselineRecord[] }>("/api/baselines"),

  getTenantBaselines: (tenantId: string) =>
    request<{ tenant_id: string; versions: string[]; baselines: BaselineRecord[] }>(
      `/api/baselines/${tenantId}`
    ),

  getBaseline: (tenantId: string, version: string) =>
    request<BaselineRecord>(`/api/baselines/${tenantId}/${version}`),

  // ── Review-2: Drift Detection ───────────────────────────────────────────
  detectDrift: (
    baseline: Record<string, unknown>,
    candidate: Record<string, unknown>,
    baselineVersion = "manual",
    candidateVersion = "proposed"
  ) =>
    request<DriftReport>("/api/drift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseline, candidate, baseline_version: baselineVersion, candidate_version: candidateVersion }),
    }),

  compareAgainstBaseline: (
    tenantId: string,
    version: string,
    candidate: Record<string, unknown>,
    candidateVersion = "proposed"
  ) =>
    request<DriftReport>(`/api/baselines/${tenantId}/${version}/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate, candidate_version: candidateVersion }),
    }),

  compareBaselineVersions: (tenantId: string, fromVersion: string, toVersion: string) =>
    request<DriftReport>(
      `/api/baselines/${tenantId}/versions/compare?from_version=${encodeURIComponent(fromVersion)}&to_version=${encodeURIComponent(toVersion)}`
    ),

  // ── Review-2: Rule Catalogue ────────────────────────────────────────────
  getCatalog: (params?: { category?: string; severity?: string; enabled?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.severity) qs.set("severity", params.severity);
    if (params?.enabled !== undefined) qs.set("enabled", String(params.enabled));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<{ count: number; categories: string[]; rules: CatalogRule[] }>(`/api/catalog${query}`);
  },

  // ── Review-2: Experiment ────────────────────────────────────────────────
  getExperiment: () => request<ExperimentResult>("/api/experiment"),
};
