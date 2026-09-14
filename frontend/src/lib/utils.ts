import React from "react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Severity, ConflictType } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function severityColor(severity: Severity) {
  switch (severity) {
    case "CRITICAL": return "bg-red-100 text-red-800 border-red-200";
    case "HIGH":     return "bg-orange-100 text-orange-800 border-orange-200";
    case "MEDIUM":   return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "LOW":      return "bg-blue-100 text-blue-800 border-blue-200";
  }
}

export function severityDot(severity: Severity) {
  switch (severity) {
    case "CRITICAL": return "bg-red-500";
    case "HIGH":     return "bg-orange-500";
    case "MEDIUM":   return "bg-yellow-500";
    case "LOW":      return "bg-blue-500";
  }
}

export function severityAccent(severity: string): string {
  switch (severity) {
    case "CRITICAL": return "var(--c-critical)";
    case "HIGH":     return "var(--c-high)";
    case "MEDIUM":   return "var(--c-medium)";
    case "LOW":      return "var(--c-low)";
    default:         return "var(--accent)";
  }
}

/** Short labels — for chart axes and compact badges where space is limited */
export const CONFLICT_TYPE_SHORT: Record<string, string> = {
  DIRECT_RULE_CONFLICT:             "Direct Conflict",
  FEATURE_FLAG_CONFLICT:            "Feature Flag",
  DEPENDENCY_CONFLICT:              "Dependency",
  DUPLICATE_OR_CONTRADICTORY_RULE:  "Duplicate Rule",
  INVALID_CONFIGURATION:            "Invalid Config",
};

/** Full labels — for detailed views, tables, tooltips */
export const CONFLICT_TYPE_LABEL: Record<string, string> = {
  DIRECT_RULE_CONFLICT:             "Direct Contradiction",
  FEATURE_FLAG_CONFLICT:            "Feature Flag Mismatch",
  DEPENDENCY_CONFLICT:              "Dependency Conflict",
  DUPLICATE_OR_CONTRADICTORY_RULE:  "Duplicate Inconsistency",
  INVALID_CONFIGURATION:            "Invalid Configuration",
};

export function conflictTypeLabel(type: string): string {
  return CONFLICT_TYPE_LABEL[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function conflictTypeShort(type: string): string {
  return CONFLICT_TYPE_SHORT[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusColor(status: string) {
  if (status === "clean") return "text-green-600";
  if (status === "critical_conflicts_found") return "text-red-600";
  return "text-orange-600";
}

export function statusLabel(status: string) {
  if (status === "clean") return "✓ Clean";
  if (status === "critical_conflicts_found") return "⚠ Critical Conflicts";
  if (status === "conflicts_found") return "⚠ Conflicts Found";
  if (status === "invalid_configuration") return "✗ Invalid Config";
  return status;
}

export function driftTypeStyle(type: string): React.CSSProperties {
  switch (type) {
    case "ADDED":   return { background: "rgba(34,197,94,0.12)",  color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" };
    case "REMOVED": return { background: "var(--c-critical-bg)",  color: "var(--c-critical)", border: "1px solid rgba(239,68,68,0.2)" };
    case "CHANGED": return { background: "var(--c-medium-bg)",    color: "var(--c-medium)", border: "1px solid rgba(234,179,8,0.2)" };
    default:        return { background: "var(--bg-surface-3)",   color: "var(--text-muted)" };
  }
}

// Health score calculation (CONFIQRA formula — documented)
// Score = 100 − (critical×20 + high×8 + medium×3 + low×1), clamped [0,100]
export function calcHealthScore(critical: number, high: number, medium: number, low: number): number {
  const penalty = critical * 20 + high * 8 + medium * 3 + low * 1;
  return Math.max(0, Math.min(100, 100 - penalty));
}
