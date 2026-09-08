import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { TenantConfig, AnalysisResult } from "../types";
import { StatusBadge } from "../components/ui/Badge";
import { ConflictCard } from "../components/conflicts/ConflictCard";
import { SectionHeader, ErrorState, EmptyState } from "../components/ui/Shared";
import { Database, Play, RefreshCw, CheckCircle2 } from "lucide-react";

export function ConfigurationsPage() {
  const [configs, setConfigs] = useState<TenantConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TenantConfig | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysing, setAnalysing] = useState(false);

  useEffect(() => {
    api
      .listConfigurations()
      .then((d) => setConfigs(d.configurations))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (c: TenantConfig) => {
    setSelected(c);
    setResult(null);
    setAnalysing(true);
    try {
      const res = await api.analyze(c as unknown as Record<string, unknown>);
      setResult(res);
    } finally {
      setAnalysing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <SectionHeader
        title="Test Configurations"
        subtitle="8 realistic tenant configurations covering all conflict scenarios"
        badge={`${configs.length} configs`}
      />

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "18px" }}>
        {/* Config list */}
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
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Tenant Configurations ({configs.length})
          </div>
          {loading ? (
            <div style={{ padding: "12px 14px" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: "50px", borderRadius: "5px", marginBottom: "8px" }} />
              ))}
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {configs.map((c) => {
                const isSelected = selected?.tenant_id === c.tenant_id;
                return (
                  <li key={c.tenant_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <button
                      onClick={() => handleSelect(c)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        textAlign: "left",
                        background: isSelected ? "var(--accent-light)" : "transparent",
                        borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.tenant_name}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace", marginTop: "2px" }}>
                        {c.tenant_id}
                      </div>
                      {c.metadata?.scenario ? (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: "4px",
                            fontSize: "10px",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            background: "var(--accent-light)",
                            color: "var(--accent)",
                          }}
                        >
                          {String(c.metadata.scenario)}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Detail panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {!selected ? (
            <EmptyState icon={Database} title="Select a configuration" description="Click a tenant in the list to view and analyse it" />
          ) : (
            <>
              {/* Config header */}
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
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{selected.tenant_name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace", marginTop: "2px" }}>
                      {selected.tenant_id} · v{selected.version}
                    </div>
                  </div>
                  {result ? <StatusBadge status={result.status} /> : null}
                </div>
                {selected.metadata?.description ? (
                  <div
                    style={{
                      padding: "10px 18px",
                      borderBottom: "1px solid var(--border)",
                      background: "rgba(234,179,8,0.07)",
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <strong style={{ color: "var(--c-medium)" }}>Scenario: </strong>{String(selected.metadata.description)}
                  </div>
                ) : null}
                <div style={{ padding: "14px 18px" }}>
                  <pre
                    style={{
                      fontSize: "11px",
                      fontFamily: "monospace",
                      color: "var(--text-secondary)",
                      background: "var(--bg-surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      padding: "12px",
                      overflowX: "auto",
                      maxHeight: "280px",
                      margin: 0,
                    }}
                  >
                    {JSON.stringify(selected, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Analysis loading */}
              {analysing && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px", color: "var(--text-muted)", fontSize: "13px" }}>
                  <RefreshCw size={14} style={{ animation: "spin 1s linear infinite", color: "var(--accent)" }} />
                  Running analysis…
                </div>
              )}

              {/* Analysis results */}
              {result && !analysing && (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(5,1fr)",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    {[
                      { label: "Rules", value: result.normalized_rules_count, color: "var(--text-primary)" },
                      { label: "Conflicts", value: result.summary.total_conflicts, color: "var(--text-primary)" },
                      { label: "Critical", value: result.summary.critical, color: "var(--c-critical)" },
                      { label: "High", value: result.summary.high, color: "var(--c-high)" },
                      { label: "Medium", value: result.summary.medium, color: "var(--c-medium)" },
                    ].map(({ label, value, color }, i) => (
                      <div key={label} style={{ padding: "14px", textAlign: "center", borderRight: i < 4 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ fontSize: "18px", fontWeight: 700, color }}>{value}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {result.conflicts.length === 0 ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "80px",
                        background: "rgba(34,197,94,0.07)",
                        border: "1px solid rgba(34,197,94,0.2)",
                        borderRadius: "8px",
                        gap: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--green)",
                      }}
                    >
                      <CheckCircle2 size={18} /> No conflicts detected
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                      {[...result.conflicts]
                        .sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[a.severity] ?? 4) - ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[b.severity] ?? 4))
                        .map((c) => (
                          <ConflictCard key={c.id} conflict={c} defaultExpanded={c.severity === "CRITICAL" || c.severity === "HIGH"} />
                        ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
