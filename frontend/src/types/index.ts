// TypeScript types matching backend Pydantic models

export type ConflictType =
  | "DIRECT_RULE_CONFLICT"
  | "FEATURE_FLAG_CONFLICT"
  | "DEPENDENCY_CONFLICT"
  | "DUPLICATE_OR_CONTRADICTORY_RULE"
  | "INVALID_CONFIGURATION";

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface Evidence {
  tenant_id: string;
  module: string;
  rule_a: string;
  rule_b?: string;
  value_a: unknown;
  value_b?: unknown;
  conflict_type: ConflictType;
  severity: Severity;
  explanation: string;
  why_conflict: string;
  recommendation: string;
}

export interface Conflict {
  id: string;
  conflict_type: ConflictType;
  severity: Severity;
  title: string;
  description: string;
  module: string;
  fields_involved: string[];
  evidence?: Evidence;
  // Set by API enrichment
  tenant_id?: string;
  tenant_name?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: Severity;
}

export interface AnalysisSummary {
  total_rules_analyzed: number;
  total_conflicts: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  conflict_types: Record<string, number>;
}

export interface AnalysisResult {
  tenant_id: string;
  tenant_name: string;
  version: string;
  status: string;
  summary: AnalysisSummary;
  validation_errors: ValidationError[];
  conflicts: Conflict[];
  normalized_rules_count: number;
}

export interface TenantConfig {
  tenant_id: string;
  tenant_name: string;
  version: string;
  modules: Record<string, Record<string, unknown>>;
  feature_flags?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AggregatedStats {
  total_tenants: number;
  total_rules_analyzed: number;
  total_conflicts: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  results: AnalysisResult[];
}

export interface ConflictRule {
  id: string;
  type: ConflictType;
  name: string;
  description: string;
  default_severity: Severity;
}

// ─── Drift Detection Types ────────────────────────────────────────────────────

export type DriftType = "ADDED" | "REMOVED" | "CHANGED" | "UNCHANGED";
export type DriftSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface DriftEvidence {
  reason: string;
  impact: string;
  recommendation: string;
}

export interface DriftFinding {
  id: string;
  tenant_id: string;
  baseline_version: string;
  candidate_version: string;
  drift_type: DriftType;
  field: string;
  old_value: unknown;
  new_value: unknown;
  severity: DriftSeverity;
  evidence: DriftEvidence;
}

export interface DriftSummary {
  total_findings: number;
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DriftReport {
  tenant_id: string;
  tenant_name: string;
  baseline_version: string;
  candidate_version: string;
  summary: DriftSummary;
  findings: DriftFinding[];
}

// ─── Baseline Store Types ──────────────────────────────────────────────────────

export interface BaselineRecord {
  tenant_id: string;
  tenant_name: string;
  version: string;
  baseline_label: string;
  timestamp?: string;
  approved_by?: string;
  config: Record<string, unknown>;
}

// ─── Rule Catalogue Types ─────────────────────────────────────────────────────

export interface CatalogRule {
  rule_id: string;
  category: string;
  name: string;
  description: string;
  condition: string;
  severity: string;
  evidence_template: string;
  enabled: boolean;
  rule_type: string;
}

// ─── Experiment Types ─────────────────────────────────────────────────────────

export interface ExperimentScenario {
  id: string;
  description: string;
  notes: string;
  baseline: string;
  candidate_version: string;
  ground_truth_issues: string[];
  manual_catches: string[];
  drift_findings_total: number;
  drift_findings_actionable: number;
  actionable_findings: {
    field: string;
    drift_type: string;
    severity: string;
    old_value: unknown;
    new_value: unknown;
    reason: string;
    recommendation: string;
  }[];
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  avoided: number;
  avoided_issues: string[];
  error?: string;
}

export interface ExperimentResult {
  experiment_label: string;
  data_note: string;
  definition_of_avoided: string;
  total_scenarios: number;
  total_tp: number;
  total_fp: number;
  total_fn: number;
  total_tn: number;
  total_detected: number;
  total_avoided: number;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  scenarios: ExperimentScenario[];
}

