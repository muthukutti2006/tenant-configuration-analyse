import React, { useEffect, useRef, useState, useCallback } from "react";
import { api } from "../api/client";
import type { TenantConfig, AnalysisResult } from "../types";
import { ConflictCard } from "../components/conflicts/ConflictCard";
import { StatusBadge } from "../components/ui/Badge";
import { SectionHeader, ErrorState } from "../components/ui/Shared";
import { Play, RotateCcw, RefreshCw, CheckCircle2, AlertCircle, ScanSearch } from "lucide-react";

/* ── Step indicator ─────────────────────────────────────────────── */
function Step({
  n, label, active, done,
}: {
  n: number; label: string; active?: boolean; done?: boolean;
}) {
  const bg = done ? "var(--green)" : active ? "var(--accent)" : "var(--bg-surface-3)";
  const textColor = done || active ? "#fff" : "var(--text-muted)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {done ? (
          <CheckCircle2 size={12} style={{ color: "#fff" }} />
        ) : (
          <span style={{ fontSize: "10px", fontWeight: 700, color: textColor }}>{n}</span>
        )}
      </div>
      <span style={{ fontSize: "12px", fontWeight: active || done ? 600 : 400, color: active || done ? "var(--text-primary)" : "var(--text-muted)" }}>
        {label}
      </span>
    </div>
  );
}

export function AnalyzePage() {
  const [configurations, setConfigurations] = useState<TenantConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<TenantConfig | null>(null);
  const [customJson, setCustomJson] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  const lastAnalyzedId = useRef<string | null>(null);
  const lastConfig = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    api
      .listConfigurations()
      .then((d) => setConfigurations(d.configurations))
      .catch(() => {})
      .finally(() => setLoadingConfigs(false));
  }, []);

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

  const handleSelectPreset = useCallback(
    (config: TenantConfig) => {
      if (
        selectedConfig?.tenant_id === config.tenant_id &&
        lastAnalyzedId.current === config.tenant_id &&
        !error
      ) return;
      setSelectedConfig(config);
      runAnalysis(config as unknown as Record<string, unknown>);
    },
    [selectedConfig, error, runAnalysis]
  );

  const handleManualAnalyze = async () => {
    if (useCustom) {
      if (!customJson.trim()) { setError("Please paste a JSON configuration before running analysis."); return; }
      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(customJson); } catch { setError("Invalid JSON: please check your input and try again."); return; }
      lastAnalyzedId.current = null;
      await runAnalysis(parsed);
    } else {
      if (!selectedConfig) { setError("Please select a configuration from the list."); return; }
      lastAnalyzedId.current = null;
      await runAnalysis(selectedConfig as unknown as Record<string, unknown>);
    }
  };

  const handleRetry = () => {
    if (lastConfig.current) { lastAnalyzedId.current = null; runAnalysis(lastConfig.current); }
  };

  const hasResult = result !== null;
  const isPresetMode = !useCustom;
  const buttonLabel = loading ? "Analysing…" : hasResult && isPresetMode ? "Run Again" : "Run Analysis";

  // Determine workflow step
  const step = loading ? 2 : hasResult ? (result.conflicts.length > 0 ? 3 : 4) : isPresetMode && selectedConfig ? 2 : 1;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <SectionHeader
        title="Analyze Configuration"
        subtitle={isPresetMode ? "Select a preset — analysis runs automatically." : "Paste your JSON configuration and run analysis."}
      />

      {/* Step indicators */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          padding: "14px 18px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          flexWrap: "wrap",
        }}
      >
        <Step n={1} label="Select Configuration" done={step > 1} active={step === 1} />
        <span style={{ color: "var(--border-strong)", alignSelf: "center" }}>→</span>
        <Step n={2} label="Analyze" done={step > 2} active={step === 2} />
        <span style={{ color: "var(--border-strong)", alignSelf: "center" }}>→</span>
        <Step n={3} label="Review Conflicts" done={step === 4} active={step === 3} />
        <span style={{ color: "var(--border-strong)", alignSelf: "center" }}>→</span>
        <Step n={4} label="Examine Evidence" done={false} active={step === 4} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: "20px",
        }}
      >
        {/* LEFT: input panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Mode toggle */}
          <div
            style={{
              display: "flex",
              border: "1px solid var(--border)",
              borderRadius: "7px",
              overflow: "hidden",
            }}
          >
            {["Select Preset", "Paste JSON"].map((label, i) => {
              const isActive = (i === 0 && !useCustom) || (i === 1 && useCustom);
              return (
                <button
                  key={label}
                  onClick={() => {
                    const custom = i === 1;
                    setUseCustom(custom);
                    if (custom !== useCustom) { setResult(null); setError(null); }
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    fontSize: "12px",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    background: isActive ? "var(--accent)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 150ms",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Preset list */}
          {!useCustom && (
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Test Configurations
              </div>
              {loadingConfigs ? (
                <div style={{ padding: "12px 14px" }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton" style={{ height: "40px", borderRadius: "5px", marginBottom: "6px" }} />
                  ))}
                </div>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {configurations.map((c) => {
                    const isSelected = selectedConfig?.tenant_id === c.tenant_id;
                    const isAnalyzed = isSelected && lastAnalyzedId.current === c.tenant_id;
                    return (
                      <li key={c.tenant_id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <button
                          onClick={() => handleSelectPreset(c)}
                          disabled={loading && isSelected}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            textAlign: "left",
                            background: isSelected ? "var(--accent-light)" : "transparent",
                            borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent",
                            border: "none",
                            cursor: loading && isSelected ? "wait" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {c.tenant_name}
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", fontFamily: "monospace" }}>
                              {c.tenant_id}
                            </div>
                          </div>
                          {isSelected && loading && <RefreshCw size={12} style={{ color: "var(--accent)", animation: "spin 1s linear infinite", flexShrink: 0 }} />}
                          {isAnalyzed && !error && !loading && <CheckCircle2 size={12} style={{ color: "var(--green)", flexShrink: 0 }} />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Custom JSON textarea */}
          {useCustom && (
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                PASTE CONFIGURATION JSON
              </label>
              <textarea
                rows={16}
                value={customJson}
                onChange={(e) => setCustomJson(e.target.value)}
                placeholder={'{"tenant_id": "...", "tenant_name": "...", "modules": {...}}'}
                style={{
                  width: "100%",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  padding: "10px 12px",
                  background: "var(--bg-surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "7px",
                  color: "var(--text-primary)",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
          )}

          {/* Actions */}
          <button
            onClick={handleManualAnalyze}
            disabled={loading}
            style={{
              padding: "9px",
              background: loading ? "var(--bg-surface-3)" : "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "7px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
            }}
          >
            {loading ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={14} />}
            {buttonLabel}
          </button>

          {hasResult && !loading && (
            <button
              onClick={() => { setResult(null); setError(null); lastAnalyzedId.current = null; }}
              style={{
                padding: "8px",
                background: "var(--bg-surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "7px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <RotateCcw size={13} /> Clear Results
            </button>
          )}
        </div>

        {/* RIGHT: results panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Loading */}
          {loading && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "200px",
                border: "2px dashed var(--accent)",
                borderRadius: "10px",
                background: "var(--accent-light)",
                gap: "12px",
              }}
            >
              <RefreshCw size={28} style={{ color: "var(--accent)", animation: "spin 1s linear infinite" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: 0 }}>Analysing configuration…</p>
                {selectedConfig && !useCustom && (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{selectedConfig.tenant_name}</p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div
              style={{
                padding: "14px 16px",
                background: "var(--c-critical-bg)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <AlertCircle size={16} style={{ color: "var(--c-critical)", flexShrink: 0, marginTop: "2px" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--c-critical)", margin: 0 }}>Analysis Failed</p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>{error}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                style={{
                  marginTop: "10px",
                  padding: "5px 12px",
                  background: "var(--bg-surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "5px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && !hasResult && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "240px",
                border: "2px dashed var(--border)",
                borderRadius: "10px",
                gap: "12px",
              }}
            >
              <ScanSearch size={32} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", margin: 0 }}>
                  {isPresetMode ? "Select a configuration to start analysis" : "Paste your JSON and click Run Analysis"}
                </p>
                {isPresetMode && (
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Analysis runs automatically on selection
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {hasResult && !loading && result && (
            <>
              {/* Summary */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{result.tenant_name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", fontFamily: "monospace" }}>
                      {result.tenant_id} · v{result.version} · {result.normalized_rules_count} rules analysed
                    </div>
                  </div>
                  <StatusBadge status={result.status} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0" }}>
                  {[
                    { label: "Total", value: result.summary.total_conflicts, color: "var(--text-primary)" },
                    { label: "Critical", value: result.summary.critical, color: "var(--c-critical)" },
                    { label: "High", value: result.summary.high, color: "var(--c-high)" },
                    { label: "Medium", value: result.summary.medium, color: "var(--c-medium)" },
                  ].map(({ label, value, color }, i) => (
                    <div
                      key={label}
                      style={{
                        padding: "14px 18px",
                        textAlign: "center",
                        borderRight: i < 3 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <div style={{ fontSize: "20px", fontWeight: 700, color }}>{value}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation errors */}
              {result.validation_errors.length > 0 && (
                <div
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Validation Errors
                  </div>
                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {result.validation_errors.map((ve, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
                        <span style={{ color: "var(--c-critical)", fontWeight: 700, flexShrink: 0 }}>✗</span>
                        <div>
                          <code style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-secondary)" }}>{ve.field}</code>
                          <p style={{ margin: "2px 0 0", color: "var(--text-secondary)" }}>{ve.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conflicts or clean */}
              {result.conflicts.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "120px",
                    background: "rgba(34,197,94,0.07)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    borderRadius: "10px",
                    gap: "8px",
                  }}
                >
                  <CheckCircle2 size={24} style={{ color: "var(--green)" }} />
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--green)", margin: 0 }}>No conflicts detected</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>This configuration is clean</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                    {result.conflicts.length} conflict{result.conflicts.length !== 1 ? "s" : ""} found — sorted by severity
                  </p>
                  {[...result.conflicts]
                    .sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[a.severity] ?? 4) - ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[b.severity] ?? 4))
                    .map((c) => (
                      <ConflictCard key={c.id} conflict={c} defaultExpanded={c.severity === "CRITICAL" || c.severity === "HIGH"} />
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
