import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { ConflictRule, Severity } from "../types";
import { SeverityBadge, ConflictTypeBadge } from "../components/ui/Badge";
import { SectionHeader, ErrorState } from "../components/ui/Shared";
import { MetricCard } from "../components/ui/MetricCard";
import { FileText, Shield } from "lucide-react";

const SEVERITY_POLICY = [
  {
    level: "CRITICAL" as Severity,
    definition: "Configuration causes major incorrect business behavior or deployment failure.",
    examples: ["fees module disabled but fee clearance required", "attendance disabled but attendance clearance required"],
    accent: "var(--c-critical)",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.2)",
  },
  {
    level: "HIGH" as Severity,
    definition: "Conflicting rules affect important student-service decisions.",
    examples: ["online payment disabled but required before admission", "attendance threshold mismatch affecting exam eligibility"],
    accent: "var(--c-high)",
    bg: "rgba(249,115,22,0.07)",
    border: "rgba(249,115,22,0.2)",
  },
  {
    level: "MEDIUM" as Severity,
    definition: "Potential inconsistent behavior with limited operational impact.",
    examples: ["grace period configured without late fee", "digital certificate flag vs signature requirement"],
    accent: "var(--c-medium)",
    bg: "rgba(234,179,8,0.07)",
    border: "rgba(234,179,8,0.2)",
  },
  {
    level: "LOW" as Severity,
    definition: "Minor configuration inconsistency or advisory warning.",
    examples: ["duplicate attendance threshold fields"],
    accent: "var(--c-low)",
    bg: "rgba(59,130,246,0.07)",
    border: "rgba(59,130,246,0.2)",
  },
];

export function RulesPage() {
  const [rules, setRules] = useState<ConflictRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listRules().then((d) => setRules(d.rules)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <SectionHeader
        title="Detection Rules"
        subtitle="All conflict detection rules with deterministic severity classification policy."
        badge={`${rules.length} rules`}
      />

      {/* Distinction note */}
      <div
        style={{
          padding: "12px 16px",
          background: "var(--accent-light)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "var(--radius-sm)",
          fontSize: "12px",
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "var(--accent)" }}>Detection Rules</strong> (this page) lists the raw rule
        objects used by the conflict detection engine and their severity policy.{" "}
        The <strong style={{ color: "var(--accent)" }}>Rules Catalogue</strong> (/catalog) provides the full
        machine-readable catalogue including conditions, evidence templates, and per-rule metadata.
      </div>
      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}>
        <MetricCard label="Detection Rules" value={rules.length} icon={FileText} accent="var(--accent)" />
        <MetricCard label="Severity Levels" value={4} icon={Shield} accent="var(--c-critical)" />
      </div>

      {/* Severity classification policy */}
      <section>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px", marginTop: 0 }}>
          Severity Classification Policy
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: 1.6 }}>
          Severity is assigned deterministically based on documented rules — not arbitrary scores. Every classification has a stated rationale.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}>
          {SEVERITY_POLICY.map((p) => (
            <div
              key={p.level}
              style={{
                padding: "14px 16px",
                background: p.bg,
                border: `1px solid ${p.border}`,
                borderLeft: `3px solid ${p.accent}`,
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <SeverityBadge severity={p.level} />
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{p.definition}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
                {p.examples.map((ex) => (
                  <li key={ex} style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", gap: "6px", alignItems: "flex-start" }}>
                    <span style={{ color: p.accent, flexShrink: 0 }}>•</span>
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Rules table */}
      <section>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", marginTop: 0 }}>
          Conflict Detection Rules
        </h2>
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: "16px" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: "40px", borderRadius: "5px", marginBottom: "6px" }} />
              ))}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface-2)", borderBottom: "1px solid var(--border)" }}>
                    {["ID", "Name", "Type", "Description", "Severity"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr
                      key={r.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "10px 14px" }}>
                        <code style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--text-muted)" }}>{r.id}</code>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                        {r.name}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <ConflictTypeBadge type={r.type} />
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "12px", color: "var(--text-secondary)", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.description}>{r.description}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <SeverityBadge severity={r.default_severity} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
