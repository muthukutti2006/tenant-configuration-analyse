import React from "react";
import { cn } from "../../lib/utils";
import type { Severity } from "../../types";

/* ── SeverityBadge ─────────────────────────────────────────────── */
const SEVERITY_STYLE: Record<string, React.CSSProperties> = {
  CRITICAL: { background: "var(--c-critical-bg)", color: "var(--c-critical)", border: "1px solid rgba(239,68,68,0.3)" },
  HIGH:     { background: "var(--c-high-bg)",     color: "var(--c-high)",     border: "1px solid rgba(249,115,22,0.3)" },
  MEDIUM:   { background: "var(--c-medium-bg)",   color: "var(--c-medium)",   border: "1px solid rgba(234,179,8,0.3)" },
  LOW:      { background: "var(--c-low-bg)",       color: "var(--c-low)",     border: "1px solid rgba(59,130,246,0.3)" },
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center rounded text-xs font-semibold", className)}
      style={{ padding: "2px 7px", ...SEVERITY_STYLE[severity] }}
    >
      {severity}
    </span>
  );
}

/* ── ConflictTypeBadge ────────────────────────────────────────────── */
export function ConflictTypeBadge({ type, className }: { type: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center rounded text-xs font-medium", className)}
      style={{
        padding: "2px 7px",
        background: "var(--bg-surface-3)",
        color: "var(--text-secondary)",
        border: "1px solid var(--border)",
      }}
    >
      {type.replace(/_/g, " ")}
    </span>
  );
}

/* ── StatusBadge ──────────────────────────────────────────────────── */
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  clean: {
    background: "rgba(34,197,94,0.12)",
    color: "#4ade80",
    border: "1px solid rgba(34,197,94,0.25)",
  },
  conflicts_found: {
    background: "var(--c-high-bg)",
    color: "var(--c-high)",
    border: "1px solid rgba(249,115,22,0.25)",
  },
  critical_conflicts_found: {
    background: "var(--c-critical-bg)",
    color: "var(--c-critical)",
    border: "1px solid rgba(239,68,68,0.25)",
  },
  invalid_configuration: {
    background: "var(--c-critical-bg)",
    color: "var(--c-critical)",
    border: "1px solid rgba(239,68,68,0.25)",
  },
};

const STATUS_LABEL: Record<string, string> = {
  clean: "✓ Clean",
  conflicts_found: "Conflicts Found",
  critical_conflicts_found: "Critical",
  invalid_configuration: "Invalid",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center rounded text-xs font-semibold", className)}
      style={{
        padding: "2px 7px",
        ...(STATUS_STYLE[status] ?? {
          background: "var(--bg-surface-3)",
          color: "var(--text-secondary)",
        }),
      }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
