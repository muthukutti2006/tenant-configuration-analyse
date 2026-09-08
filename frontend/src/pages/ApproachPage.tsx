import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import type { ExperimentResult } from "../types";
import { SectionHeader, ErrorState } from "../components/ui/Shared";
import { MetricCard } from "../components/ui/MetricCard";
import { CheckCircle2, XCircle, GitCompare, Shield } from "lucide-react";

const APPROACH_CHOSEN = {
  id: "rule-based",
  name: "Rule-Based Conflict Detection",
  summary:
    "Explicitly programmed rules inspect configuration fields and return deterministic verdicts. Each rule maps a specific condition to a conflict type and severity.",
  howItWorks: [
    "Configuration is parsed and validated against a schema.",
    "Normalizer flattens all settings into (key, value) pairs.",
    "Each detector function runs a set of named logical checks.",
    "Classifier assigns severity using a documented policy table.",
    "Evidence generator produces structured, field-level justification.",
  ],
  advantages: [
    "Fully deterministic — same input always gives same output.",
    "Every decision is explainable to a non-technical stakeholder.",
    "No training data required.",
    "Easy to audit: rules are code, readable by a developer.",
    "Fast — runs in milliseconds even for large configurations.",
    "False-positive rate is controllable by refining rules.",
  ],
  disadvantages: [
    "Cannot detect novel conflict patterns not anticipated by rule authors.",
    "Rule set must be maintained as configuration schema evolves.",
    "Scales linearly with number of rules written.",
  ],
};

const APPROACH_NOT_CHOSEN = {
  name: "ML / Anomaly Detection",
  summary:
    "A machine learning model learns patterns from historical configuration data and flags deviations as potential conflicts.",
  whyNot: [
    "Requires significant historical labeled data — unavailable at project start.",
    "Black-box decisions are harder to explain to university administrators.",
    "Higher risk of spurious anomaly flags (false positives).",
    "Model retraining required when configuration schema changes.",
    "Academic project requires explainability and auditability — ML does not provide this transparently.",
  ],
};

export function ApproachPage() {
  const [experiment, setExperiment] = useState<ExperimentResult | null>(null);

  useEffect(() => {
    api.getExperiment().then(setExperiment).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <SectionHeader
        title="Technical Approach"
        subtitle="System design, approach selection rationale, and validation experiment results."
      />

      {/* Architecture overview */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
          System Architecture
        </div>
        <div style={{ padding: "20px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", justifyContent: "center" }}>
          {[
            "Configuration Input",
            "→",
            "Parser & Validator",
            "→",
            "Normalizer",
            "→",
            "Conflict Detector",
            "→",
            "Severity Classifier",
            "→",
            "Evidence Generator",
            "→",
            "Analysis Report",
          ].map((item, i) => (
            item === "→" ? (
              <span key={i} style={{ color: "var(--text-muted)", fontSize: "16px" }}>→</span>
            ) : (
              <div
                key={i}
                style={{
                  padding: "8px 14px",
                  background: item === "Conflict Detector" ? "var(--accent-light)" : "var(--bg-surface-2)",
                  border: `1px solid ${item === "Conflict Detector" ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: item === "Conflict Detector" ? 600 : 400,
                  color: item === "Conflict Detector" ? "var(--accent)" : "var(--text-secondary)",
                  textAlign: "center",
                }}
              >
                {item}
              </div>
            )
          ))}
        </div>
      </div>

      {/* Approach comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Selected: Rule-based */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid rgba(99,102,241,0.4)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--accent-light)",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{APPROACH_CHOSEN.name}</div>
            </div>
            <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "12px", fontWeight: 700, background: "var(--accent)", color: "#fff" }}>
              SELECTED ✓
            </span>
          </div>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              {APPROACH_CHOSEN.summary}
            </p>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>How it works</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {APPROACH_CHOSEN.howItWorks.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Advantages</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {APPROACH_CHOSEN.advantages.map((a) => (
                  <div key={a} style={{ display: "flex", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", alignItems: "flex-start" }}>
                    <CheckCircle2 size={12} style={{ color: "var(--green)", flexShrink: 0, marginTop: "2px" }} />
                    {a}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--c-medium)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Limitations</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {APPROACH_CHOSEN.disadvantages.map((d) => (
                  <div key={d} style={{ display: "flex", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--c-medium)", flexShrink: 0 }}>~</span>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Not selected: ML */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
            opacity: 0.8,
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-surface-2)",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{APPROACH_NOT_CHOSEN.name}</div>
            <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "12px", fontWeight: 600, background: "var(--bg-surface-3)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              NOT SELECTED
            </span>
          </div>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              {APPROACH_NOT_CHOSEN.summary}
            </p>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--c-critical)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Why Not Selected</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {APPROACH_NOT_CHOSEN.whyNot.map((reason) => (
                  <div key={reason} style={{ display: "flex", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", alignItems: "flex-start" }}>
                    <XCircle size={12} style={{ color: "var(--c-critical)", flexShrink: 0, marginTop: "2px" }} />
                    {reason}
                  </div>
                ))}
              </div>
            </div>
            <div
              style={{
                padding: "10px 12px",
                background: "var(--bg-surface-3)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              Note: CONFIQRA does NOT claim ML capabilities. This system uses deterministic rule-based detection only.
            </div>
          </div>
        </div>
      </div>

      {/* Experiment results */}
      {experiment && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>Validation Experiment</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{experiment.experiment_label}</div>
            </div>
            <span
              style={{
                fontSize: "10px",
                padding: "3px 10px",
                borderRadius: "12px",
                fontWeight: 700,
                background: "rgba(234,179,8,0.12)",
                color: "var(--c-medium)",
                border: "1px solid rgba(234,179,8,0.3)",
              }}
            >
              ⚠ SYNTHETIC DATA
            </span>
          </div>
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: 0, marginBottom: "16px", padding: "8px 12px", background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.15)", borderRadius: "6px" }}>
              {experiment.data_note}
            </p>

            {/* Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "12px", marginBottom: "16px" }}>
              {[
                { label: "True Positives", value: experiment.total_tp, color: "var(--green)" },
                { label: "True Negatives", value: experiment.total_tn, color: "var(--green)" },
                { label: "False Positives", value: experiment.total_fp, color: "var(--c-critical)" },
                { label: "False Negatives", value: experiment.total_fn, color: "var(--c-high)" },
                { label: "Issues Avoided", value: experiment.total_avoided, color: "var(--accent)" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{
                    padding: "12px",
                    background: "var(--bg-surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "20px", fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Classification metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "16px" }}>
              {[
                { label: "Precision", value: experiment.precision !== null ? `${(experiment.precision * 100).toFixed(0)}%` : "N/A" },
                { label: "Recall", value: experiment.recall !== null ? `${(experiment.recall * 100).toFixed(0)}%` : "N/A" },
                { label: "F1 Score", value: experiment.f1 !== null ? experiment.f1.toFixed(2) : "N/A" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    padding: "12px",
                    background: "var(--bg-surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--accent)" }}>{value}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Scenarios */}
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "10px" }}>
                Experiment Scenarios ({experiment.total_scenarios})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {experiment.scenarios.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: "12px 14px",
                      background: "var(--bg-surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "7px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{s.description}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                          Baseline: <code style={{ fontFamily: "monospace" }}>{s.baseline}</code> → Candidate: <code style={{ fontFamily: "monospace" }}>{s.candidate_version}</code>
                        </div>
                        {s.notes && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", fontStyle: "italic" }}>{s.notes}</div>}
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(34,197,94,0.12)", color: "var(--green)", borderRadius: "4px", fontFamily: "monospace" }}>TP:{s.tp}</span>
                        <span style={{ fontSize: "10px", padding: "1px 6px", background: "var(--c-critical-bg)", color: "var(--c-critical)", borderRadius: "4px", fontFamily: "monospace" }}>FP:{s.fp}</span>
                        <span style={{ fontSize: "10px", padding: "1px 6px", background: "var(--c-high-bg)", color: "var(--c-high)", borderRadius: "4px", fontFamily: "monospace" }}>FN:{s.fn}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
