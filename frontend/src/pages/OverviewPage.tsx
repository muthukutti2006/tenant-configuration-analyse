import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AggregatedStats, AnalysisResult } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/Badge";
import { statusLabel, statusColor } from "../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AlertTriangle, CheckCircle, Users, FileSearch, Shield } from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#3b82f6",
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewPage() {
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .analyzeAll()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 animate-pulse">Loading analysis…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
        <strong>Error:</strong> {error}
        <p className="mt-1 text-xs text-red-500">Is the backend running? <code>uvicorn main:app --reload</code></p>
      </div>
    );
  }

  const severityData = stats
    ? [
        { name: "Critical", value: stats.critical, color: "#ef4444" },
        { name: "High", value: stats.high, color: "#f97316" },
        { name: "Medium", value: stats.medium, color: "#eab308" },
        { name: "Low", value: stats.low, color: "#3b82f6" },
      ]
    : [];

  // Conflict type breakdown
  const typeData: { name: string; value: number }[] = [];
  if (stats) {
    stats.results.forEach((r) => {
      if (!r.summary) return;
      Object.entries(r.summary.conflict_types ?? {}).forEach(([type, count]) => {
        const existing = typeData.find((d) => d.name === type.replace(/_/g, " "));
        if (existing) existing.value += count;
        else typeData.push({ name: type.replace(/_/g, " "), value: count });
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Aggregated configuration analysis across all university tenants
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tenants Analyzed"
          value={stats?.total_tenants ?? 0}
          icon={Users}
          color="bg-indigo-500"
        />
        <StatCard
          label="Rules Analyzed"
          value={stats?.total_rules_analyzed ?? 0}
          icon={FileSearch}
          color="bg-slate-600"
        />
        <StatCard
          label="Total Conflicts"
          value={stats?.total_conflicts ?? 0}
          icon={AlertTriangle}
          color="bg-orange-500"
        />
        <StatCard
          label="Critical"
          value={stats?.critical ?? 0}
          icon={Shield}
          color="bg-red-500"
        />
      </div>

      {/* Severity breakdown row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-1">High</p>
            <p className="text-xl font-bold text-orange-600">{stats?.high ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-1">Medium</p>
            <p className="text-xl font-bold text-yellow-600">{stats?.medium ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-1">Low</p>
            <p className="text-xl font-bold text-blue-600">{stats?.low ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Conflicts by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={severityData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Type Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Conflicts by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Analysis Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Tenant</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Version</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Rules</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Conflicts</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-red-500 uppercase tracking-wide">Critical</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-orange-500 uppercase tracking-wide">High</th>
                </tr>
              </thead>
              <tbody>
                {stats?.results.map((r: AnalysisResult) => (
                  <tr key={r.tenant_id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{r.tenant_name}</p>
                      <p className="text-xs text-slate-400">{r.tenant_id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{r.version}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{r.normalized_rules_count}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{r.summary?.total_conflicts ?? 0}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{r.summary?.critical ?? 0}</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600">{r.summary?.high ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
