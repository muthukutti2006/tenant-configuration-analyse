"""
Tenant-Configuration Analyser – FastAPI Application
=====================================================
Review-1 Prototype
"""
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from engine.parser import parse_config
from engine.validator import validate_config
from engine.normalizer import normalize_rules
from engine.detector import run_all_detectors
from engine.classifier import build_conflicts
from engine.evidence import generate_evidence_report
from models.conflict_model import AnalysisResult, AnalysisSummary, ConflictType, Severity

# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Tenant-Configuration Analyser API",
    description="Rule-Based Conflict Detection for University Student-Services Portal",
    version="1.0.0-review1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent / "data" / "tenants"


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _analyse_raw(raw: Dict[str, Any]) -> AnalysisResult:
    """Core analysis pipeline: parse → validate → normalize → detect → classify → evidence."""
    # 1. Parse
    parse_result = parse_config(raw)

    tenant_id = raw.get("tenant_id", "UNKNOWN")
    tenant_name = raw.get("tenant_name", "Unknown")
    version = raw.get("version", "0.0.0")

    # 2. Validate
    validation_errors = validate_config(raw)

    if not parse_result.success:
        # Return immediately with parse errors as INVALID_CONFIGURATION
        return AnalysisResult(
            tenant_id=tenant_id,
            tenant_name=tenant_name,
            version=version,
            status="invalid_configuration",
            summary=AnalysisSummary(
                total_rules_analyzed=0,
                total_conflicts=len(parse_result.parse_errors),
                critical=len(parse_result.parse_errors),
                high=0,
                medium=0,
                low=0,
                conflict_types={ConflictType.INVALID_CONFIGURATION.value: len(parse_result.parse_errors)},
            ),
            validation_errors=[],
            conflicts=[],
            normalized_rules_count=0,
        )

    # 3. Normalize rules
    normalized = normalize_rules(parse_result.config)

    # 4. Detect conflicts
    raw_conflicts = run_all_detectors(raw, validation_errors)

    # 5. Classify + build evidence
    conflicts = build_conflicts(raw_conflicts, tenant_id)

    # 6. Summary
    counts = {s: 0 for s in Severity}
    type_counts: Dict[str, int] = {}
    for c in conflicts:
        counts[c.severity] += 1
        type_counts[c.conflict_type.value] = type_counts.get(c.conflict_type.value, 0) + 1

    status = "clean" if not conflicts else "conflicts_found"
    if any(c.severity == Severity.CRITICAL for c in conflicts):
        status = "critical_conflicts_found"

    return AnalysisResult(
        tenant_id=tenant_id,
        tenant_name=tenant_name,
        version=version,
        status=status,
        summary=AnalysisSummary(
            total_rules_analyzed=len(normalized),
            total_conflicts=len(conflicts),
            critical=counts[Severity.CRITICAL],
            high=counts[Severity.HIGH],
            medium=counts[Severity.MEDIUM],
            low=counts[Severity.LOW],
            conflict_types=type_counts,
        ),
        validation_errors=validation_errors,
        conflicts=conflicts,
        normalized_rules_count=len(normalized),
    )


def _load_all_tenants() -> List[Dict[str, Any]]:
    tenants = []
    if DATA_DIR.exists():
        for f in sorted(DATA_DIR.glob("*.json")):
            try:
                tenants.append(json.loads(f.read_text(encoding="utf-8")))
            except Exception:
                pass
    return tenants


# ─────────────────────────────────────────────────────────────────────────────
# Request/Response schemas
# ─────────────────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    config: Dict[str, Any]


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["System"])
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Tenant-Configuration Analyser",
        "version": "1.0.0-review1",
    }


@app.post("/api/analyze", response_model=AnalysisResult, tags=["Analysis"])
def analyze(request: AnalyzeRequest):
    """
    Submit a tenant configuration for analysis.
    Returns parsed conflicts, severity, and evidence.
    """
    try:
        return _analyse_raw(request.config)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/configurations", tags=["Configurations"])
def list_configurations():
    """Return all bundled test tenant configurations."""
    tenants = _load_all_tenants()
    return {
        "count": len(tenants),
        "configurations": tenants,
    }


@app.get("/api/configurations/{tenant_id}", tags=["Configurations"])
def get_configuration(tenant_id: str):
    """Return a specific tenant configuration by ID."""
    tenants = _load_all_tenants()
    for t in tenants:
        if t.get("tenant_id") == tenant_id:
            return t
    raise HTTPException(status_code=404, detail=f"Tenant '{tenant_id}' not found.")


@app.get("/api/analyze-all", tags=["Analysis"])
def analyze_all():
    """
    Analyse all bundled tenant configurations and return aggregated results.
    This is what the Overview dashboard uses.
    """
    tenants = _load_all_tenants()
    results = []
    for t in tenants:
        try:
            result = _analyse_raw(t)
            results.append(result.model_dump())
        except Exception as exc:
            results.append({"error": str(exc), "tenant_id": t.get("tenant_id", "?")})

    # Aggregate stats
    total_rules = sum(r.get("normalized_rules_count", 0) for r in results if "error" not in r)
    total_conflicts = sum(r.get("summary", {}).get("total_conflicts", 0) for r in results if "error" not in r)
    total_critical = sum(r.get("summary", {}).get("critical", 0) for r in results if "error" not in r)
    total_high = sum(r.get("summary", {}).get("high", 0) for r in results if "error" not in r)
    total_medium = sum(r.get("summary", {}).get("medium", 0) for r in results if "error" not in r)
    total_low = sum(r.get("summary", {}).get("low", 0) for r in results if "error" not in r)

    return {
        "total_tenants": len(tenants),
        "total_rules_analyzed": total_rules,
        "total_conflicts": total_conflicts,
        "critical": total_critical,
        "high": total_high,
        "medium": total_medium,
        "low": total_low,
        "results": results,
    }


@app.get("/api/conflicts", tags=["Conflicts"])
def list_all_conflicts():
    """Return all conflicts across all tenant configurations."""
    tenants = _load_all_tenants()
    all_conflicts = []
    for t in tenants:
        try:
            result = _analyse_raw(t)
            for c in result.conflicts:
                cd = c.model_dump()
                cd["tenant_id"] = result.tenant_id
                cd["tenant_name"] = result.tenant_name
                all_conflicts.append(cd)
        except Exception:
            pass
    return {"count": len(all_conflicts), "conflicts": all_conflicts}


@app.get("/api/conflicts/{conflict_id}", tags=["Conflicts"])
def get_conflict(conflict_id: str):
    """Return a specific conflict by ID, including full evidence."""
    tenants = _load_all_tenants()
    for t in tenants:
        try:
            result = _analyse_raw(t)
            for c in result.conflicts:
                if c.id == conflict_id:
                    cd = c.model_dump()
                    cd["tenant_id"] = result.tenant_id
                    cd["tenant_name"] = result.tenant_name
                    return cd
        except Exception:
            pass
    raise HTTPException(status_code=404, detail=f"Conflict '{conflict_id}' not found.")


@app.get("/api/rules", tags=["Rules"])
def list_rules():
    """Return the documented conflict detection rules."""
    return {
        "rules": [
            {
                "id": "R001",
                "type": "DIRECT_RULE_CONFLICT",
                "name": "Attendance Threshold Mismatch",
                "description": "minimum_attendance < exam_eligibility_attendance in the same tenant.",
                "default_severity": "HIGH",
            },
            {
                "id": "R002",
                "type": "DIRECT_RULE_CONFLICT",
                "name": "Cross-Module Exam Eligibility Attendance Mismatch",
                "description": "admissions and attendance modules define different exam attendance thresholds.",
                "default_severity": "HIGH",
            },
            {
                "id": "R003",
                "type": "FEATURE_FLAG_CONFLICT",
                "name": "Online Payment Disabled but Payment Required",
                "description": "online_payment flag is false while payment_required_before_admission is true.",
                "default_severity": "HIGH",
            },
            {
                "id": "R004",
                "type": "FEATURE_FLAG_CONFLICT",
                "name": "Digital Certificate Disabled but Signature Required",
                "description": "digital_certificate flag is false while digital_signature_required is true.",
                "default_severity": "MEDIUM",
            },
            {
                "id": "R005",
                "type": "DEPENDENCY_CONFLICT",
                "name": "Certificate Fee Clearance Without Fees Module",
                "description": "fee_clearance_required=true but fees module is disabled.",
                "default_severity": "CRITICAL",
            },
            {
                "id": "R006",
                "type": "DEPENDENCY_CONFLICT",
                "name": "Certificate Attendance Clearance Without Attendance Module",
                "description": "attendance_clearance_required=true but attendance module is disabled.",
                "default_severity": "CRITICAL",
            },
            {
                "id": "R007",
                "type": "DEPENDENCY_CONFLICT",
                "name": "Fee Payment Before Admission Without Admissions Module",
                "description": "payment_required_before_admission=true but admissions module is disabled.",
                "default_severity": "HIGH",
            },
            {
                "id": "R008",
                "type": "DUPLICATE_OR_CONTRADICTORY_RULE",
                "name": "Duplicate Attendance Threshold",
                "description": "minimum_attendance equals exam_eligibility_attendance — redundant.",
                "default_severity": "LOW",
            },
            {
                "id": "R009",
                "type": "DUPLICATE_OR_CONTRADICTORY_RULE",
                "name": "Grace Period Without Late Fee",
                "description": "grace_period_days > 0 but late_fee_applicable is false.",
                "default_severity": "MEDIUM",
            },
            {
                "id": "R010",
                "type": "INVALID_CONFIGURATION",
                "name": "Percentage Out of Range",
                "description": "Any percentage field outside [0, 100].",
                "default_severity": "CRITICAL",
            },
        ]
    }
