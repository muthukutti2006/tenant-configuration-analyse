import React, { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import type { CatalogRule } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Search, RefreshCw } from "lucide-react";

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border border-red-200",
  HIGH:     "bg-orange-100 text-orange-700 border border-orange-200",
  MEDIUM:   "bg-yellow-100 text-yellow-700 border border-yellow-200",
  LOW:      "bg-blue-100 text-blue-700 border border-blue-200",
};

const TYPE_BADGE: Record<string, string> = {
  conflict:   "bg-purple-100 text-purple-700",
  drift:      "bg-indigo-100 text-indigo-700",
  validation: "bg-slate-100 text-slate-600",
};

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
    api.getCatalog()
      .then((d) => {
        setRules(d.rules);
        setCategories(d.categories);
      })
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

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    rules.forEach((r) => { c[r.category] = (c[r.category] ?? 0) + 1; });
    return c;
  }, [rules]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rules Catalogue</h1>
        <p className="text-sm text-slate-500 mt-1">
          Machine-readable catalogue of all conflict detection, drift detection, and validation rules. Filter by category, severity, or type.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["conflict", "drift", "validation"].map((type) => {
          const count = rules.filter((r) => r.rule_type === type).length;
          return (
            <div key={type} className="bg-white border border-slate-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500 capitalize">{type} rules</p>
            </div>
          );
        })}
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{rules.length}</p>
          <p className="text-xs text-slate-500">Total rules</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search rules…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c} ({counts[c] ?? 0})</option>
              ))}
            </select>

            {/* Severity filter */}
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="ALL">All Severities</option>
              {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Enabled filter */}
            <select
              value={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.value as "ALL" | "true" | "false")}
              className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="ALL">All Status</option>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>

            {(search || filterCategory !== "ALL" || filterSeverity !== "ALL" || filterEnabled !== "ALL") && (
              <button
                onClick={() => { setSearch(""); setFilterCategory("ALL"); setFilterSeverity("ALL"); setFilterEnabled("ALL"); }}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Clear filters
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Showing {filtered.length} of {rules.length} rules
          </p>
        </CardContent>
      </Card>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center h-32 gap-2 text-slate-400">
          <RefreshCw size={18} className="animate-spin" />
          <span className="text-sm">Loading catalogue…</span>
        </div>
      )}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 w-20">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 w-28">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Name &amp; Description</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 w-24">Severity</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 w-24">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 w-20">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                        No rules match your filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((rule) => (
                      <tr key={rule.rule_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <code className="text-xs font-mono font-bold text-indigo-600">{rule.rule_id}</code>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-600">{rule.category}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{rule.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>
                          <code className="text-xs text-slate-400 font-mono mt-1 block">{rule.condition}</code>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${SEVERITY_BADGE[rule.severity] ?? "bg-slate-100 text-slate-600"}`}>
                            {rule.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded capitalize ${TYPE_BADGE[rule.rule_type] ?? "bg-slate-100 text-slate-600"}`}>
                            {rule.rule_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded ${rule.enabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                            {rule.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
