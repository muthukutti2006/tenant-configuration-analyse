import React from "react";
import { SectionHeader } from "../components/ui/Shared";
import { CheckCircle2, Circle, BookOpen } from "lucide-react";

const COMPLETED = [
  "Configuration parser (JSON input, edge case handling)",
  "Configuration validator (type/range checks)",
  "Rule normalizer (canonical key-value pairs)",
  "Conflict detection engine (5 conflict types)",
  "18-rule machine-readable catalogue (12 conflict + 6 drift rules across 6 categories)",
  "Severity classifier (CRITICAL/HIGH/MEDIUM/LOW policy)",
  "Evidence generator (field-level structured evidence)",
  "FastAPI backend with 16 REST endpoints",
  "React + TypeScript + Tailwind v4 frontend dashboard",
  "8 realistic test tenant configurations",
  "97 automated pytest tests (43 original + 50 drift + 4 regression)",
  "Versioned Baseline Store (3 tenants, 4 baselines)",
  "Configuration Drift Detection engine",
  "Synthetic before/after validation experiment",
  "Architecture + testing + drift documentation",
  "CI/CD pipeline (GitHub Actions)",
];

const FUTURE = [
  "Complete audit trail with immutable event log",
  "Change approval workflow (propose → review → approve/reject)",
  "Rollback path for high-impact configuration changes",
  "False-positive / false-negative experiment with labeled data",
  "Stakeholder validation study",
  "Full performance benchmarking (large tenant sets)",
  "Production deployment (containerisation)",
  "ML/Anomaly detection parallel experimental channel",
  "Measurable defect-reduction experiment across upgrade cycles",
];

const ENDPOINTS = [
  { method: "GET",  path: "/api/health", description: "Service health check" },
  { method: "POST", path: "/api/analyze", description: "Analyse a single tenant configuration" },
  { method: "GET",  path: "/api/analyze-all", description: "Analyse all bundled test configurations" },
  { method: "GET",  path: "/api/configurations", description: "List all test tenant configurations" },
  { method: "GET",  path: "/api/configurations/{id}", description: "Get a specific tenant configuration" },
  { method: "GET",  path: "/api/conflicts", description: "List all conflicts across all tenants" },
  { method: "GET",  path: "/api/conflicts/{id}", description: "Get a specific conflict with evidence" },
  { method: "GET",  path: "/api/rules", description: "List all documented detection rules" },
  { method: "GET",  path: "/api/baselines", description: "List all baseline records" },
  { method: "GET",  path: "/api/baselines/{tenant_id}", description: "Get baselines for a tenant" },
  { method: "GET",  path: "/api/baselines/{tenant_id}/{version}", description: "Get specific baseline version" },
  { method: "POST", path: "/api/baselines/{tenant_id}/{version}/compare", description: "Compare config against baseline" },
  { method: "GET",  path: "/api/baselines/{tenant_id}/versions/compare", description: "Compare two baseline versions" },
  { method: "POST", path: "/api/drift", description: "Detect drift between two raw configurations" },
  { method: "GET",  path: "/api/catalog", description: "Get machine-readable rule catalogue" },
  { method: "GET",  path: "/api/experiment", description: "Get synthetic validation experiment results" },
];

const METHOD_STYLE: Record<string, React.CSSProperties> = {
  GET:  { background: "rgba(34,197,94,0.12)",  color: "var(--green)",     border: "1px solid rgba(34,197,94,0.25)" },
  POST: { background: "rgba(99,102,241,0.12)", color: "var(--accent)",    border: "1px solid rgba(99,102,241,0.25)" },
};

export function AboutPage() {
  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <SectionHeader
        title="Documentation"
        subtitle="CONFIQRA — Tenant Configuration Intelligence & Conflict Analysis Platform"
        badge="Review-2"
      />

      {/* Project overview */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderLeft: "3px solid var(--accent)",
          borderRadius: "10px",
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>Project Overview</div>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.7 }}>
          <strong style={{ color: "var(--text-primary)" }}>CONFIQRA</strong> detects conflicting rules in tenant-specific configuration files for a University Student-Services Portal before deployment. It supports four portal modules: Admissions, Fees, Attendance, and Certificates.
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.7 }}>
          Different university tenants can independently configure each module. Without automated checking, conflicting rules can cause incorrect business behavior, failed student-service workflows, and difficult software upgrades.
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.7 }}>
          This system uses <strong style={{ color: "var(--text-primary)" }}>Rule-Based Conflict Detection</strong> to provide deterministic, explainable, auditable results with field-level evidence for every HIGH or CRITICAL conflict.
        </p>
        <div
          style={{
            padding: "10px 14px",
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "var(--text-muted)",
            fontStyle: "italic",
          }}
        >
          "Detect configuration conflicts before they become deployment problems."
        </div>
      </div>

      {/* Status: completed vs future */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={14} style={{ color: "var(--green)" }} /> Completed (Review-2)
          </div>
          <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "7px" }}>
            {COMPLETED.map((item) => (
              <div key={item} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--text-secondary)", alignItems: "flex-start" }}>
                <CheckCircle2 size={11} style={{ color: "var(--green)", flexShrink: 0, marginTop: "2px" }} />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Circle size={14} style={{ color: "var(--text-muted)" }} /> Future Work
          </div>
          <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "7px" }}>
            {FUTURE.map((item) => (
              <div key={item} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--text-muted)", alignItems: "flex-start" }}>
                <Circle size={11} style={{ flexShrink: 0, marginTop: "2px" }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API endpoints */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
          API Endpoints ({ENDPOINTS.length})
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface-2)", borderBottom: "1px solid var(--border)" }}>
                {["Method", "Path", "Description"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr key={e.path} style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(el) => (el.currentTarget.style.background = "var(--bg-surface-2)")}
                  onMouseLeave={(el) => (el.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "9px 16px" }}>
                    <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace", fontWeight: 700, ...(METHOD_STYLE[e.method] ?? {}) }}>
                      {e.method}
                    </span>
                  </td>
                  <td style={{ padding: "9px 16px" }}>
                    <code style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--accent)" }}>{e.path}</code>
                  </td>
                  <td style={{ padding: "9px 16px", fontSize: "12px", color: "var(--text-secondary)" }}>{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* How to run */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
          How to Run Locally
        </div>
        <div style={{ padding: "18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
          {[
            { label: "Backend", code: "cd backend\npip install -r requirements.txt\nuvicorn main:app --reload --port 8000" },
            { label: "Frontend", code: "cd frontend\nnpm install\nnpm run dev" },
            { label: "Tests", code: "cd backend\npytest tests/ -v\n\n# 97 tests should pass" },
          ].map(({ label, code }) => (
            <div key={label}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <pre
                style={{
                  fontSize: "11px",
                  fontFamily: "monospace",
                  color: "var(--text-secondary)",
                  background: "var(--bg-surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "12px",
                  margin: 0,
                  overflowX: "auto",
                }}
              >
                {code}
              </pre>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border)", fontSize: "11px", color: "var(--text-muted)" }}>
          Frontend: <code style={{ fontFamily: "monospace", color: "var(--accent)" }}>http://localhost:5173</code> · Backend: <code style={{ fontFamily: "monospace", color: "var(--accent)" }}>http://localhost:8000</code> · Swagger: <code style={{ fontFamily: "monospace", color: "var(--accent)" }}>http://localhost:8000/docs</code>
        </div>
      </div>

      {/* Before / After comparison */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
          Manual vs Automated Analysis
        </div>
        <div style={{ padding: "18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div style={{ padding: "14px", background: "var(--bg-surface-2)", border: "1px solid var(--border)", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "10px" }}>Baseline: Manual Inspection</div>
            {["Receive configuration file", "Manually read each field", "Mentally check against known rules", "Write conflict notes", "Share notes with team"].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>
                <span style={{ flexShrink: 0 }}>{i + 1}.</span>{s}
              </div>
            ))}
            <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
              Time: 30–60 min per tenant · Error-prone · Not auditable
            </div>
          </div>
          <div style={{ padding: "14px", background: "var(--accent-light)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", marginBottom: "10px" }}>Automated: CONFIQRA</div>
            {["Submit configuration via UI or API", "Parser validates structure", "Engine runs detection rules", "Results returned with evidence", "Dashboard shows results instantly"].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "5px" }}>
                <span style={{ color: "var(--accent)", flexShrink: 0 }}>{i + 1}.</span>{s}
              </div>
            ))}
            <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--accent)", fontStyle: "italic" }}>
              Time: &lt;1 second · Deterministic · Full evidence trail
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
