import React from "react";
import type { Conflict } from "../../types";
import { SeverityBadge, ConflictTypeBadge } from "../ui/Badge";
import { ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { severityAccent } from "../../lib/utils";

interface ConflictCardProps {
  conflict: Conflict;
  defaultExpanded?: boolean;
}

export function ConflictCard({ conflict, defaultExpanded = false }: ConflictCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const hasEvidence = !!conflict.evidence;
  const accent = severityAccent(conflict.severity);

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${accent}`,
        borderRadius: "8px",
        overflow: "hidden",
        transition: "box-shadow 150ms",
      }}
    >
      {/* Header row — clickable */}
      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "14px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          textAlign: "left",
        }}
      >
        {/* Expand icon */}
        <span style={{ color: "var(--text-muted)", marginTop: "2px", flexShrink: 0 }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
            <SeverityBadge severity={conflict.severity} />
            <ConflictTypeBadge type={conflict.conflict_type} />
          </div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
            {conflict.title}
          </div>
          {conflict.tenant_name && (
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
              {conflict.tenant_name} · <span style={{ fontFamily: "monospace" }}>{conflict.tenant_id}</span>
            </div>
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* Description */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
              Description
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              {conflict.description}
            </p>
          </div>

          {/* Fields involved */}
          {conflict.fields_involved?.length > 0 && (
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
                Fields Involved
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {conflict.fields_involved.map((f) => (
                  <code
                    key={f}
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      background: "var(--bg-surface-3)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                    }}
                  >
                    {f}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Evidence panel */}
          {hasEvidence && conflict.evidence && (
            <div
              style={{
                borderRadius: "8px",
                border: "1px solid rgba(99,102,241,0.25)",
                background: "rgba(99,102,241,0.05)",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* Evidence header */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={14} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Evidence
                </span>
              </div>

              {/* Rule pair */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div
                  style={{
                    padding: "10px 12px",
                    background: "var(--bg-surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Rule A</div>
                  <code style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-secondary)", display: "block" }}>
                    {conflict.evidence.rule_a}
                  </code>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>
                    {JSON.stringify(conflict.evidence.value_a)}
                  </div>
                </div>
                {conflict.evidence.rule_b && (
                  <div
                    style={{
                      padding: "10px 12px",
                      background: "var(--bg-surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Rule B</div>
                    <code style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-secondary)", display: "block" }}>
                      {conflict.evidence.rule_b}
                    </code>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>
                      {JSON.stringify(conflict.evidence.value_b)}
                    </div>
                  </div>
                )}
              </div>

              {/* Why */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--accent)", marginBottom: "4px" }}>
                  Why this is a conflict
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  {conflict.evidence.why_conflict}
                </p>
              </div>

              {/* Recommendation */}
              <div
                style={{
                  padding: "10px 12px",
                  background: "rgba(234,179,8,0.08)",
                  border: "1px solid rgba(234,179,8,0.2)",
                  borderRadius: "6px",
                }}
              >
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--c-medium)", marginBottom: "4px" }}>
                  ⚑ Recommended Action
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  {conflict.evidence.recommendation}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
