import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Severity, ConflictType } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function severityColor(severity: Severity) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-100 text-red-800 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "LOW":
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
}

export function severityDot(severity: Severity) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-500";
    case "HIGH":
      return "bg-orange-500";
    case "MEDIUM":
      return "bg-yellow-500";
    case "LOW":
      return "bg-blue-500";
  }
}

export function conflictTypeLabel(type: ConflictType): string {
  switch (type) {
    case "DIRECT_RULE_CONFLICT":
      return "Direct Rule Conflict";
    case "FEATURE_FLAG_CONFLICT":
      return "Feature Flag Conflict";
    case "DEPENDENCY_CONFLICT":
      return "Dependency Conflict";
    case "DUPLICATE_OR_CONTRADICTORY_RULE":
      return "Duplicate / Contradictory Rule";
    case "INVALID_CONFIGURATION":
      return "Invalid Configuration";
  }
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
