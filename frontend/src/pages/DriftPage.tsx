import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import type { BaselineRecord, DriftReport, DriftFinding, DriftSeverity, DriftType } from "../types";
import { SectionHeader, ErrorState, EmptyState, SearchInput, SelectFilter } from "../components/ui/Shared";
import { MetricCard } from "../components/ui/MetricCard";
import { driftTypeStyle, severityAccent } from "../lib/utils";
import {
  GitBranch, ChevronDown, ChevronRight, AlertTriangle,
  GitCompare, RefreshCw, Activity,
} from "lucide-react";

/* ── Severity badge ─────────────────────────────────────────────── */
function SevBadge({ s }: { s: DriftSeverity }) {
  const styleMap: Record<DriftSeverity, React.CSSProperties> = {
    CRITICAL: { background: "var(--c-critical-bg)", color: "var(--c-critical)", border: "1px solid rgba(239,68,68,0.3)" },
    HIGH:     { background: "var(--c-high-bg)",     color: "var(--c-high)",     border: "1px solid rgba(249,115,22,0.3)" },
    MEDIUM:   { background: "var(--c-medium-bg)",   color: "var(--c-medium)",   border: "1px solid rgba(234,179,8,0.3)" },
    LOW:      { background: "var(--c-low-bg)",       color: "var(--c-low)",     border: "1px solid rgba(59,130,246,0.3)" },
  };
  return (
    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace", ...styleMap[s] }}>
      {s}
    </span>
  );
}

/* ── Drift type chip ────────────────────────────────────────────── */
function DriftChip({ type }: { type: DriftType }) {
  const labels: Record<DriftType, string> = {
    ADDED: "+ ADDED", REMOVED: "− REMOVED", CHANGED: "~ CHANGED", UNCHANGED: "= UNCHANGED",
  };
  return (
    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace", ...driftTypeStyle(type) }}>
      {labels[type]}
    </span>
  );
}

/* ── Single drift finding row ───────────────────────────────────── */
function FindingRow({ f }: { f: DriftFinding }) {
  const [open, setOpen] = useState(f.severity === "CRITICAL" || f.severity === "HIGH");
  const leftBorder = severityAccent(f.severity);

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${leftBorder}`,
        borderRadius: "7px",
        overflow: "hidden",
      }}
    >
      {/* Row header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "11px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          textAlign: "left",
        }}
      >
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <SevBadge s={f.severity} />
        <DriftChip type={f.drift_type} />
        <code style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {f.field}
        </code>
        {/* Value preview */}
        {f.drift_type === "CHANGED" && (
          <span style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0, fontFamily: "monospace" }}>
            <span style={{ color: "var(--c-critical)", textDecoration: "line-through" }}>{String(f.old_value)}</span>
            {" → "}
            <span style={{ color: "var(--green)" }}>{String(f.new_value)}</span>
          </span>
        )}
        {f.drift_type === "ADDED" && (
          <span style={{ fontSize: "11px", color: "var(--green)", flexShrink: 0, fontFamily: "monospace" }}>
            = {String(f.new_value)}
          </span>
        )}
        {f.drift_type === "REMOVED" && (
          <span style={{ fontSize: "11px", color: "var(--c-critical)", textDecoration: "line-through", flexShrink: 0, fontFamily: "monospace" }}>
            {String(f.old_value)}
          </span>
        )}
      </button>

      {/* Evidence panel */}
      {open && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            background: "var(--bg-surface-2)",
          }}
        >
          {/* Git-style diff */}
          {f.drift_type !== "UNCHANGED" && (
            <div
              style={{
                borderRadius: "6px",
                overflow: "hidden",
                border: "1px solid var(--border)",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            >
              {(f.drift_type === "CHANGED" || f.drift_type === "REMOVED") && (
                <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.08)", color: "var(--c-critical)", borderBottom: "1px solid var(--border)" }}>
                  − {f.field}: {String(f.old_value)}
                </div>
              )}
              {(f.drift_type === "CHANGED" || f.drift_type === "ADDED") && (
                <div style={{ padding: "8px 12px", background: "rgba(34,197,94,0.08)", color: "var(--green)" }}>
                  + {f.field}: {String(f.new_value)}
                </div>
              )}
            </div>
          )}

          {/* Evidence details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Reason</span>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{f.evidence.reason}</p>
            </div>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Impact</span>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{f.evidence.impact}</p>
            </div>
            <div style={{ padding: "8px 12px", background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: "6px" }}>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--c-medium)", textTransform: "uppercase", letterSpacing: "0.06em" }}>⚑ Recommendation</span>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{f.evidence.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Drift report view ──────────────────────────────────────────── */
function DriftReportView({ report, onClear }: { report: DriftReport; onClear: () => void }) {
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [search, setSearch] = useState("");

  const findings = report.findings.filter((f) => {
    if (filterSeverity !== "ALL" && f.severity !== filterSeverity) return false;
    if (filterType !== "ALL" && f.drift_type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!f.field.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const actionable = report.findings.filter((f) => f.drift_type !== "UNCHANGED");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Version comparison header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 20px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
        }}
      >
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Baseline</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>{report.tenant_id}</div>
          <div
            style={{
              fontSize: "12px",
              fontFamily: "monospace",
              color: "var(--accent)",
              marginTop: "2px",
              padding: "2px 8px",
              background: "var(--accent-light)",
              borderRadius: "4px",
              display: "inline-block",
            }}
          >
            {report.baseline_version}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "var(--text-muted)" }}>
          <div style={{ height: "24px", width: "1px", background: "var(--border)" }} />
          <GitCompare size={16} />
          <div style={{ height: "24px", width: "1px", background: "var(--border)" }} />
        </div>

        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Candidate</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>{report.tenant_name}</div>
          <div
            style={{
              fontSize: "12px",
              fontFamily: "monospace",
              color: "var(--green)",
              marginTop: "2px",
              padding: "2px 8px",
              background: "var(--green-light)",
              borderRadius: "4px",
              display: "inline-block",
            }}
          >
            {report.candidate_version}
          </div>
        </div>

        <button
          onClick={onClear}
          style={{
            marginLeft: "auto",
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: "6px 10px",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <RefreshCw size={12} /> New
        </button>
      </div>

      {/* Summary metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
        <MetricCard label="Total Findings" value={report.summary.total_findings} icon={Activity} accent="var(--accent)" />
        <MetricCard label="Changed Fields" value={report.summary.changed} icon={GitCompare} accent="var(--c-medium)" />
        <MetricCard label="Critical/High" value={report.summary.critical + report.summary.high} icon={AlertTriangle} accent="var(--c-critical)" />
        <MetricCard label="Added Fields" value={report.summary.added} icon={GitBranch} accent="var(--green)" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Filter by field path…" />
        <SelectFilter
          value={filterSeverity}
          onChange={setFilterSeverity}
          options={[
            { value: "ALL", label: "All Severities" },
            { value: "CRITICAL", label: "Critical" },
            { value: "HIGH", label: "High" },
            { value: "MEDIUM", label: "Medium" },
            { value: "LOW", label: "Low" },
          ]}
        />
        <SelectFilter
          value={filterType}
          onChange={setFilterType}
          options={[
            { value: "ALL", label: "All Types" },
            { value: "CHANGED", label: "Changed" },
            { value: "ADDED", label: "Added" },
            { value: "REMOVED", label: "Removed" },
          ]}
        />
      </div>

      {/* Findings */}
      {findings.length === 0 ? (
        <EmptyState icon={GitBranch} title="No findings match your filters" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {findings.map((f) => (
            <FindingRow key={f.id} f={f} />
          ))}
        </div>
      )}

      {/* Unchanged notice */}
      {report.summary.unchanged > 0 && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "7px",
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border)",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          {report.summary.unchanged} field{report.summary.unchanged !== 1 ? "s" : ""} unchanged and not shown.
        </div>
      )}
    </div>
  );
}

/* ── Main DriftPage ─────────────────────────────────────────────── */
export function DriftPage() {
  const [baselines, setBaselines] = useState<BaselineRecord[]>([]);
  const [loadingBaselines, setLoadingBaselines] = useState(true);
  const [mode, setMode] = useState<"versions" | "paste">("versions");

  // Version compare state
  const [tenantId, setTenantId] = useState("");
  const [tenantVersions, setTenantVersions] = useState<string[]>([]);
  const [fromVersion, setFromVersion] = useState("");
  const [toVersion, setToVersion] = useState("");

  // Paste mode state
  const [baselineJson, setBaselineJson] = useState("");
  const [candidateJson, setCandidateJson] = useState("");

  const [report, setReport] = useState<DriftReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listBaselines()
      .then((d) => setBaselines(d.baselines))
      .catch(() => {})
      .finally(() => setLoadingBaselines(false));
  }, []);

  // Group baselines by tenant
  const tenantGroups: Record<string, string[]> = {};
  baselines.forEach((b) => {
    if (!tenantGroups[b.tenant_id]) tenantGroups[b.tenant_id] = [];
    if (!tenantGroups[b.tenant_id].includes(b.version))
      tenantGroups[b.tenant_id].push(b.version);
  });
  const tenantIds = Object.keys(tenantGroups);

  const handleTenantChange = useCallback(
    (tid: string) => {
      setTenantId(tid);
      const versions = tenantGroups[tid] ?? [];
      setTenantVersions(versions);
      setFromVersion(versions[0] ?? "");
      setToVersion(versions[1] ?? versions[0] ?? "");
    },
    [baselines]
  );

  const runVersionCompare = async () => {
    if (!tenantId || !fromVersion || !toVersion) {
      setError("Select a tenant and both versions.");
      return;
    }
    setError(null);
    setReport(null);
    setAnalyzing(true);
    try {
      const r = await api.compareBaselineVersions(tenantId, fromVersion, toVersion);
      setReport(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const runPasteCompare = async () => {
    let base: Record<string, unknown>;
    let cand: Record<string, unknown>;
    try { base = JSON.parse(baselineJson); } catch { setError("Invalid baseline JSON."); return; }
    try { cand = JSON.parse(candidateJson); } catch { setError("Invalid candidate JSON."); return; }
    setError(null);
    setReport(null);
    setAnalyzing(true);
    try {
      const r = await api.detectDrift(base, cand);
      setReport(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (report) {
    return (
      <div className="animate-fade-in">
        <SectionHeader title="Configuration Drift" subtitle="Field-level deviation from approved baseline" />
        <DriftReportView report={report} onClear={() => setReport(null)} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <SectionHeader
        title="Configuration Drift"
        subtitle="Detect field-level deviations between a baseline and a proposed configuration version."
      />

      {/* Mode tabs */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border)" }}>
        {(["versions", "paste"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: mode === m ? 600 : 400,
              color: mode === m ? "var(--accent)" : "var(--text-secondary)",
              background: "none",
              border: "none",
              borderBottom: mode === m ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              marginBottom: "-1px",
            }}
          >
            {m === "versions" ? "Version Compare" : "Paste JSON"}
          </button>
        ))}
      </div>

      {/* Version compare panel */}
      {mode === "versions" && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
            Compare two stored approved baseline versions side-by-side.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>TENANT</label>
              <select
                value={tenantId}
                onChange={(e) => handleTenantChange(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", fontSize: "13px", background: "var(--bg-surface-2)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", outline: "none" }}
              >
                <option value="">Select tenant…</option>
                {tenantIds.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>BASELINE VERSION</label>
              <select
                value={fromVersion}
                onChange={(e) => setFromVersion(e.target.value)}
                disabled={!tenantId}
                style={{ width: "100%", padding: "8px 10px", fontSize: "13px", background: "var(--bg-surface-2)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", outline: "none" }}
              >
                {tenantVersions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>CANDIDATE VERSION</label>
              <select
                value={toVersion}
                onChange={(e) => setToVersion(e.target.value)}
                disabled={!tenantId}
                style={{ width: "100%", padding: "8px 10px", fontSize: "13px", background: "var(--bg-surface-2)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", outline: "none" }}
              >
                {tenantVersions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <button
              onClick={runVersionCompare}
              disabled={analyzing || !tenantId}
              style={{
                padding: "8px 18px",
                background: analyzing ? "var(--bg-surface-3)" : "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: analyzing || !tenantId ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {analyzing ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Analyzing…</> : <><GitCompare size={13} /> Compare</>}
            </button>
          </div>

          {/* Available baselines info */}
          {!loadingBaselines && tenantIds.length > 0 && (
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {tenantIds.length} tenant{tenantIds.length !== 1 ? "s" : ""} with stored baselines:{" "}
              {tenantIds.map((t, i) => (
                <span key={t}>
                  <code style={{ color: "var(--text-secondary)" }}>{t}</code>
                  {i < tenantIds.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Paste JSON panel */}
      {mode === "paste" && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
            Paste two raw configurations to compare them directly.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                BASELINE JSON
              </label>
              <textarea
                value={baselineJson}
                onChange={(e) => setBaselineJson(e.target.value)}
                placeholder='{"tenant_id": "...", "modules": {...}}'
                rows={12}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  background: "var(--bg-surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--text-primary)",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                CANDIDATE JSON
              </label>
              <textarea
                value={candidateJson}
                onChange={(e) => setCandidateJson(e.target.value)}
                placeholder='{"tenant_id": "...", "modules": {...}}'
                rows={12}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  background: "var(--bg-surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--text-primary)",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
          <div>
            <button
              onClick={runPasteCompare}
              disabled={analyzing}
              style={{
                padding: "8px 20px",
                background: analyzing ? "var(--bg-surface-3)" : "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: analyzing ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {analyzing ? <><RefreshCw size={13} /> Analyzing…</> : <><GitCompare size={13} /> Detect Drift</>}
            </button>
          </div>
        </div>
      )}

      {error && <ErrorState message={error} />}
    </div>
  );
}
