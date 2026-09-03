"""
Pydantic data models for conflicts, evidence, and analysis results.
"""
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ConflictType(str, Enum):
    DIRECT_RULE_CONFLICT = "DIRECT_RULE_CONFLICT"
    FEATURE_FLAG_CONFLICT = "FEATURE_FLAG_CONFLICT"
    DEPENDENCY_CONFLICT = "DEPENDENCY_CONFLICT"
    DUPLICATE_OR_CONTRADICTORY_RULE = "DUPLICATE_OR_CONTRADICTORY_RULE"
    INVALID_CONFIGURATION = "INVALID_CONFIGURATION"


class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Evidence(BaseModel):
    tenant_id: str
    module: str
    rule_a: str
    rule_b: Optional[str] = None
    value_a: Any
    value_b: Optional[Any] = None
    conflict_type: ConflictType
    severity: Severity
    explanation: str
    why_conflict: str
    recommendation: str


class Conflict(BaseModel):
    id: str
    conflict_type: ConflictType
    severity: Severity
    title: str
    description: str
    module: str
    fields_involved: List[str]
    evidence: Optional[Evidence] = None


class ValidationError(BaseModel):
    field: str
    message: str
    severity: Severity = Severity.CRITICAL


class AnalysisSummary(BaseModel):
    total_rules_analyzed: int
    total_conflicts: int
    critical: int
    high: int
    medium: int
    low: int
    conflict_types: Dict[str, int]


class AnalysisResult(BaseModel):
    tenant_id: str
    tenant_name: str
    version: str
    status: str  # "clean" | "conflicts_found" | "invalid_configuration"
    summary: AnalysisSummary
    validation_errors: List[ValidationError] = []
    conflicts: List[Conflict] = []
    normalized_rules_count: int = 0
