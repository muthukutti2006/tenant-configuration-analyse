import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { ConflictRule } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { SeverityBadge } from "../components/ui/Badge";
import { ConflictTypeBadge } from "../components/ui/Badge";

export function RulesPage() {
  const [rules, setRules] = useState<ConflictRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listRules().then((d) => setRules(d.rules)).finally(() => setLoading(false));
  }, []);

  const severityPolicy = [
    {
      level: "CRITICAL" as const,
      definition: "Configuration causes major incorrect business behavior or deployment failure.",
      examples: ["fees module disabled but fee clearance required", "attendance disabled but attendance clearance required"],
    },
    {
      level: "HIGH" as const,
      definition: "Conflicting rules affect important student-service decisions.",
      examples: ["online payment disabled but required before admission", "attendance threshold mismatch affecting exam eligibility"],
    },
    {
      level: "MEDIUM" as const,
      definition: "Potential inconsistent behavior with limited operational impact.",
      examples: ["grace period configured without late fee", "digital certificate flag vs signature requirement"],
    },
    {
      level: "LOW" as const,
      definition: "Minor configuration inconsistency or advisory warning.",
      examples: ["duplicate attendance threshold fields"],
    },
  ];

  const colorMap = {
    CRITICAL: "border-red-200 bg-red-50",
    HIGH: "border-orange-200 bg-orange-50",
    MEDIUM: "border-yellow-200 bg-yellow-50",
    LOW: "border-blue-200 bg-blue-50",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Detection Rules</h1>
        <p className="text-sm text-slate-500 mt-1">
          All conflict detection rules and the severity classification policy
        </p>
      </div>

      {/* Severity Policy */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Severity Classification Policy</h2>
        <p className="text-sm text-slate-600">
          Severity is assigned deterministically based on documented rules — not arbitrary scores.
          Every classification has a stated rationale.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {severityPolicy.map((p) => (
            <div key={p.level} className={`rounded-lg border p-4 ${colorMap[p.level]}`}>
              <div className="flex items-center gap-2 mb-2">
                <SeverityBadge severity={p.level} />
              </div>
              <p className="text-sm text-slate-700 mb-2">{p.definition}</p>
              <ul className="space-y-1">
                {p.examples.map((ex) => (
                  <li key={ex} className="text-xs text-slate-600 flex items-start gap-1">
                    <span className="text-slate-400 mt-0.5">•</span>
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Rules Table */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Conflict Detection Rules</h2>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <p className="px-4 py-3 text-sm text-slate-400 animate-pulse">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">ID</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Description</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                        <td className="px-4 py-3">
                          <ConflictTypeBadge type={r.type} />
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{r.description}</td>
                        <td className="px-4 py-3">
                          <SeverityBadge severity={r.default_severity} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
