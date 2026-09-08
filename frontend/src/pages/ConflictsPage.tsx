import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Conflict, Severity, ConflictType } from "../types";
import { ConflictCard } from "../components/conflicts/ConflictCard";
import { SectionHeader, ErrorState, FilterBar, SearchInput, SelectFilter, EmptyState } from "../components/ui/Shared";
import { MetricCard } from "../components/ui/MetricCard";
import { AlertTriangle, Shield, AlertOctagon, Info } from "lucide-react";

const SEVERITY_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "All Severities" },
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "DIRECT_RULE_CONFLICT", label: "Direct Rule Conflict" },
  { value: "FEATURE_FLAG_CONFLICT", label: "Feature Flag Conflict" },
  { value: "DEPENDENCY_CONFLICT", label: "Dependency Conflict" },
  { value: "DUPLICATE_OR_CONTRADICTORY_RULE", label: "Duplicate / Contradictory" },
  { value: "INVALID_CONFIGURATION", label: "Invalid Configuration" },
];

export function ConflictsPage() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    api
      .listConflicts()
      .then((d) => setConflicts(d.conflicts))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = conflicts
    .filter((c) => {
      if (filterSeverity !== "ALL" && c.severity !== filterSeverity) return false;
      if (filterType !== "ALL" && c.conflict_type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.tenant_name?.toLowerCase().includes(q) ?? false) ||
          (c.tenant_id?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    });

  const critCount = conflicts.filter((c) => c.severity === "CRITICAL").length;
  const highCount = conflicts.filter((c) => c.severity === "HIGH").length;
  const medCount  = conflicts.filter((c) => c.severity === "MEDIUM").length;
  const lowCount  = conflicts.filter((c) => c.severity === "LOW").length;

  if (loading) {
    return (
      <div>
        <SectionHeader title="All Conflicts" subtitle="Loading conflict intelligence…" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "10px" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error} />;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <SectionHeader
        title="All Conflicts"
        subtitle={`${conflicts.length} conflict${conflicts.length !== 1 ? "s" : ""} detected across all tenant configurations`}
      />

      {/* Severity summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
        <MetricCard label="Critical" value={critCount} icon={Shield} accent="var(--c-critical)" />
        <MetricCard label="High" value={highCount} icon={AlertOctagon} accent="var(--c-high)" />
        <MetricCard label="Medium" value={medCount} icon={AlertTriangle} accent="var(--c-medium)" />
        <MetricCard label="Low" value={lowCount} icon={Info} accent="var(--c-low)" />
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search conflicts, tenants…" />
        <SelectFilter value={filterSeverity} onChange={setFilterSeverity} options={SEVERITY_OPTIONS} />
        <SelectFilter value={filterType} onChange={setFilterType} options={TYPE_OPTIONS} />
        {(search || filterSeverity !== "ALL" || filterType !== "ALL") && (
          <span style={{ fontSize: "12px", color: "var(--text-muted)", alignSelf: "center" }}>
            {filtered.length} of {conflicts.length} shown
          </span>
        )}
      </FilterBar>

      {/* Conflict list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No conflicts match your filters"
          description="Adjust the search or filters above to see results."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((c) => (
            <ConflictCard key={c.id} conflict={c} defaultExpanded={false} />
          ))}
        </div>
      )}
    </div>
  );
}
