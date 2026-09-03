import React from "react";
import { cn } from "../../lib/utils";
import type { Severity } from "../../types";
import { severityColor } from "../../lib/utils";

interface BadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({ severity, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        severityColor(severity),
        className
      )}
    >
      {severity}
    </span>
  );
}

interface ConflictTypeBadgeProps {
  type: string;
  className?: string;
}

export function ConflictTypeBadge({ type, className }: ConflictTypeBadgeProps) {
  const label = type.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200",
        className
      )}
    >
      {label}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorMap: Record<string, string> = {
    clean: "bg-green-100 text-green-800 border-green-200",
    conflicts_found: "bg-orange-100 text-orange-800 border-orange-200",
    critical_conflicts_found: "bg-red-100 text-red-800 border-red-200",
    invalid_configuration: "bg-red-100 text-red-800 border-red-200",
  };
  const labelMap: Record<string, string> = {
    clean: "✓ Clean",
    conflicts_found: "Conflicts Found",
    critical_conflicts_found: "Critical",
    invalid_configuration: "Invalid",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        colorMap[status] ?? "bg-gray-100 text-gray-700",
        className
      )}
    >
      {labelMap[status] ?? status}
    </span>
  );
}
