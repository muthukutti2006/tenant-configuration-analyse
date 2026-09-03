import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

const approaches = [
  {
    id: "rule-based",
    name: "Rule-Based Conflict Detection",
    selected: true,
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
    explainability: "EXCELLENT — every conflict is traced to a specific rule ID, fields involved, and documented severity policy.",
    dataRequirements: "None — deterministic logic only.",
    fpRisk: "LOW — rules are precise conditions; tuning reduces false positives.",
    fnRisk: "MEDIUM — unanticipated patterns may not be covered until rules are extended.",
    auditability: "HIGH — rule ID, field path, value pair, and evidence are returned for every conflict.",
    suitability: "SELECTED — best fit for academic prototype requiring explainability, auditability, and deterministic results.",
  },
  {
    id: "ml-anomaly",
    name: "ML / Anomaly Detection",
    selected: false,
    summary:
      "A machine learning model (e.g., Isolation Forest, Autoencoder, or fine-tuned LLM) learns patterns from historical configuration data and flags deviations as potential conflicts.",
    howItWorks: [
      "Historical tenant configurations are collected and labelled.",
      "Feature engineering extracts numeric representations of config fields.",
      "Model is trained to identify normal vs anomalous configurations.",
      "At inference, configurations are scored against learned patterns.",
      "Anomaly score above a threshold triggers a conflict alert.",
    ],
    advantages: [
      "Can detect novel conflict patterns not covered by explicit rules.",
      "Scales well when labeled data is abundant.",
      "Potentially catches subtle cross-field correlations.",
    ],
    disadvantages: [
      "Requires significant historical labeled data — not available at project start.",
      "Black-box decisions are harder to explain to university administrators.",
      "Higher risk of spurious anomaly flags (false positives).",
      "Model retraining required when configuration schema changes.",
      "Threshold tuning is non-trivial and may vary per tenant.",
    ],
    explainability: "POOR to MODERATE — anomaly scores do not map clearly to business rules without additional explainability layers (e.g., SHAP).",
    dataRequirements: "HIGH — needs sufficient labeled historical configurations representing normal and conflict states.",
    fpRisk: "HIGH — anomaly detectors flag novel-but-valid configurations as conflicts.",
    fnRisk: "LOW to MEDIUM — trained models generalise to unseen conflict patterns if training data is representative.",
    auditability: "LOW — model internals are opaque without additional tooling.",
    suitability: "NOT SELECTED for Review-1. Can be added as a parallel experimental module in a future phase once labelled data is available.",
  },
];

export function ApproachPage() {
  const [activeTab, setActiveTab] = useState("rule-based");

  const approach = approaches.find((a) => a.id === activeTab)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Technical Approach Comparison</h1>
        <p className="text-sm text-slate-500 mt-1">
          Analysis of two candidate approaches and justification for the selected method
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2">
        {approaches.map((a) => (
          <button
            key={a.id}
            onClick={() => setActiveTab(a.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === a.id
                ? "bg-indigo-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {a.name}
            {a.selected && (
              <span className="ml-2 text-xs px-1 py-0.5 rounded bg-green-200 text-green-800">
                Selected
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Approach detail */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle>{approach.name}</CardTitle>
              {approach.selected && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-semibold">
                  ✓ Selected Approach
                </span>
              )}
              {!approach.selected && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Not Selected
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">{approach.summary}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>How It Works</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {approach.howItWorks.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="text-indigo-500 font-bold w-5 flex-shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Advantages</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {approach.advantages.map((a) => (
                    <li key={a} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-green-500">✓</span>{a}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Disadvantages</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {approach.disadvantages.map((d) => (
                    <li key={d} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-red-400">✗</span>{d}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Properties table */}
        <Card>
          <CardHeader><CardTitle>Evaluation Criteria</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Explainability", approach.explainability],
                  ["Data Requirements", approach.dataRequirements],
                  ["False Positive Risk", approach.fpRisk],
                  ["False Negative Risk", approach.fnRisk],
                  ["Auditability", approach.auditability],
                  ["Project Suitability", approach.suitability],
                ].map(([label, value]) => (
                  <tr key={label} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-600 w-1/3">{label}</td>
                    <td className="px-4 py-3 text-slate-800">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Selection Justification */}
      <Card>
        <CardHeader>
          <CardTitle>Selection Justification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>
            <strong>Rule-Based Conflict Detection</strong> was selected as the primary approach for Review-1 for the following reasons:
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="text-indigo-500 font-bold mt-0.5">1.</span>
              <span><strong>Explainability requirement:</strong> University administrators need to understand exactly why a configuration was flagged. Rule-based evidence provides field-level, human-readable justification.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-500 font-bold mt-0.5">2.</span>
              <span><strong>Deterministic policies:</strong> Configuration constraints (e.g., fee clearance requires fees module) are formally defined business rules, not statistical patterns.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-500 font-bold mt-0.5">3.</span>
              <span><strong>No historical data available:</strong> The project begins without labeled conflict datasets, making ML training infeasible at this stage.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-500 font-bold mt-0.5">4.</span>
              <span><strong>Audit trail:</strong> Each conflict maps to a rule ID, conflict type, and severity with documented rationale — essential for academic evaluation.</span>
            </li>
          </ul>
          <p className="text-slate-500 text-xs mt-3">
            The architecture deliberately decouples the detection engine, allowing an ML anomaly detection module to be added as a parallel experimental channel in a future phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
