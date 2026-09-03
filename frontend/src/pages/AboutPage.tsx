import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

export function AboutPage() {
  const completedItems = [
    "Configuration parser (JSON input, edge case handling)",
    "Configuration validator (type/range checks)",
    "Rule normalizer (canonical key-value pairs)",
    "Conflict detection engine (5 conflict categories, 10 rules)",
    "Severity classifier (documented CRITICAL/HIGH/MEDIUM/LOW policy)",
    "Evidence generator (field-level structured evidence for HIGH/CRITICAL)",
    "FastAPI backend with 7 REST endpoints",
    "React + TypeScript + Tailwind frontend dashboard",
    "8 realistic test tenant configurations",
    "35+ automated pytest tests",
    "6 edge/failure cases tested",
    "Architecture documentation",
    "Technical approach comparison (Rule-Based vs ML/Anomaly)",
    "User flow documentation",
    "Conflict rules documentation",
  ];

  const futureItems = [
    "Complete audit trail with immutable event log",
    "Change approval workflow (propose → review → approve/reject)",
    "Rollback path for high-impact configuration changes",
    "Upgrade history analysis",
    "False-positive / false-negative experiment with labeled data",
    "Stakeholder validation study",
    "Full performance benchmarking (large tenant sets)",
    "Deployment checklist",
    "Production deployment (containerisation, CI/CD)",
    "ML/Anomaly detection parallel module (future experimental channel)",
    "Measurable defect-reduction experiment across upgrade cycles",
  ];

  const endpoints = [
    { method: "GET", path: "/api/health", description: "Service health check" },
    { method: "POST", path: "/api/analyze", description: "Analyse a single tenant configuration" },
    { method: "GET", path: "/api/analyze-all", description: "Analyse all bundled test configurations" },
    { method: "GET", path: "/api/configurations", description: "List all test tenant configurations" },
    { method: "GET", path: "/api/configurations/{id}", description: "Get a specific tenant configuration" },
    { method: "GET", path: "/api/conflicts", description: "List all conflicts across all tenants" },
    { method: "GET", path: "/api/conflicts/{id}", description: "Get a specific conflict with evidence" },
    { method: "GET", path: "/api/rules", description: "List all documented detection rules" },
  ];

  const methodColor: Record<string, string> = {
    GET: "bg-green-100 text-green-700",
    POST: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Documentation & About</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review-1 Prototype — Tenant-Configuration Analyser
        </p>
      </div>

      {/* Project Description */}
      <Card>
        <CardHeader><CardTitle>Project Overview</CardTitle></CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-3">
          <p>
            The <strong>Tenant-Configuration Analyser</strong> detects conflicting rules in tenant-specific
            configuration files for a University Student-Services Portal before deployment. It supports
            four portal modules: Admissions, Fees, Attendance, and Certificates.
          </p>
          <p>
            Different university tenants can independently configure each module. Without automated checking,
            conflicting rules can cause incorrect business behavior, failed student-service workflows,
            and difficult software upgrades.
          </p>
          <p>
            This system uses <strong>Rule-Based Conflict Detection</strong> to provide deterministic,
            explainable, auditable results with field-level evidence for every HIGH or CRITICAL conflict.
          </p>
        </CardContent>
      </Card>

      {/* Architecture */}
      <Card>
        <CardHeader><CardTitle>System Architecture</CardTitle></CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-3">
          <pre className="bg-slate-50 rounded p-4 text-xs font-mono text-slate-700 overflow-auto">{`User
 ↓
React Dashboard (Vite + TypeScript + Tailwind)
 ↓ HTTP POST /api/analyze
FastAPI Application (Python)
 ↓
Configuration Parser          — parse JSON, handle edge cases
 ↓
Configuration Validator       — field types, ranges, required fields
 ↓
Rule Normalizer               — flatten to canonical (path, value) pairs
 ↓
Conflict Detection Engine     — 5 detector functions, 10 rules
 ↓
Severity Classifier           — CRITICAL / HIGH / MEDIUM / LOW
 ↓
Evidence Generator            — structured field-level evidence
 ↓
Analysis Result (JSON)
 ↓
Dashboard (conflicts, evidence, charts)`}</pre>

          <div className="mt-3 space-y-1">
            <p><strong>Future extension points (designed but not built):</strong></p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Audit Trail Module — append-only event log per tenant action</li>
              <li>Change Approval Workflow — propose/review/approve pipeline</li>
              <li>Rollback Module — store/restore prior approved configurations</li>
              <li>ML Anomaly Detection Channel — parallel experimental engine</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Review-1 Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>✓ Completed (Review-1)</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {completedItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>○ Future Work</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {futureItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-500">
                  <span className="text-slate-300 mt-0.5 flex-shrink-0">○</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* API Endpoints */}
      <Card>
        <CardHeader><CardTitle>API Endpoints</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase">Method</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase">Path</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((e) => (
                <tr key={e.path} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${methodColor[e.method]}`}>
                      {e.method}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-indigo-700">{e.path}</td>
                  <td className="px-4 py-2.5 text-slate-600">{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* How to run */}
      <Card>
        <CardHeader><CardTitle>How to Run Locally</CardTitle></CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-4">
          <div>
            <p className="font-semibold mb-1">Backend</p>
            <pre className="bg-slate-50 rounded p-3 text-xs font-mono text-slate-700">{`cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000`}</pre>
          </div>
          <div>
            <p className="font-semibold mb-1">Frontend</p>
            <pre className="bg-slate-50 rounded p-3 text-xs font-mono text-slate-700">{`cd frontend
npm install
npm run dev`}</pre>
          </div>
          <div>
            <p className="font-semibold mb-1">Tests</p>
            <pre className="bg-slate-50 rounded p-3 text-xs font-mono text-slate-700">{`cd backend
pytest tests/ -v`}</pre>
          </div>
          <p className="text-xs text-slate-500">
            Frontend runs at <code>http://localhost:5173</code>. Backend runs at <code>http://localhost:8000</code>.
            API docs available at <code>http://localhost:8000/docs</code>.
          </p>
        </CardContent>
      </Card>

      {/* Baseline */}
      <Card>
        <CardHeader><CardTitle>Baseline Comparison</CardTitle></CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded p-3 bg-slate-50">
              <p className="font-semibold text-slate-800 mb-2">Baseline: Manual Inspection</p>
              <ol className="space-y-1 text-slate-600">
                <li>1. Receive configuration file</li>
                <li>2. Manually read each field</li>
                <li>3. Mentally check against known rules</li>
                <li>4. Write conflict notes</li>
                <li>5. Share notes with team</li>
              </ol>
              <p className="mt-2 text-xs text-slate-500">Time: 30–60 min per tenant · Error-prone · Not auditable</p>
            </div>
            <div className="border border-indigo-200 rounded p-3 bg-indigo-50">
              <p className="font-semibold text-indigo-800 mb-2">Proposed: Automated Analyser</p>
              <ol className="space-y-1 text-slate-700">
                <li>1. Submit configuration via UI or API</li>
                <li>2. Parser validates structure</li>
                <li>3. Engine runs 10 detection rules</li>
                <li>4. Results returned with evidence</li>
                <li>5. Dashboard shows results instantly</li>
              </ol>
              <p className="mt-2 text-xs text-indigo-600">Time: &lt;1 second · Deterministic · Full evidence trail</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            <strong>Note:</strong> A measurable defect-reduction experiment comparing baseline vs automated
            detection across upgrade cycles is planned for a future review phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
