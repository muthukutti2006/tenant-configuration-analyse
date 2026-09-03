import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { TenantConfig, AnalysisResult } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/Badge";
import { ConflictCard } from "../components/conflicts/ConflictCard";
import { Play } from "lucide-react";

export function ConfigurationsPage() {
  const [configs, setConfigs] = useState<TenantConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TenantConfig | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysing, setAnalysing] = useState(false);

  useEffect(() => {
    api
      .listConfigurations()
      .then((d) => setConfigs(d.configurations))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (c: TenantConfig) => {
    setSelected(c);
    setResult(null);
    setAnalysing(true);
    try {
      const res = await api.analyze(c as unknown as Record<string, unknown>);
      setResult(res);
    } finally {
      setAnalysing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Test Configurations</h1>
        <p className="text-sm text-slate-500 mt-1">
          8 realistic tenant configurations covering all conflict scenarios
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config list */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Configurations ({configs.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <p className="px-4 py-3 text-sm text-slate-400 animate-pulse">Loading…</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {configs.map((c) => (
                    <li key={c.tenant_id}>
                      <button
                        onClick={() => handleSelect(c)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                          selected?.tenant_id === c.tenant_id ? "bg-indigo-50" : ""
                        }`}
                      >
                        <p className="text-sm font-medium text-slate-900">{c.tenant_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{c.tenant_id}</p>
                        {c.metadata?.scenario ? (
                            <span className="inline-block text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1">
                              {String(c.metadata.scenario)}
                            </span>
                          ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2 space-y-4">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
              <Play size={28} className="mb-2 opacity-40" />
              <p className="text-sm">Click a configuration to view and analyse it</p>
            </div>
          ) : (
            <>
              {/* Config JSON */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{selected.tenant_name}</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">{selected.tenant_id} · v{selected.version}</p>
                  </div>
                  {result && <StatusBadge status={result.status} />}
                </CardHeader>
                <CardContent>
                  {selected.metadata?.description ? (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800">
                      <strong>Scenario:</strong> {String(selected.metadata.description)}
                    </div>
                  ) : null}
                  <pre className="text-xs font-mono text-slate-700 bg-slate-50 rounded p-3 overflow-auto max-h-72">
                    {JSON.stringify(selected, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {/* Analysis result */}
              {analysing && (
                <p className="text-sm text-slate-500 animate-pulse px-1">Running analysis…</p>
              )}
              {result && !analysing && (
                <>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-5 gap-3 text-center">
                        <div>
                          <p className="text-lg font-bold">{result.normalized_rules_count}</p>
                          <p className="text-xs text-slate-500">Rules</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{result.summary.total_conflicts}</p>
                          <p className="text-xs text-slate-500">Conflicts</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-red-600">{result.summary.critical}</p>
                          <p className="text-xs text-slate-500">Critical</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-orange-600">{result.summary.high}</p>
                          <p className="text-xs text-slate-500">High</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-yellow-600">{result.summary.medium}</p>
                          <p className="text-xs text-slate-500">Medium</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {result.conflicts.length === 0 ? (
                    <div className="flex items-center justify-center h-20 bg-green-50 rounded-lg border border-green-200 text-green-700 text-sm font-medium">
                      ✓ No conflicts detected
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {result.conflicts
                        .sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[a.severity] - { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[b.severity]))
                        .map((c) => (
                          <ConflictCard
                            key={c.id}
                            conflict={c}
                            defaultExpanded={c.severity === "CRITICAL" || c.severity === "HIGH"}
                          />
                        ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
