"""
Pydantic models for configuration drift detection.
"""
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class DriftType(str, Enum):
    ADDED = "ADDED"
    REMOVED = "REMOVED"
    CHANGED = "CHANGED"
    UNCHANGED = "UNCHANGED"


class DriftSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class DriftEvidence(BaseModel):
    reason: str
    impact: str
    recommendation: str


class DriftFinding(BaseModel):
    id: str
    tenant_id: str
    baseline_version: str
    candidate_version: str
    drift_type: DriftType
    field: str
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    severity: DriftSeverity
    evidence: DriftEvidence


class DriftSummary(BaseModel):
    total_findings: int
    added: int
    removed: int
    changed: int
    unchanged: int
    critical: int
    high: int
    medium: int
    low: int


class DriftReport(BaseModel):
    tenant_id: str
    tenant_name: str
    baseline_version: str
    candidate_version: str
    summary: DriftSummary
    findings: List[DriftFinding]


class BaselineRecord(BaseModel):
    tenant_id: str
    tenant_name: str
    version: str
    baseline_label: str
    timestamp: Optional[str] = None
    approved_by: Optional[str] = None
    config: Dict[str, Any]
