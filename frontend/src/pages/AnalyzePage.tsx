import React, { useEffect, useRef, useState, useCallback } from "react";
import { api } from "../api/client";
import type { TenantConfig, AnalysisResult } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { ConflictCard } from "../components/conflicts/ConflictCard";
import { StatusBadge } from "../components/ui/Badge";
import { Upload, Play, RotateCcw, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export function AnalyzePage() {
  const [configurations, setConfigurations] = useState<TenantConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<TenantConfig | null>(null);
  const [customJson, setCustomJson] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  // Track last-analyzed tenant_id to avoid duplicate calls on same selection
  const lastAnalyzedId = useRef<string | null>(null);
  // Keep a ref to the latest config submitted (for retry)
  const lastConfig = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    api
      .listConfigurations()
      .then((d) => setConfigurations(d.configurations))
      .catch(() => {})
      .finally(() => setLoadingConfigs(false));
  }, []);

  // ── Core analysis function ─────────────────────────────────────────────────
  const runAnalysis = useCallback(async (config: Record<string, unknown>) => {
    setError(null);
    setResult(null);
    setLoading(true);
    lastConfig.current = config;
    try {
      const res = await api.analyze(config);
      setResult(res);
      lastAnalyzedId.current = res.tenant_id;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Preset selection: auto-trigger analysis, deduplicate same tenant ───────
  const handleSelectPreset = useCallback(
    (config: TenantConfig) => {
      // Skip if user clicks the already-selected + already-analyzed tenant
      if (
        selectedConfig?.tenant_id === config.tenant_id &&
        lastAnalyzedId.current === config.tenant_id &&
        !error
      ) {
        return;
      }
      setSelectedConfig(config);
      runAnalysis(config as unknown as Record<string, unknown>);
    },
    [selectedConfig, error, runAnalysis]
  );

  // ── Manual "Run Analysis" button (works for both modes) ───────────────────
  const handleManualAnalyze = async () => {
    if (useCustom) {
      if (!customJson.trim()) {
        setError("Please paste a JSON configuration before running analysis.");
        return;
      }
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(customJson);
      } catch {
        setError("Invalid JSON: please check your input and try again.");
        return;
      }
      lastAnalyzedId.current = null; // custom JSON has no tenant_id to deduplicate against
      await runAnalysis(parsed);
    } else {
      if (!selectedConfig) {
        setError("Please select a configuration from the list.");
        return;
      }
      // Force re-run even if same tenant (user explicitly clicked)
      lastAnalyzedId.current = null;
      await runAnalysis(selectedConfig as unknown as Record<string, unknown>);
    }
  };

  // ── Retry last failed analysis ─────────────────────────────────────────────
  const handleRetry = () => {
    if (lastConfig.current) {
      lastAnalyzedId.current = null;
      runAnalysis(lastConfig.current);
    }
  };

  // ── Derived UI state ──────────────────────────────────────────────────────
  const hasResult = result !== null;
  const isPresetMode = !useCustom;

  // Button label: "Run Analysis Again" when result already shown in preset mode
  const buttonLabel = loading
    ? "Analysing…"
    : hasResult && isPresetMode
    ? "Run Analysis Again"
    : "Run Analysis";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuration Analysis</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isPresetMode
            ? "Select a configuration below — analysis runs automatically."
            : "Paste your own JSON configuration and click Run Analysis."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left panel: input ──────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => {
                setUseCustom(false);
                // Clear stale custom results when switching back to preset mode
                if (useCustom) {
                  setResult(null);
                  setError(null);
                  lastAnalyzedId.current = null;
                }
              }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                !useCustom ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Select Preset
            </button>
            <button
              onClick={() => {
                setUseCustom(true);
                // Clear preset results when switching to custom JSON mode
                if (!useCustom) {
                  setResult(null);
                  setError(null);
                }
              }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                useCustom ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Paste JSON
            </button>
          </div>

          {/* ── Preset list ────────────────────────────────────────────── */}
          {!useCustom ? (
            <Card>
              <CardHeader>
                <CardTitle>Test Configurations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingConfigs ? (
                  <p className="px-4 py-3 text-sm text-slate-500 animate-pulse">Loading…</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {configurations.map((c) => {
                      const isSelected = selectedConfig?.tenant_id === c.tenant_id;
                      const isAnalyzed = isSelected && lastAnalyzedId.current === c.tenant_id;
                      return (
                        <li key={c.tenant_id}>
                          <button
                            onClick={() => handleSelectPreset(c)}
                            disabled={loading && isSelected}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors disabled:cursor-wait ${
                              isSelected ? "bg-indigo-50 border-l-2 border-indigo-500" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900 truncate">{c.tenant_name}</p>
                              {/* Tick when this config was analyzed successfully */}
                              {isAnalyzed && !error && !loading && (
                                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                              )}
                              {/* Spinner while this specific tenant is loading */}
                              {isSelected && loading && (
                                <RefreshCw size={14} className="text-indigo-500 animate-spin flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              {c.tenant_id} · v{c.version}
                            </p>
                            {c.metadata?.scenario ? (
                              <p className="text-xs text-indigo-600 mt-0.5">{String(c.metadata.scenario)}</p>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : (
            /* ── Custom JSON textarea ──────────────────────────────────── */
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Paste tenant configuration JSON
              </label>
              <textarea
                rows={18}
                className="w-full font-mono text-xs border border-slate-200 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
                placeholder='{"tenant_id": "...", "tenant_name": "...", ...}'
                value={customJson}
                onChange={(e) => setCustomJson(e.target.value)}
              />
            </div>
          )}

          {/* Selected config JSON preview (preset mode only) */}
          {selectedConfig && !useCustom && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration JSON</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono text-slate-700 bg-slate-50 rounded p-3 overflow-auto max-h-64">
                  {JSON.stringify(selectedConfig, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* ── Action buttons ──────────────────────────────────────────── */}
          <button
            onClick={handleManualAnalyze}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Play size={15} />
            )}
            {buttonLabel}
          </button>

          {hasResult && !loading && (
            <button
              onClick={() => {
                setResult(null);
                setError(null);
                lastAnalyzedId.current = null;
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-sm hover:bg-slate-50 transition-colors"
            >
              <RotateCcw size={14} />
              Clear Results
            </button>
          )}
        </div>

        {/* ── Right panel: results ───────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── Loading state ──────────────────────────────────────────── */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-indigo-200 bg-indigo-50 rounded-lg gap-3">
              <RefreshCw size={28} className="text-indigo-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-indigo-700">Analysing configuration…</p>
                {selectedConfig && !useCustom && (
                  <p className="text-xs text-indigo-500 mt-1">{selectedConfig.tenant_name}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Error state ────────────────────────────────────────────── */}
          {error && !loading && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-700">Analysis failed</p>
                  <p className="text-sm text-red-600 mt-0.5 break-words">{error}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition-colors"
              >
                <RefreshCw size={13} />
                Retry
              </button>
            </div>
          )}

          {/* ── Empty state (no preset selected yet, no custom mode) ──── */}
          {!loading && !error && !hasResult && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg gap-3">
              <Upload size={32} className="opacity-40" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isPresetMode
                    ? "Select a configuration to start analysis"
                    : "Paste your JSON and click Run Analysis"}
                </p>
                <p className="text-xs mt-1 opacity-70">
                  {isPresetMode ? "Analysis runs automatically on selection" : ""}
                </p>
              </div>
            </div>
          )}

          {/* ── Results ───────────────────────────────────────────────── */}
          {hasResult && !loading && (
            <>
              {/* Summary card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{result.tenant_name}</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {result.tenant_id} · v{result.version} · {result.normalized_rules_count} rules analysed
                    </p>
                  </div>
                  <StatusBadge status={result.status} />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold text-slate-900">{result.summary.total_conflicts}</p>
                      <p className="text-xs text-slate-500">Total</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-red-600">{result.summary.critical}</p>
                      <p className="text-xs text-slate-500">Critical</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-orange-600">{result.summary.high}</p>
                      <p className="text-xs text-slate-500">High</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-yellow-600">{result.summary.medium}</p>
                      <p className="text-xs text-slate-500">Medium</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Validation errors */}
              {result.validation_errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Validation Errors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.validation_errors.map((ve, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-red-500 font-bold mt-0.5">✗</span>
                        <div>
                          <code className="text-xs font-mono text-slate-600">{ve.field}</code>
                          <p className="text-slate-700">{ve.message}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Conflicts / clean state */}
              {result.conflicts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-green-700 bg-green-50 rounded-lg border border-green-200 gap-1">
                  <CheckCircle2 size={24} className="text-green-500" />
                  <p className="text-sm font-semibold">No conflicts detected</p>
                  <p className="text-xs text-green-600">This configuration is clean and ready for deployment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">
                    {result.conflicts.length} conflict{result.conflicts.length !== 1 ? "s" : ""} found
                    {" "}— sorted by severity
                  </p>
                  {result.conflicts
                    .sort((a, b) => {
                      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                      return order[a.severity] - order[b.severity];
                    })
                    .map((c) => (
                      <ConflictCard
                        key={c.id}
                        conflict={c}
                        defaultExpanded={c.severity === "CRITICAL" || c.severity === "HIGH"}
                      />
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
