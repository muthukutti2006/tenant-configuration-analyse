"""
Configuration Drift Detection Engine
======================================
Compares a candidate configuration against an approved baseline.
Detects: ADDED, REMOVED, CHANGED fields across modules and feature_flags.

This module is INDEPENDENT from the existing conflict detector.
It does NOT replace or modify detector.py.

Severity Policy
---------------
CRITICAL:
  - Module enabled -> disabled (breaks all dependent workflows)
  - Critical module field removed entirely

HIGH:
  - Important policy threshold changed (attendance, eligibility, payment)
  - Required clearance behaviour changed
  - Important feature flag changed

MEDIUM:
  - Moderate-impact change (grace period, non-critical flags)

LOW:
  - New optional field added
  - Any other field change not covered above
"""
import uuid
from typing import Any, Dict, List
from models.drift_model import (
    DriftFinding, DriftType, DriftSeverity, DriftEvidence,
    DriftSummary, DriftReport,
)

# ─────────────────────────────────────────────────────────────────────────────
# Severity classification tables
# ─────────────────────────────────────────────────────────────────────────────

# Removal of these fields is CRITICAL
_CRITICAL_REMOVAL_FIELDS = {
    "modules.fees.enabled",
    "modules.attendance.enabled",
    "modules.admissions.enabled",
    "modules.certificates.enabled",
}

# Change of these fields is HIGH
_HIGH_CHANGE_FIELDS = {
    "modules.attendance.minimum_attendance",
    "modules.attendance.exam_eligibility_attendance",
    "modules.admissions.minimum_eligibility_percentage",
    "modules.fees.payment_required_before_admission",
    "modules.certificates.fee_clearance_required",
    "modules.certificates.attendance_clearance_required",
    "feature_flags.online_payment",
}

# Change of these fields is MEDIUM
_MEDIUM_CHANGE_FIELDS = {
    "modules.fees.grace_period_days",
    "modules.fees.late_fee_applicable",
    "modules.attendance.attendance_grace_period",
    "feature_flags.digital_certificate",
    "feature_flags.self_registration",
    "modules.certificates.digital_signature_required",
}

# These fields being changed to False is CRITICAL
_ENABLED_FIELDS = {
    f"modules.{m}.enabled"
    for m in ["admissions", "fees", "attendance", "certificates"]
}


def _make_id() -> str:
    return str(uuid.uuid4())[:8]


def _flatten(d: Dict[str, Any], prefix: str = "") -> Dict[str, Any]:
    """Recursively flatten a nested dict to dot-separated paths."""
    result: Dict[str, Any] = {}
    for k, v in d.items():
        path = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            result.update(_flatten(v, path))
        else:
            result[path] = v
    return result


def _classify_severity(
    field: str,
    drift_type: DriftType,
    old_value: Any,
    new_value: Any,
) -> DriftSeverity:
    """
    Deterministic severity assignment for drift findings.

    Rule priority (first match wins):
    1. Module enabled -> disabled              → CRITICAL
    2. Critical field removed                  → CRITICAL
    3. HIGH-impact field changed               → HIGH
    4. HIGH-impact field removed               → HIGH
    5. MEDIUM-impact field changed             → MEDIUM
    6. Any field added                         → LOW
    7. Any other change                        → MEDIUM
    8. Any other removal                       → MEDIUM
    """
    # 1. enabled -> disabled
    if field in _ENABLED_FIELDS and drift_type == DriftType.CHANGED:
        if old_value is True and new_value is False:
            return DriftSeverity.CRITICAL

    # 2. Critical field removed
    if drift_type == DriftType.REMOVED and field in _CRITICAL_REMOVAL_FIELDS:
        return DriftSeverity.CRITICAL

    # 3. HIGH field changed
    if drift_type == DriftType.CHANGED and field in _HIGH_CHANGE_FIELDS:
        return DriftSeverity.HIGH

    # 4. HIGH field removed
    if drift_type == DriftType.REMOVED and field in _HIGH_CHANGE_FIELDS:
        return DriftSeverity.HIGH

    # 5. MEDIUM field changed
    if drift_type == DriftType.CHANGED and field in _MEDIUM_CHANGE_FIELDS:
        return DriftSeverity.MEDIUM

    # 6. New field added
    if drift_type == DriftType.ADDED:
        return DriftSeverity.LOW

    # 7-8. Default
    return DriftSeverity.MEDIUM


def _build_evidence(
    field: str,
    drift_type: DriftType,
    severity: DriftSeverity,
    old_value: Any,
    new_value: Any,
) -> DriftEvidence:
    """Build structured evidence for a drift finding."""
    if drift_type == DriftType.ADDED:
        reason = f"Field '{field}' was added in the candidate (not present in baseline)."
        impact = "New configuration field introduced. Review to confirm it is intentional and approved."
        recommendation = f"Verify that the addition of '{field}' = {new_value!r} is approved before deployment."

    elif drift_type == DriftType.REMOVED:
        severity_label = (
            "CRITICAL impact" if severity == DriftSeverity.CRITICAL
            else "HIGH impact" if severity == DriftSeverity.HIGH
            else "Moderate impact"
        )
        reason = f"Field '{field}' (baseline value: {old_value!r}) was removed from the candidate."
        impact = f"{severity_label}: removing '{field}' may break dependent workflows."
        recommendation = f"Restore '{field}' or explicitly document the approved removal of this field."

    else:  # CHANGED
        reason = (
            f"Field '{field}' changed from {old_value!r} (baseline) to {new_value!r} (candidate)."
        )
        impact = (
            f"This field controls an important policy or behaviour. "
            f"Changing it from {old_value!r} to {new_value!r} may affect student services."
        )
        recommendation = (
            f"Review the change to '{field}'. "
            f"If intentional, update the approved baseline. "
            f"If not intentional, revert to {old_value!r}."
        )

    return DriftEvidence(reason=reason, impact=impact, recommendation=recommendation)


def compare_configurations(
    baseline: Dict[str, Any],
    candidate: Dict[str, Any],
    tenant_id: str,
    baseline_version: str,
    candidate_version: str,
) -> DriftReport:
    """
    Compare candidate configuration against baseline.

    Only compares the configuration data (modules + feature_flags).
    Metadata fields (tenant_id, version, baseline_label, etc.) are excluded.

    Returns a DriftReport with all ADDED, REMOVED, CHANGED findings.
    UNCHANGED fields are counted in the summary but not returned as findings.
    """
    def _extract_config(raw: Dict[str, Any]) -> Dict[str, Any]:
        result = {}
        if "modules" in raw:
            result["modules"] = raw["modules"]
        if "feature_flags" in raw:
            result["feature_flags"] = raw["feature_flags"]
        return result

    baseline_flat = _flatten(_extract_config(baseline))
    candidate_flat = _flatten(_extract_config(candidate))

    all_keys = set(baseline_flat.keys()) | set(candidate_flat.keys())
    findings: List[DriftFinding] = []

    added = removed = changed = unchanged = 0
    counts = {s: 0 for s in DriftSeverity}

    for field in sorted(all_keys):
        in_baseline = field in baseline_flat
        in_candidate = field in candidate_flat

        if in_baseline and in_candidate:
            b_val = baseline_flat[field]
            c_val = candidate_flat[field]
            if b_val == c_val:
                unchanged += 1
                continue
            drift_type = DriftType.CHANGED
            old_v, new_v = b_val, c_val
            changed += 1

        elif in_candidate and not in_baseline:
            drift_type = DriftType.ADDED
            old_v, new_v = None, candidate_flat[field]
            added += 1

        else:
            drift_type = DriftType.REMOVED
            old_v, new_v = baseline_flat[field], None
            removed += 1

        severity = _classify_severity(field, drift_type, old_v, new_v)
        evidence = _build_evidence(field, drift_type, severity, old_v, new_v)
        counts[severity] += 1

        findings.append(
            DriftFinding(
                id=_make_id(),
                tenant_id=tenant_id,
                baseline_version=baseline_version,
                candidate_version=candidate_version,
                drift_type=drift_type,
                field=field,
                old_value=old_v,
                new_value=new_v,
                severity=severity,
                evidence=evidence,
            )
        )

    summary = DriftSummary(
        total_findings=added + removed + changed,
        added=added,
        removed=removed,
        changed=changed,
        unchanged=unchanged,
        critical=counts[DriftSeverity.CRITICAL],
        high=counts[DriftSeverity.HIGH],
        medium=counts[DriftSeverity.MEDIUM],
        low=counts[DriftSeverity.LOW],
    )

    tenant_name = baseline.get("tenant_name") or candidate.get("tenant_name", "Unknown")

    return DriftReport(
        tenant_id=tenant_id,
        tenant_name=str(tenant_name),
        baseline_version=baseline_version,
        candidate_version=candidate_version,
        summary=summary,
        findings=findings,
    )
