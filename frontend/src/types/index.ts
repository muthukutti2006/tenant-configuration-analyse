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
