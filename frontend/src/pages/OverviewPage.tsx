import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AggregatedStats, AnalysisResult } from "../types";
import { MetricCard, MetricCardSkeleton } from "../components/ui/MetricCard";
import { SectionHeader, ErrorState } from "../components/ui/Shared";
import { StatusBadge } from "../components/ui/Badge";
import { calcHealthScore } from "../lib/utils";
import {
  Users, AlertTriangle, Shield,
  FileSearch, TrendingDown, CheckCircle2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";

/* ── Health Score Ring ─────────────────────────────────────────── */
function HealthRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  const color = score >= 75 ? "var(--green)" : score >= 45 ? "var(--c-medium)" : "var(--c-critical)";
  const label = score >= 75 ? "Healthy" : score >= 45 ? "At Risk" : "Critical";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <svg width="108" height="108" viewBox="0 0 108 108">
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
        CONFIQRA Health Score
      </span>
    </div>
  );
}

/* ── Recharts custom tooltip ───────────────────────────────────── */
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

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "var(--c-critical)",
  High: "var(--c-high)",
  Medium: "var(--c-medium)",
  Low: "var(--c-low)",
};

/* ── Tenant row ────────────────────────────────────────────────── */
function TenantRow({ r }: { r: AnalysisResult }) {
  const score = calcHealthScore(r.summary?.critical ?? 0, r.summary?.high ?? 0, r.summary?.medium ?? 0, r.summary?.low ?? 0);
  const barColor = score >= 75 ? "var(--green)" : score >= 45 ? "var(--c-medium)" : "var(--c-critical)";

  return (
    <tr
      style={{
        borderBottom: "1px solid var(--border)",
        transition: "background 150ms",
      }}
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
          <div
            style={{
              flex: 1,
              height: "5px",
              background: "var(--bg-surface-3)",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${score}%`,
                height: "100%",
                background: barColor,
                borderRadius: "3px",
                transition: "width 0.6s ease",
              }}
            />
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", width: "26px", textAlign: "right" }}>
            {score}
          </span>
        </div>
      </td>
    </tr>
  );
}

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
      <div className="animate-fade-in">
        <SectionHeader title="Dashboard" subtitle="Loading configuration intelligence…" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "20px" }}>
          {[0, 1, 2, 3].map((i) => <MetricCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error} />;

  // Derived data (all from real API)
  const health = calcHealthScore(stats!.critical, stats!.high, stats!.medium, stats!.low);
  const severityPie = [
    { name: "Critical", value: stats!.critical, color: "var(--c-critical)" },
    { name: "High",     value: stats!.high,     color: "var(--c-high)" },
    { name: "Medium",   value: stats!.medium,   color: "var(--c-medium)" },
    { name: "Low",      value: stats!.low,       color: "var(--c-low)" },
  ].filter(d => d.value > 0);

  // Conflict type breakdown
  const typeMap: Record<string, number> = {};
  stats!.results.forEach((r) => {
    Object.entries(r.summary?.conflict_types ?? {}).forEach(([type, count]) => {
      typeMap[type.replace(/_/g, " ")] = (typeMap[type.replace(/_/g, " ")] ?? 0) + count;
    });
  });
  const typeData = Object.entries(typeMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <SectionHeader
        title="Dashboard"
        subtitle="Tenant configuration intelligence across all environments"
        badge="Live"
      />

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "14px" }}>
        <MetricCard
          label="Tenants Analyzed"
          value={stats!.total_tenants}
          icon={Users}
          accent="var(--accent)"
        />
        <MetricCard
          label="Rules Analyzed"
          value={stats!.total_rules_analyzed}
          icon={FileSearch}
          accent="#8b5cf6"
        />
        <MetricCard
          label="Conflicts Detected"
          value={stats!.total_conflicts}
          icon={AlertTriangle}
          accent="var(--c-high)"
        />
        <MetricCard
          label="Critical Findings"
          value={stats!.critical}
          icon={Shield}
          accent="var(--c-critical)"
        />
        <MetricCard
          label="High Severity"
          value={stats!.high}
          icon={TrendingDown}
          accent="var(--c-high)"
        />
        <MetricCard
          label="Clean Tenants"
          value={stats!.results.filter(r => r.status === "clean").length}
          icon={CheckCircle2}
          accent="var(--green)"
        />
      </div>

      {/* Charts + Health */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: "16px" }}>
        {/* Severity donut */}
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
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Severity Distribution
          </div>
          <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={severityPie}
                  cx={65}
                  cy={65}
                  innerRadius={42}
                  outerRadius={60}
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

        {/* Conflict types bar */}
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
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Conflicts by Type
          </div>
          <div style={{ padding: "16px" }}>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={typeData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={130}
                  tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health score */}
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
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Configuration Health
          </div>
          <div
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <HealthRing score={health} />
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
              Formula: 100 − (critical×20 + high×8 + medium×3 + low×1), clamped [0,100]. Based on live conflict data.
            </div>
          </div>
        </div>
      </div>

      {/* Tenant table */}
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
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            Tenant Analysis Results
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {stats!.total_tenants} tenants
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Tenant", "Version", "Status", "Rules", "Conflicts", "Critical", "High", "Health"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
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
    </div>
  );
}
