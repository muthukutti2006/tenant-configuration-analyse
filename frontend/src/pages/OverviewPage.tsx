import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AggregatedStats, AnalysisResult } from "../types";
import { MetricCard, MetricCardSkeleton } from "../components/ui/MetricCard";
import { SectionHeader, ErrorState } from "../components/ui/Shared";
import { StatusBadge } from "../components/ui/Badge";
import { calcHealthScore, severityAccent } from "../lib/utils";
import {
  Users, AlertTriangle, Shield,
  FileSearch, TrendingDown, CheckCircle2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";

/* ── Conflict type short labels (bar chart Y-axis must be readable) ── */
const CONFLICT_TYPE_SHORT: Record<string, string> = {
  DIRECT_RULE_CONFLICT:          "Direct Conflict",
  FEATURE_FLAG_CONFLICT:         "Feature Flag",
  DEPENDENCY_CONFLICT:           "Dependency",
  DUPLICATE_OR_CONTRADICTORY_RULE: "Duplicate Rule",
  INVALID_CONFIGURATION:         "Invalid Config",
  // Fallback: split snake_case → Title Case
};

function conflictTypeShort(raw: string): string {
  return CONFLICT_TYPE_SHORT[raw] ?? raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Health Score Ring ─────────────────────────────────────────── */
function HealthRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  const color = score >= 75 ? "var(--green)" : score >= 45 ? "var(--c-medium)" : "var(--c-critical)";
  const label = score >= 75 ? "Healthy" : score >= 45 ? "At Risk" : "Critical";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <svg width="108" height="108" viewBox="0 0 108 108" aria-label={`Health score: ${score} out of 100`}>
        {/* Track */}
        <circle cx="54" cy="54" r={r} fill="none" stroke="var(--bg-surface-3)" strokeWidth="8" />
        {/* Progress */}
        <circle
          cx="54" cy="54" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 54 54)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="54" y="50" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text-primary)">
          {score}
        </text>
        <text x="54" y="64" textAnchor="middle" fontSize="9" fill="var(--text-muted)">
          / 100
        </text>
      </svg>
      <span style={{ fontSize: "12px", fontWeight: 600, color }}>{label}</span>
      <span style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "center", maxWidth: "120px" }}>
        Avg. Config Health
      </span>
    </div>
  );
}

/* ── Custom Recharts tooltip ───────────────────────────────────── */
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-surface-2)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "8px 12px",
        fontSize: "12px",
        color: "var(--text-primary)",
      }}
    >
      <strong>{payload[0].name}</strong>: {payload[0].value}
    </div>
  );
}

/* ── Tenant row ────────────────────────────────────────────────── */
function TenantRow({ r }: { r: AnalysisResult }) {
  const score = calcHealthScore(r.summary?.critical ?? 0, r.summary?.high ?? 0, r.summary?.medium ?? 0, r.summary?.low ?? 0);
  const barColor = score >= 75 ? "var(--green)" : score >= 45 ? "var(--c-medium)" : "var(--c-critical)";

  return (
    <tr
      style={{ borderBottom: "1px solid var(--border)", transition: "background 150ms" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <td style={{ padding: "12px 16px" }}>
        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>{r.tenant_name}</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>{r.tenant_id}</div>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <span style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text-secondary)" }}>{r.version}</span>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <StatusBadge status={r.status} />
      </td>
      <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px", color: "var(--text-secondary)" }}>
        {r.normalized_rules_count}
      </td>
      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
        {r.summary?.total_conflicts ?? 0}
      </td>
      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, fontSize: "13px", color: "var(--c-critical)" }}>
        {r.summary?.critical ?? 0}
      </td>
      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, fontSize: "13px", color: "var(--c-high)" }}>
        {r.summary?.high ?? 0}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ flex: 1, height: "5px", background: "var(--bg-surface-3)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${score}%`, height: "100%", background: barColor, borderRadius: "3px", transition: "width 0.6s ease" }} />
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", width: "26px", textAlign: "right" }}>{score}</span>
        </div>
      </td>
    </tr>
  );
}

/* ── Severity order for sorting ────────────────────────────────── */
const SEV_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/* ── Main Page ──────────────────────────────────────────────────── */
export function OverviewPage() {
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .analyzeAll()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <SectionHeader title="Dashboard" subtitle="Loading configuration intelligence…" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "14px" }}>
          {[0, 1, 2, 3, 4, 5].map((i) => <MetricCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error} />;

  // ── Derived data (all from real API) ────────────────────────────
  // Average health score per tenant (not aggregate — aggregate would be misleadingly low)
  const tenantScores = stats!.results.map((r) =>
    calcHealthScore(r.summary?.critical ?? 0, r.summary?.high ?? 0, r.summary?.medium ?? 0, r.summary?.low ?? 0)
  );
  const avgHealth = tenantScores.length > 0
    ? Math.round(tenantScores.reduce((a, b) => a + b, 0) / tenantScores.length)
    : 100;

  const severityPie = [
    { name: "Critical", value: stats!.critical, color: "var(--c-critical)" },
    { name: "High",     value: stats!.high,     color: "var(--c-high)" },
    { name: "Medium",   value: stats!.medium,   color: "var(--c-medium)" },
    { name: "Low",      value: stats!.low,       color: "var(--c-low)" },
  ].filter((d) => d.value > 0);

  // Conflict type breakdown — map to short human labels
  const typeMap: Record<string, number> = {};
  stats!.results.forEach((r) => {
    Object.entries(r.summary?.conflict_types ?? {}).forEach(([type, count]) => {
      const label = conflictTypeShort(type);
      typeMap[label] = (typeMap[label] ?? 0) + count;
    });
  });
  const typeData = Object.entries(typeMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Top 5 conflicts across all tenants sorted by severity
  const allConflicts: { conflict: { severity: string; title: string; conflict_type: string }; tenantName: string }[] = [];
  stats!.results.forEach((r) => {
    (r.conflicts ?? []).forEach((c) => {
      allConflicts.push({ conflict: c, tenantName: r.tenant_name });
    });
  });
  allConflicts.sort((a, b) => (SEV_ORDER[a.conflict.severity] ?? 9) - (SEV_ORDER[b.conflict.severity] ?? 9));
  const topConflicts = allConflicts.slice(0, 5);

  const cleanCount = stats!.results.filter((r) => r.status === "clean").length;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <SectionHeader
        title="Dashboard"
        subtitle={`Live configuration risk intelligence across all ${stats!.total_tenants} tenant environments`}
        badge="Live"
      />

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "14px" }}>
        <MetricCard
          label="Tenants Analyzed"
          value={stats!.total_tenants}
          icon={Users}
          accent="var(--accent)"
          subLabel="All environments"
        />
        <MetricCard
          label="Rules Analyzed"
          value={stats!.total_rules_analyzed}
          icon={FileSearch}
          accent="#8b5cf6"
          subLabel="Across all tenants"
        />
        <MetricCard
          label="Conflicts Detected"
          value={stats!.total_conflicts}
          icon={AlertTriangle}
          accent="var(--c-high)"
          subLabel="All tenants · all modules"
        />
        <MetricCard
          label="Critical Findings"
          value={stats!.critical}
          icon={Shield}
          accent="var(--c-critical)"
          subLabel="Needs immediate attention"
        />
        <MetricCard
          label="High Severity"
          value={stats!.high}
          icon={TrendingDown}
          accent="var(--c-high)"
          subLabel="Significant risk"
        />
        <MetricCard
          label="Conflict-Free Tenants"
          value={cleanCount}
          icon={CheckCircle2}
          accent="var(--green)"
          subLabel="Zero conflicts detected"
        />
      </div>

      {/* Charts + Health row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", alignItems: "start" }}>
        {/* Severity distribution donut */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            Severity Distribution
            <span style={{ fontSize: "10px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}>All tenants</span>
          </div>
          <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie
                  data={severityPie}
                  cx={60}
                  cy={60}
                  innerRadius={40}
                  outerRadius={58}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {severityPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              {[
                { label: "Critical", value: stats!.critical, color: "var(--c-critical)" },
                { label: "High",     value: stats!.high,     color: "var(--c-high)" },
                { label: "Medium",   value: stats!.medium,   color: "var(--c-medium)" },
                { label: "Low",      value: stats!.low,       color: "var(--c-low)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", flex: 1 }}>{label}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conflict types bar chart */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            Conflicts by Type
            <span style={{ fontSize: "10px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}>All tenants</span>
          </div>
          <div style={{ padding: "16px 8px 16px 4px" }}>
            {typeData.length === 0 ? (
              <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                No conflicts recorded
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, typeData.length * 36)}>
                <BarChart data={typeData} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 14) + "…" : v}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Count" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Average Config Health */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            Avg. Configuration Health
            <span style={{ fontSize: "10px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}>per-tenant average</span>
          </div>
          <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <HealthRing score={avgHealth} />
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
              Formula: 100 − (critical×20 + high×8 + medium×3 + low×1)
            </div>
          </div>
        </div>
      </div>

      {/* Tenant analysis table */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Per-Tenant Analysis</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{stats!.total_tenants} tenants</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Tenant", "Version", "Status", "Rules", "Conflicts", "Critical", "High", "Health Score"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "9px 16px",
                      textAlign: h === "Tenant" || h === "Version" || h === "Status" ? "left" : "right",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      background: "var(--bg-surface-2)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats!.results.map((r: AnalysisResult) => (
                <TenantRow key={r.tenant_id} r={r} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Conflicts */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Top Conflicts</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Highest-severity findings across all tenants</span>
        </div>

        {topConflicts.length === 0 ? (
          <div style={{ padding: "28px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
            ✓ No conflicts found across all tenant configurations.
          </div>
        ) : (
          <div>
            {topConflicts.map(({ conflict, tenantName }, idx) => {
              const accent = severityAccent(conflict.severity);
              const title = conflict.title.length > 60 ? conflict.title.slice(0, 58) + "…" : conflict.title;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 18px",
                    borderBottom: idx < topConflicts.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: accent, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {tenantName}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: 600, background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>
                      {conflict.severity}
                    </span>
                    <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "var(--bg-surface-3)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      {conflictTypeShort(conflict.conflict_type)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
