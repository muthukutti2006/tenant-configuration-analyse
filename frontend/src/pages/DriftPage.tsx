import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import type { BaselineRecord, DriftReport, DriftFinding, DriftSeverity, DriftType } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { RefreshCw, GitCompare, ChevronDown, ChevronRight, AlertCircle, Upload } from "lucide-react";

// ─── Severity colours ─────────────────────────────────────────────────────────

const SEVERITY_BG: Record<DriftSeverity, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  HIGH:     "bg-orange-100 text-orange-700 border-orange-200",
  MEDIUM:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  LOW:      "bg-blue-100 text-blue-700 border-blue-200",
};

const DRIFT_TYPE_LABEL: Record<DriftType, string> = {
  ADDED:     "ADDED",
  REMOVED:   "REMOVED",
  CHANGED:   "CHANGED",
  UNCHANGED: "UNCHANGED",
};

const DRIFT_TYPE_COLOR: Record<DriftType, string> = {
  ADDED:     "bg-green-100 text-green-700",
  REMOVED:   "bg-red-100 text-red-700",
  CHANGED:   "bg-amber-100 text-amber-700",
  UNCHANGED: "bg-slate-100 text-slate-500",
};

// ─── DriftFindingRow ─────────────────────────────────────────────────────────

function DriftFindingRow({ finding }: { finding: DriftFinding }) {
  const [expanded, setExpanded] = useState(
    finding.severity === "CRITICAL" || finding.severity === "HIGH"
  );

  return (
    <div className={`border rounded-lg overflow-hidden ${finding.severity === "CRITICAL" ? "border-red-200" : "border-slate-200"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 text-left transition-colors"
      >
        {expanded ? <ChevronDown size={14} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />}
        <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold border ${SEVERITY_BG[finding.severity]}`}>
          {finding.severity}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded font-mono ${DRIFT_TYPE_COLOR[finding.drift_type]}`}>
          {DRIFT_TYPE_LABEL[finding.drift_type]}
        </span>
        <code className="text-xs text-slate-700 font-mono flex-1 truncate">{finding.field}</code>
        {finding.drift_type === "CHANGED" && (
          <span className="text-xs text-slate-500 flex-shrink-0">
            {String(finding.old_value)} → {String(finding.new_value)}
          </span>
        )}
        {finding.drift_type === "ADDED" && (
          <span className="text-xs text-green-600 flex-shrink-0">= {String(finding.new_value)}</span>
        )}
        {finding.drift_type === "REMOVED" && (
          <span className="text-xs text-red-600 flex-shrink-0 line-through">{String(finding.old_value)}</span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-2 text-sm">
          <div>
            <span className="font-medium text-slate-600">Reason: </span>
            <span className="text-slate-700">{finding.evidence.reason}</span>
          </div>
          <div>
            <span className="font-medium text-slate-600">Impact: </span>
            <span className="text-slate-700">{finding.evidence.impact}</span>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded p-2">
            <span className="font-medium text-amber-700">Recommendation: </span>
            <span className="text-amber-800">{finding.evidence.recommendation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Mode = "version" | "custom";
type FilterSeverity = DriftSeverity | "ALL";
type FilterType = DriftType | "ALL";

export function DriftPage() {
  const [mode, setMode] = useState<Mode>("version");

  // Baseline store state
  const [baselines, setBaselines] = useState<BaselineRecord[]>([]);
  const [tenantIds, setTenantIds] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [tenantVersions, setTenantVersions] = useState<string[]>([]);
  const [fromVersion, setFromVersion] = useState("");
  const [toVersion, setToVersion] = useState("");
  const [loadingBaselines, setLoadingBaselines] = useState(true);

  // Custom JSON state
  const [baselineJson, setBaselineJson] = useState("");
  const [candidateJson, setCandidateJson] = useState("");
  const [customBaselineVersion, setCustomBaselineVersion] = useState("v1.0");
  const [customCandidateVersion, setCustomCandidateVersion] = useState("proposed");

  // Result state
  const [report, setReport] = useState<DriftReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>("ALL");
  const [filterType, setFilterType] = useState<FilterType>("ALL");

  // Load baselines on mount
  useEffect(() => {
    api.listBaselines()
      .then((d) => {
        setBaselines(d.baselines);
        const ids = [...new Set(d.baselines.map((b) => b.tenant_id))].sort();
        setTenantIds(ids);
        if (ids.length > 0) setSelectedTenant(ids[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingBaselines(false));
  }, []);

  // Load versions when tenant changes
  useEffect(() => {
    if (!selectedTenant) return;
    api.getTenantBaselines(selectedTenant)
      .then((d) => {
        setTenantVersions(d.versions);
        if (d.versions.length >= 1) setFromVersion(d.versions[0]);
        if (d.versions.length >= 2) setToVersion(d.versions[1]);
        else setToVersion(d.versions[0] ?? "");
      })
      .catch(() => {});
  }, [selectedTenant]);

  const runVersionComparison = useCallback(async () => {
    if (!selectedTenant || !fromVersion || !toVersion) {
      setError("Select a tenant and two versions to compare.");
      return;
    }
    if (fromVersion === toVersion) {
      setError("Select two different versions to compare.");
      return;
    }
    setError(null);
    setReport(null);
    setLoading(true);
    try {
      const r = await api.compareBaselineVersions(selectedTenant, fromVersion, toVersion);
      setReport(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, fromVersion, toVersion]);

  const runCustomComparison = async () => {
    if (!baselineJson.trim() || !candidateJson.trim()) {
      setError("Paste both a baseline and a candidate configuration.");
      return;
    }
    let baseline: Record<string, unknown>;
    let candidate: Record<string, unknown>;
    try {
      baseline = JSON.parse(baselineJson);
      candidate = JSON.parse(candidateJson);
    } catch {
      setError("Invalid JSON in one or both inputs.");
      return;
    }
    setError(null);
    setReport(null);
    setLoading(true);
    try {
      const r = await api.detectDrift(baseline, candidate, customBaselineVersion, customCandidateVersion);
      setReport(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRun = mode === "version" ? runVersionComparison : runCustomComparison;

  // Filtered findings
  const filteredFindings = (report?.findings ?? []).filter((f) => {
    if (filterSeverity !== "ALL" && f.severity !== filterSeverity) return false;
    if (filterType !== "ALL" && f.drift_type !== filterType) return false;
    return true;
  });

  const sortOrder: Record<DriftSeverity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sortedFindings = [...filteredFindings].sort(
    (a, b) => sortOrder[a.severity] - sortOrder[b.severity]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuration Drift</h1>
        <p className="text-sm text-slate-500 mt-1">
          Compare a tenant configuration against an approved baseline or across versions. Detects added, removed, and changed fields with severity and evidence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left panel: input ──────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => { setMode("version"); setReport(null); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "version" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              Version Compare
            </button>
            <button
              onClick={() => { setMode("custom"); setReport(null); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "custom" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              Paste JSON
            </button>
          </div>

          {mode === "version" ? (
            <Card>
              <CardHeader><CardTitle>Stored Baselines</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {loadingBaselines ? (
                  <p className="text-sm text-slate-400 animate-pulse">Loading baselines…</p>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Tenant</label>
                      <select
                        value={selectedTenant}
                        onChange={(e) => setSelectedTenant(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      >
                        {tenantIds.map((id) => (
                          <option key={id} value={id}>{id}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">From Version (baseline)</label>
                      <select
                        value={fromVersion}
                        onChange={(e) => setFromVersion(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      >
                        {tenantVersions.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">To Version (candidate)</label>
                      <select
                        value={toVersion}
                        onChange={(e) => setToVersion(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      >
                        {tenantVersions.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    {/* Baseline list */}
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2">All stored baselines</p>
                      <ul className="space-y-1">
                        {baselines.map((b) => (
                          <li key={`${b.tenant_id}-${b.version}`} className="text-xs text-slate-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                            <span className="font-mono">{b.tenant_id}</span>
                            <span className="text-slate-400">v{b.version}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-400">{b.baseline_label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Baseline version label</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={customBaselineVersion}
                  onChange={(e) => setCustomBaselineVersion(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Baseline JSON (approved)</label>
                <textarea
                  rows={8}
                  className="w-full font-mono text-xs border border-slate-200 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
                  placeholder='{"tenant_id": "...", "modules": {...}}'
                  value={baselineJson}
                  onChange={(e) => setBaselineJson(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Candidate version label</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={customCandidateVersion}
                  onChange={(e) => setCustomCandidateVersion(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Candidate JSON (proposed)</label>
                <textarea
                  rows={8}
                  className="w-full font-mono text-xs border border-slate-200 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
                  placeholder='{"tenant_id": "...", "modules": {...}}'
                  value={candidateJson}
                  onChange={(e) => setCandidateJson(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <GitCompare size={15} />}
            {loading ? "Comparing…" : "Run Drift Comparison"}
          </button>

          {report && (
            <button
              onClick={() => { setReport(null); setError(null); }}
              className="w-full px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-sm hover:bg-slate-50"
            >
              Clear Results
            </button>
          )}
        </div>

        {/* ── Right panel: results ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-indigo-200 bg-indigo-50 rounded-lg gap-3">
              <RefreshCw size={28} className="text-indigo-400 animate-spin" />
              <p className="text-sm font-medium text-indigo-700">Running drift comparison…</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Comparison failed</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && !report && (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-lg gap-3 text-slate-400">
              <Upload size={32} className="opacity-40" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  {mode === "version"
                    ? "Select a tenant and two versions, then click Run"
                    : "Paste baseline and candidate JSON, then click Run"}
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {report && !loading && (
            <>
              {/* Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{report.tenant_name} — Drift Report</CardTitle>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {report.tenant_id} · {report.baseline_version} → {report.candidate_version}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      report.summary.critical > 0 ? "bg-red-100 text-red-700 border-red-200" :
                      report.summary.high > 0 ? "bg-orange-100 text-orange-700 border-orange-200" :
                      report.summary.total_findings > 0 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                      "bg-green-100 text-green-700 border-green-200"
                    }`}>
                      {report.summary.total_findings === 0 ? "No Drift" :
                       report.summary.critical > 0 ? "Critical Drift" :
                       report.summary.high > 0 ? "High Drift" : "Drift Found"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3 text-center mb-4">
                    <div>
                      <p className="text-xl font-bold text-slate-900">{report.summary.total_findings}</p>
                      <p className="text-xs text-slate-500">Total</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-red-600">{report.summary.critical}</p>
                      <p className="text-xs text-slate-500">Critical</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-orange-600">{report.summary.high}</p>
                      <p className="text-xs text-slate-500">High</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-yellow-600">{report.summary.medium}</p>
                      <p className="text-xs text-slate-500">Medium</p>
                    </div>
                  </div>

                  {/* Type breakdown */}
                  <div className="grid grid-cols-3 gap-3 text-center border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-lg font-bold text-green-600">{report.summary.added}</p>
                      <p className="text-xs text-slate-500">Added</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-600">{report.summary.removed}</p>
                      <p className="text-xs text-slate-500">Removed</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-600">{report.summary.changed}</p>
                      <p className="text-xs text-slate-500">Changed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* No drift */}
              {report.summary.total_findings === 0 ? (
                <div className="flex flex-col items-center justify-center h-28 bg-green-50 rounded-lg border border-green-200 gap-1 text-green-700">
                  <p className="text-sm font-semibold">✓ No drift detected</p>
                  <p className="text-xs text-green-600">The candidate is identical to the baseline configuration</p>
                </div>
              ) : (
                <>
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3">
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value as FilterSeverity)}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="ALL">All Severities</option>
                      {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as DriftSeverity[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as FilterType)}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="ALL">All Types</option>
                      {(["ADDED", "REMOVED", "CHANGED"] as DriftType[]).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {(filterSeverity !== "ALL" || filterType !== "ALL") && (
                      <p className="self-center text-sm text-slate-500">
                        Showing {sortedFindings.length} of {report.findings.length}
                      </p>
                    )}
                  </div>

                  {/* Findings */}
                  <div className="space-y-2">
                    {sortedFindings.map((f) => (
                      <DriftFindingRow key={f.id} finding={f} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
