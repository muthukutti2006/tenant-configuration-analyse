import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Conflict, Severity, ConflictType } from "../types";
import { ConflictCard } from "../components/conflicts/ConflictCard";
import { Card, CardContent } from "../components/ui/Card";
import { Search } from "lucide-react";

const SEVERITY_OPTIONS: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const TYPE_OPTIONS: ConflictType[] = [
  "DIRECT_RULE_CONFLICT",
  "FEATURE_FLAG_CONFLICT",
  "DEPENDENCY_CONFLICT",
  "DUPLICATE_OR_CONTRADICTORY_RULE",
  "INVALID_CONFIGURATION",
];

export function ConflictsPage() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<Severity | "ALL">("ALL");
  const [filterType, setFilterType] = useState<ConflictType | "ALL">("ALL");

  useEffect(() => {
    api
      .listConflicts()
      .then((d) => setConflicts(d.conflicts))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = conflicts.filter((c) => {
    if (filterSeverity !== "ALL" && c.severity !== filterSeverity) return false;
    if (filterType !== "ALL" && c.conflict_type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tenant_name?.toLowerCase().includes(q) ||
        c.tenant_id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.severity] - order[b.severity];
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 animate-pulse">
        Loading conflicts…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Conflicts</h1>
        <p className="text-sm text-slate-500 mt-1">
          {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""} detected across all tenant configurations
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search conflicts, tenants…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Severity filter */}
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as Severity | "ALL")}
          className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="ALL">All Severities</option>
          {SEVERITY_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ConflictType | "ALL")}
          className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="ALL">All Types</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Result count */}
      {(search || filterSeverity !== "ALL" || filterType !== "ALL") && (
        <p className="text-sm text-slate-500">
          Showing {sorted.length} of {conflicts.length} conflicts
        </p>
      )}

      {/* Conflicts list */}
      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32 text-slate-400">
            <p className="text-sm">No conflicts match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => (
            <ConflictCard key={c.id} conflict={c} defaultExpanded={false} />
          ))}
        </div>
      )}
    </div>
  );
}
