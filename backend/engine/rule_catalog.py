"""
Rule Catalogue
==============
Machine-readable catalogue of all conflict detection, drift detection,
and validation rules.

Each rule has: rule_id, category, name, description, condition, severity,
evidence_template, enabled status, rule_type.

Categories: ATTENDANCE, FEES, FEATURE_FLAGS, DEPENDENCIES, DRIFT, VALIDATION
Rule types: "conflict" | "drift" | "validation"
"""
from typing import List
from pydantic import BaseModel


class CatalogRule(BaseModel):
    rule_id: str
    category: str
    name: str
    description: str
    condition: str
    severity: str
    evidence_template: str
    enabled: bool = True
    rule_type: str  # "conflict" | "drift" | "validation"


_CATALOG: List[CatalogRule] = [
    # ── ATTENDANCE ──────────────────────────────────────────────────────────
    CatalogRule(
        rule_id="R001", category="ATTENDANCE",
        name="Attendance Threshold Mismatch",
        description="minimum_attendance is less than exam_eligibility_attendance within the attendance module.",
        condition="attendance.minimum_attendance < attendance.exam_eligibility_attendance",
        severity="HIGH", rule_type="conflict",
        evidence_template="minimum_attendance={old} < exam_eligibility_attendance={new}: students satisfying attendance cannot sit exams.",
    ),
    CatalogRule(
        rule_id="R002", category="ATTENDANCE",
        name="Cross-Module Exam Eligibility Mismatch",
        description="admissions and attendance modules define different exam attendance thresholds.",
        condition="admissions.exam_eligibility_attendance != attendance.exam_eligibility_attendance",
        severity="HIGH", rule_type="conflict",
        evidence_template="admissions defines {a}%, attendance defines {b}%: system cannot apply a single threshold.",
    ),
    CatalogRule(
        rule_id="R008", category="ATTENDANCE",
        name="Duplicate Attendance Threshold",
        description="minimum_attendance equals exam_eligibility_attendance — one field is redundant.",
        condition="attendance.minimum_attendance == attendance.exam_eligibility_attendance (both present)",
        severity="LOW", rule_type="conflict",
        evidence_template="Both fields equal {val}%: maintaining duplicates creates maintenance risk.",
    ),
    # ── FEES ────────────────────────────────────────────────────────────────
    CatalogRule(
        rule_id="R009", category="FEES",
        name="Grace Period Without Late Fee",
        description="grace_period_days > 0 but late_fee_applicable is false — grace period has no effect.",
        condition="fees.grace_period_days > 0 AND fees.late_fee_applicable == false",
        severity="MEDIUM", rule_type="conflict",
        evidence_template="grace_period_days={days} but late_fee_applicable=false: grace period is meaningless without late fees.",
    ),
    # ── FEATURE FLAGS ────────────────────────────────────────────────────────
    CatalogRule(
        rule_id="R003", category="FEATURE_FLAGS",
        name="Online Payment Disabled but Payment Required",
        description="online_payment flag is false while payment_required_before_admission is true.",
        condition="feature_flags.online_payment == false AND fees.payment_required_before_admission == true",
        severity="HIGH", rule_type="conflict",
        evidence_template="online_payment=false but payment_required=true: students cannot complete admission.",
    ),
    CatalogRule(
        rule_id="R004", category="FEATURE_FLAGS",
        name="Digital Certificate Disabled but Signature Required",
        description="digital_certificate flag is false while digital_signature_required is true.",
        condition="feature_flags.digital_certificate == false AND certificates.digital_signature_required == true",
        severity="MEDIUM", rule_type="conflict",
        evidence_template="digital_certificate=false but digital_signature_required=true: signing pipeline disabled.",
    ),
    # ── DEPENDENCIES ─────────────────────────────────────────────────────────
    CatalogRule(
        rule_id="R005", category="DEPENDENCIES",
        name="Certificate Fee Clearance Without Fees Module",
        description="fee_clearance_required=true but fees module is disabled.",
        condition="certificates.fee_clearance_required == true AND fees.enabled == false",
        severity="CRITICAL", rule_type="conflict",
        evidence_template="fee_clearance_required=true but fees.enabled=false: clearance data unavailable.",
    ),
    CatalogRule(
        rule_id="R006", category="DEPENDENCIES",
        name="Certificate Attendance Clearance Without Attendance Module",
        description="attendance_clearance_required=true but attendance module is disabled.",
        condition="certificates.attendance_clearance_required == true AND attendance.enabled == false",
        severity="CRITICAL", rule_type="conflict",
        evidence_template="attendance_clearance_required=true but attendance.enabled=false: clearance data unavailable.",
    ),
    CatalogRule(
        rule_id="R007", category="DEPENDENCIES",
        name="Fee Payment Before Admission Without Admissions Module",
        description="payment_required_before_admission=true but admissions module is disabled.",
        condition="fees.payment_required_before_admission == true AND admissions.enabled == false",
        severity="HIGH", rule_type="conflict",
        evidence_template="payment_required_before_admission=true but admissions.enabled=false.",
    ),
    # ── VALIDATION ───────────────────────────────────────────────────────────
    CatalogRule(
        rule_id="R010", category="VALIDATION",
        name="Percentage Out of Range",
        description="Any percentage field is outside the valid range [0, 100].",
        condition="value < 0 OR value > 100 for any percentage field",
        severity="CRITICAL", rule_type="validation",
        evidence_template="Field {field}={value} is outside [0, 100].",
    ),
    CatalogRule(
        rule_id="R011", category="VALIDATION",
        name="Invalid Boolean Type",
        description="An expected boolean field contains a non-boolean value.",
        condition="type(value) != bool for a boolean field",
        severity="HIGH", rule_type="validation",
        evidence_template="Field {field}={value!r} is type {type} but expected bool.",
    ),
    CatalogRule(
        rule_id="R012", category="VALIDATION",
        name="Missing enabled Field",
        description="A module present in configuration is missing the required 'enabled' field.",
        condition="'enabled' not in module_config",
        severity="HIGH", rule_type="validation",
        evidence_template="Module '{module}' is present but missing required 'enabled' field.",
    ),
    # ── DRIFT ────────────────────────────────────────────────────────────────
    CatalogRule(
        rule_id="D001", category="DRIFT",
        name="Module Disabled in Upgrade",
        description="A previously enabled module is disabled in the candidate configuration.",
        condition="module.enabled changed from true to false",
        severity="CRITICAL", rule_type="drift",
        evidence_template="{module}.enabled changed from true to false: all dependent workflows break.",
    ),
    CatalogRule(
        rule_id="D002", category="DRIFT",
        name="Attendance Threshold Changed",
        description="minimum_attendance or exam_eligibility_attendance changed from approved baseline.",
        condition="value changed from baseline value",
        severity="HIGH", rule_type="drift",
        evidence_template="{field} changed from {old} to {new}: affects exam eligibility for all students.",
    ),
    CatalogRule(
        rule_id="D003", category="DRIFT",
        name="Payment Behaviour Changed",
        description="payment_required_before_admission changed from approved baseline.",
        condition="value changed from baseline value",
        severity="HIGH", rule_type="drift",
        evidence_template="payment_required_before_admission changed from {old} to {new}.",
    ),
    CatalogRule(
        rule_id="D004", category="DRIFT",
        name="Feature Flag Changed",
        description="An important feature flag changed from the approved baseline.",
        condition="feature_flag value changed",
        severity="MEDIUM", rule_type="drift",
        evidence_template="Feature flag {field} changed from {old} to {new}.",
    ),
    CatalogRule(
        rule_id="D005", category="DRIFT",
        name="Critical Field Removed",
        description="A critical field present in the baseline is missing from the candidate.",
        condition="field present in baseline but absent in candidate",
        severity="CRITICAL", rule_type="drift",
        evidence_template="Field '{field}' (value: {old}) was removed from the configuration.",
    ),
    CatalogRule(
        rule_id="D006", category="DRIFT",
        name="New Field Added",
        description="A field not present in the baseline was added in the candidate.",
        condition="field present in candidate but absent in baseline",
        severity="LOW", rule_type="drift",
        evidence_template="New field '{field}' = {new} added. Verify it is intentional and approved.",
    ),
]


def get_all_rules() -> List[CatalogRule]:
    """Return all rules in the catalogue."""
    return _CATALOG


def get_rules_by_category(category: str) -> List[CatalogRule]:
    """Return rules for a specific category (case-insensitive)."""
    return [r for r in _CATALOG if r.category == category.upper()]


def get_rules_by_severity(severity: str) -> List[CatalogRule]:
    """Return rules matching a severity level (case-insensitive)."""
    return [r for r in _CATALOG if r.severity == severity.upper()]


def get_enabled_rules() -> List[CatalogRule]:
    """Return only enabled rules."""
    return [r for r in _CATALOG if r.enabled]


ALL_CATEGORIES = sorted({r.category for r in _CATALOG})
ALL_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
