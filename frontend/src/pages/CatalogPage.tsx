import React, { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import type { CatalogRule } from "../types";
import { SectionHeader, ErrorState, EmptyState, FilterBar, SearchInput, SelectFilter } from "../components/ui/Shared";
import { MetricCard } from "../components/ui/MetricCard";
import { ChevronDown, ChevronRight, ListChecks, ShieldAlert, ToggleRight } from "lucide-react";

const SEVERITY_STYLE: Record<string, React.CSSProperties> = {
  CRITICAL: { background: "var(--c-critical-bg)", color: "var(--c-critical)", border: "1px solid rgba(239,68,68,0.3)" },
  HIGH:     { background: "var(--c-high-bg)",     color: "var(--c-high)",     border: "1px solid rgba(249,115,22,0.3)" },
  MEDIUM:   { background: "var(--c-medium-bg)",   color: "var(--c-medium)",   border: "1px solid rgba(234,179,8,0.3)" },
  LOW:      { background: "var(--c-low-bg)",       color: "var(--c-low)",     border: "1px solid rgba(59,130,246,0.3)" },
};

const TYPE_STYLE: Record<string, React.CSSProperties> = {
  conflict:   { background: "rgba(139,92,246,0.12)", color: "#a78bfa" },
  drift:      { background: "rgba(99,102,241,0.12)", color: "var(--accent)" },
  validation: { background: "var(--bg-surface-3)",   color: "var(--text-muted)" },
};

function RuleRow({ rule }: { rule: CatalogRule }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "7px",
        overflow: "hidden",
        marginBottom: "6px",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textAlign: "left",
        }}
      >
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <code style={{ fontSize: "10px", padding: "2px 6px", background: "var(--bg-surface-3)", color: "var(--accent)", borderRadius: "4px", fontFamily: "monospace", flexShrink: 0 }}>
          {rule.rule_id}
        </code>
        <span
          style={{
            fontSize: "10px",
            padding: "2px 6px",
            borderRadius: "4px",
            fontFamily: "monospace",
            flexShrink: 0,
            ...(TYPE_STYLE[rule.rule_type] ?? {}),
          }}
        >
          {rule.rule_type.toUpperCase()}
        </span>
        <span
          style={{
            fontSize: "10px",
            padding: "2px 6px",
            borderRadius: "4px",
            fontFamily: "monospace",
            flexShrink: 0,
            ...(SEVERITY_STYLE[rule.severity] ?? {}),
          }}
        >
          {rule.severity}
        </span>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {rule.name}
        </span>
        <span
          style={{
            fontSize: "10px",
            padding: "2px 8px",
            borderRadius: "12px",
            fontWeight: 600,
            flexShrink: 0,
            background: rule.enabled ? "rgba(34,197,94,0.12)" : "var(--bg-surface-3)",
            color: rule.enabled ? "var(--green)" : "var(--text-muted)",
            border: rule.enabled ? "1px solid rgba(34,197,94,0.25)" : "1px solid var(--border)",
          }}
        >
          {rule.enabled ? "Enabled" : "Disabled"}
        </span>
      </button>

      {open && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            background: "var(--bg-surface-2)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Description</div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{rule.description}</p>
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Condition</div>
              <code style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace", lineHeight: 1.5 }}>{rule.condition}</code>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Evidence Template</div>
            <div style={{ padding: "8px 12px", background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "6px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {rule.evidence_template}
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "var(--text-muted)" }}>
            <span>Category: <strong style={{ color: "var(--text-secondary)" }}>{rule.category}</strong></span>
            <span>Type: <strong style={{ color: "var(--text-secondary)" }}>{rule.rule_type}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

export function CatalogPage() {
  const [rules, setRules] = useState<CatalogRule[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [filterEnabled, setFilterEnabled] = useState<"ALL" | "true" | "false">("ALL");

  useEffect(() => {
    api
      .getCatalog()
      .then((d) => { setRules(d.rules); setCategories(d.categories); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load catalogue."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return rules.filter((r) => {
      if (filterCategory !== "ALL" && r.category !== filterCategory) return false;
      if (filterSeverity !== "ALL" && r.severity !== filterSeverity) return false;
      if (filterEnabled !== "ALL" && String(r.enabled) !== filterEnabled) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.description.toLowerCase().includes(q) &&
          !r.rule_id.toLowerCase().includes(q) &&
          !r.condition.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [rules, filterCategory, filterSeverity, filterEnabled, search]);

  const enabledCount = rules.filter((r) => r.enabled).length;
  const critCount = rules.filter((r) => r.severity === "CRITICAL").length;

  const categoryOptions = [{ value: "ALL", label: "All Categories" }, ...categories.map((c) => ({ value: c, label: c }))];
  const severityOptions = [{ value: "ALL", label: "All Severities" }, ...["CRITICAL","HIGH","MEDIUM","LOW"].map((s) => ({ value: s, label: s }))];
  const enabledOptions = [{ value: "ALL", label: "All" }, { value: "true", label: "Enabled" }, { value: "false", label: "Disabled" }];

  if (loading) {
    return (
      <div>
        <SectionHeader title="Rules Catalogue" subtitle="Loading policy rules…" />
        {[0,1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: "50px", borderRadius: "7px", marginBottom: "6px" }} />)}
      </div>
    );
  }

  if (error) return <ErrorState message={error} />;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <SectionHeader
        title="Rules Catalogue"
        subtitle="Machine-readable policy rules powering the conflict and drift detection engines."
        badge={`${rules.length} rules`}
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
        <MetricCard label="Total Rules" value={rules.length} icon={ListChecks} accent="var(--accent)" />
        <MetricCard label="Enabled" value={enabledCount} icon={ToggleRight} accent="var(--green)" />
        <MetricCard label="Categories" value={categories.length} icon={ShieldAlert} accent="#8b5cf6" />
        <MetricCard label="Critical Rules" value={critCount} icon={ShieldAlert} accent="var(--c-critical)" />
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search rules, conditions…" />
        <SelectFilter value={filterCategory} onChange={setFilterCategory} options={categoryOptions} />
        <SelectFilter value={filterSeverity} onChange={setFilterSeverity} options={severityOptions} />
        <SelectFilter value={filterEnabled} onChange={(v) => setFilterEnabled(v as "ALL" | "true" | "false")} options={enabledOptions} />
        {filtered.length !== rules.length && (
          <span style={{ fontSize: "12px", color: "var(--text-muted)", alignSelf: "center" }}>
            {filtered.length} of {rules.length} shown
          </span>
        )}
      </FilterBar>

      {/* Rules list */}
      {filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title="No rules match your filters" />
      ) : (
        <div>
          {filtered.map((r) => (
            <RuleRow key={r.rule_id} rule={r} />
          ))}
        </div>
      )}
    </div>
  );
}
