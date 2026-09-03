"""
Conflict Detection Engine
--------------------------
Implements Rule-Based Conflict Detection for 5 conflict categories.
Each detector function returns a list of raw conflict dicts that are
later enriched by the severity classifier and evidence generator.
"""
import uuid
from typing import Any, Dict, List, Optional
from models.config_model import TenantConfig
from models.conflict_model import Conflict, ConflictType, Severity


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _make_id() -> str:
    return str(uuid.uuid4())[:8]


def _get(raw: Dict[str, Any], *keys) -> Optional[Any]:
    """Safely navigate nested dict."""
    node = raw
    for k in keys:
        if not isinstance(node, dict):
            return None
        node = node.get(k)
    return node


# ─────────────────────────────────────────────────────────────────────────────
# 1. DIRECT RULE CONFLICT
#    e.g. attendance.minimum_attendance vs attendance.exam_eligibility_attendance
# ─────────────────────────────────────────────────────────────────────────────

def detect_direct_rule_conflicts(raw: Dict[str, Any]) -> List[Dict]:
    conflicts = []

    att = raw.get("modules", {}).get("attendance", {}) or {}
    min_att = att.get("minimum_attendance")
    exam_att = att.get("exam_eligibility_attendance")

    if (
        min_att is not None
        and exam_att is not None
        and isinstance(min_att, (int, float))
        and isinstance(exam_att, (int, float))
        and exam_att > min_att
    ):
        conflicts.append(
            {
                "id": _make_id(),
                "conflict_type": ConflictType.DIRECT_RULE_CONFLICT,
                "module": "attendance",
                "title": "Attendance Threshold Mismatch",
                "description": (
                    f"minimum_attendance ({min_att}%) is less than "
                    f"exam_eligibility_attendance ({exam_att}%). "
                    "Students can meet the attendance requirement yet still be "
                    "ineligible for exams — a direct policy contradiction."
                ),
                "fields_involved": [
                    "modules.attendance.minimum_attendance",
                    "modules.attendance.exam_eligibility_attendance",
                ],
                "rule_a": "modules.attendance.minimum_attendance",
                "rule_b": "modules.attendance.exam_eligibility_attendance",
                "value_a": min_att,
                "value_b": exam_att,
                "why_conflict": (
                    "Both values govern examination eligibility via attendance. "
                    "When exam threshold > minimum threshold, students who satisfy "
                    "the minimum cannot enrol for exams, making the minimum_attendance "
                    "rule meaningless and creating confusion in student-service decisions."
                ),
                "recommendation": (
                    "Align exam_eligibility_attendance ≤ minimum_attendance, "
                    "or remove the minimum_attendance field and rely solely on "
                    "exam_eligibility_attendance."
                ),
            }
        )

    # Admissions eligibility vs attendance eligibility cross-module
    adm = raw.get("modules", {}).get("admissions", {}) or {}
    adm_exam_att = adm.get("exam_eligibility_attendance")
    att_exam_att = att.get("exam_eligibility_attendance")

    if (
        adm_exam_att is not None
        and att_exam_att is not None
        and isinstance(adm_exam_att, (int, float))
        and isinstance(att_exam_att, (int, float))
        and adm_exam_att != att_exam_att
    ):
        conflicts.append(
            {
                "id": _make_id(),
                "conflict_type": ConflictType.DIRECT_RULE_CONFLICT,
                "module": "admissions / attendance",
                "title": "Cross-Module Exam Eligibility Attendance Mismatch",
                "description": (
                    f"admissions.exam_eligibility_attendance ({adm_exam_att}%) differs from "
                    f"attendance.exam_eligibility_attendance ({att_exam_att}%). "
                    "The system cannot consistently evaluate exam eligibility."
                ),
                "fields_involved": [
                    "modules.admissions.exam_eligibility_attendance",
                    "modules.attendance.exam_eligibility_attendance",
                ],
                "rule_a": "modules.admissions.exam_eligibility_attendance",
                "rule_b": "modules.attendance.exam_eligibility_attendance",
                "value_a": adm_exam_att,
                "value_b": att_exam_att,
                "why_conflict": (
                    "Two modules define the same concept with different values. "
                    "The system has no deterministic way to choose which to apply."
                ),
                "recommendation": (
                    "Consolidate exam eligibility attendance into a single authoritative module "
                    "and reference it from the other module."
                ),
            }
        )

    return conflicts


# ─────────────────────────────────────────────────────────────────────────────
# 2. FEATURE FLAG CONFLICT
#    e.g. online_payment=false + payment_required_before_admission=true
# ─────────────────────────────────────────────────────────────────────────────

def detect_feature_flag_conflicts(raw: Dict[str, Any]) -> List[Dict]:
    conflicts = []

    ff = raw.get("feature_flags", {}) or {}
    fees = raw.get("modules", {}).get("fees", {}) or {}
    certs = raw.get("modules", {}).get("certificates", {}) or {}

    # online_payment disabled but payment_required_before_admission = True
    if ff.get("online_payment") is False and fees.get("payment_required_before_admission") is True:
        conflicts.append(
            {
                "id": _make_id(),
                "conflict_type": ConflictType.FEATURE_FLAG_CONFLICT,
                "module": "feature_flags / fees",
                "title": "Online Payment Disabled but Payment Required Before Admission",
                "description": (
                    "feature_flags.online_payment is FALSE, but "
                    "modules.fees.payment_required_before_admission is TRUE. "
                    "Students cannot complete admission without online payment, "
                    "which has been disabled."
                ),
                "fields_involved": [
                    "feature_flags.online_payment",
                    "modules.fees.payment_required_before_admission",
                ],
                "rule_a": "feature_flags.online_payment",
                "rule_b": "modules.fees.payment_required_before_admission",
                "value_a": False,
                "value_b": True,
                "why_conflict": (
                    "The flag disables the only payment mechanism while the fees module "
                    "mandates payment as a prerequisite to admission, creating an "
                    "unsatisfiable student workflow."
                ),
                "recommendation": (
                    "Either enable online_payment or remove the payment-before-admission "
                    "requirement, or provide an alternative offline payment flow."
                ),
            }
        )

    # digital_certificate disabled but certificates module enabled with digital_signature_required
    if ff.get("digital_certificate") is False and certs.get("digital_signature_required") is True:
        conflicts.append(
            {
                "id": _make_id(),
                "conflict_type": ConflictType.FEATURE_FLAG_CONFLICT,
                "module": "feature_flags / certificates",
                "title": "Digital Certificate Disabled but Digital Signature Required",
                "description": (
                    "feature_flags.digital_certificate is FALSE, but "
                    "modules.certificates.digital_signature_required is TRUE. "
                    "Digital signing cannot proceed when the feature flag is off."
                ),
                "fields_involved": [
                    "feature_flags.digital_certificate",
                    "modules.certificates.digital_signature_required",
                ],
                "rule_a": "feature_flags.digital_certificate",
                "rule_b": "modules.certificates.digital_signature_required",
                "value_a": False,
                "value_b": True,
                "why_conflict": (
                    "The feature flag gates the entire digital certificate pipeline. "
                    "Requiring a digital signature when that pipeline is disabled is contradictory."
                ),
                "recommendation": (
                    "Enable digital_certificate flag or set digital_signature_required to false."
                ),
            }
        )

    return conflicts


# ─────────────────────────────────────────────────────────────────────────────
# 3. DEPENDENCY CONFLICT
#    e.g. certificates enabled + fee_clearance_required=true, but fees disabled
# ─────────────────────────────────────────────────────────────────────────────

def detect_dependency_conflicts(raw: Dict[str, Any]) -> List[Dict]:
    conflicts = []

    mods = raw.get("modules", {}) or {}
    fees = mods.get("fees", {}) or {}
    certs = mods.get("certificates", {}) or {}
    att = mods.get("attendance", {}) or {}
    adm = mods.get("admissions", {}) or {}

    fees_enabled = fees.get("enabled", False)
    attendance_enabled = att.get("enabled", False)
    certs_enabled = certs.get("enabled", False)
    adm_enabled = adm.get("enabled", False)

    # Certificates requires fee clearance but fees is disabled
    if (
        certs_enabled
        and certs.get("fee_clearance_required") is True
        and not fees_enabled
    ):
        conflicts.append(
            {
                "id": _make_id(),
                "conflict_type": ConflictType.DEPENDENCY_CONFLICT,
                "module": "certificates / fees",
                "title": "Certificate Fee Clearance Depends on Disabled Fees Module",
                "description": (
                    "modules.certificates.fee_clearance_required is TRUE, but "
                    "modules.fees.enabled is FALSE. "
                    "Fee clearance cannot be verified when the fees module is disabled."
                ),
                "fields_involved": [
                    "modules.certificates.fee_clearance_required",
                    "modules.fees.enabled",
                ],
                "rule_a": "modules.certificates.fee_clearance_required",
                "rule_b": "modules.fees.enabled",
                "value_a": True,
                "value_b": False,
                "why_conflict": (
                    "The certificates module depends on fee status to generate clearance. "
                    "With fees disabled, the system has no data source to determine clearance, "
                    "making certificate issuance impossible or unreliable."
                ),
                "recommendation": (
                    "Enable the fees module, or set fee_clearance_required to false "
                    "if fee clearance is intentionally waived for this tenant."
                ),
            }
        )

    # Certificates requires attendance clearance but attendance is disabled
    if (
        certs_enabled
        and certs.get("attendance_clearance_required") is True
        and not attendance_enabled
    ):
        conflicts.append(
            {
                "id": _make_id(),
                "conflict_type": ConflictType.DEPENDENCY_CONFLICT,
                "module": "certificates / attendance",
                "title": "Certificate Attendance Clearance Depends on Disabled Attendance Module",
                "description": (
                    "modules.certificates.attendance_clearance_required is TRUE, but "
                    "modules.attendance.enabled is FALSE."
                ),
                "fields_involved": [
                    "modules.certificates.attendance_clearance_required",
                    "modules.attendance.enabled",
                ],
                "rule_a": "modules.certificates.attendance_clearance_required",
                "rule_b": "modules.attendance.enabled",
                "value_a": True,
                "value_b": False,
                "why_conflict": (
                    "Attendance data is required to evaluate clearance, "
                    "but the module providing that data is disabled."
                ),
                "recommendation": (
                    "Enable the attendance module or set attendance_clearance_required to false."
                ),
            }
        )

    # Fees requires payment before admission, but admissions is disabled
    if (
        fees_enabled
        and fees.get("payment_required_before_admission") is True
        and not adm_enabled
    ):
        conflicts.append(
            {
                "id": _make_id(),
                "conflict_type": ConflictType.DEPENDENCY_CONFLICT,
                "module": "fees / admissions",
                "title": "Fee Payment Prerequisite Depends on Disabled Admissions Module",
                "description": (
                    "modules.fees.payment_required_before_admission is TRUE, but "
                    "modules.admissions.enabled is FALSE. "
                    "The prerequisite condition references a non-operational module."
                ),
                "fields_involved": [
                    "modules.fees.payment_required_before_admission",
                    "modules.admissions.enabled",
                ],
                "rule_a": "modules.fees.payment_required_before_admission",
                "rule_b": "modules.admissions.enabled",
                "value_a": True,
                "value_b": False,
                "why_conflict": (
                    "The fees module expects an admissions process to gate payment, "
                    "but no admission workflow exists."
                ),
                "recommendation": (
                    "Enable the admissions module or remove the payment_required_before_admission constraint."
                ),
            }
        )

    return conflicts


# ─────────────────────────────────────────────────────────────────────────────
# 4. DUPLICATE / CONTRADICTORY RULE
#    e.g. same module repeats equivalent keys with different values
# ─────────────────────────────────────────────────────────────────────────────

def detect_duplicate_contradictory_rules(raw: Dict[str, Any]) -> List[Dict]:
    """
    Detect cases where logically equivalent or semantically overlapping rules
    have contradictory values within the same tenant config.
    """
    conflicts = []

    att = raw.get("modules", {}).get("attendance", {}) or {}
    adm = raw.get("modules", {}).get("admissions", {}) or {}

    # If both minimum_attendance and exam_eligibility_attendance exist and are equal,
    # one is redundant (low-severity duplicate).
    min_att = att.get("minimum_attendance")
    exam_att = att.get("exam_eligibility_attendance")
    if (
        min_att is not None
        and exam_att is not None
        and isinstance(min_att, (int, float))
        and isinstance(exam_att, (int, float))
        and min_att == exam_att
    ):
        conflicts.append(
            {
                "id": _make_id(),
                "conflict_type": ConflictType.DUPLICATE_OR_CONTRADICTORY_RULE,
                "module": "attendance",
                "title": "Duplicate Attendance Threshold Fields",
                "description": (
                    f"minimum_attendance and exam_eligibility_attendance are both set to {min_att}%. "
                    "These fields represent the same threshold and one is redundant."
                ),
                "fields_involved": [
                    "modules.attendance.minimum_attendance",
                    "modules.attendance.exam_eligibility_attendance",
                ],
                "rule_a": "modules.attendance.minimum_attendance",
                "rule_b": "modules.attendance.exam_eligibility_attendance",
                "value_a": min_att,
                "value_b": exam_att,
                "why_conflict": (
                    "Maintaining two fields with identical semantics creates maintenance risk. "
                    "A future update to one might miss the other, introducing a hidden direct conflict."
                ),
                "recommendation": (
                    "Remove one field and standardise on a single authoritative attendance threshold."
                ),
            }
        )

    # fee-related duplication: late_fee_applicable=false but grace_period_days > 0
    fees = raw.get("modules", {}).get("fees", {}) or {}
    late_fee = fees.get("late_fee_applicable")
    grace = fees.get("grace_period_days")
    if (
        late_fee is False
        and grace is not None
        and isinstance(grace, int)
        and grace > 0
    ):
        conflicts.append(
            {
                "id": _make_id(),
                "conflict_type": ConflictType.DUPLICATE_OR_CONTRADICTORY_RULE,
                "module": "fees",
                "title": "Late Fee Disabled but Grace Period Configured",
                "description": (
                    f"late_fee_applicable is FALSE but grace_period_days is set to {grace} days. "
                    "A grace period is only meaningful if late fees can be applied."
                ),
                "fields_involved": [
                    "modules.fees.late_fee_applicable",
                    "modules.fees.grace_period_days",
                ],
                "rule_a": "modules.fees.late_fee_applicable",
                "rule_b": "modules.fees.grace_period_days",
                "value_a": False,
                "value_b": grace,
                "why_conflict": (
                    "The grace period exists to delay late fees. If late fees cannot be applied, "
                    "the grace_period_days setting has no operational effect and implies a "
                    "contradictory intent."
                ),
                "recommendation": (
                    "Either enable late_fee_applicable or remove grace_period_days to "
                    "eliminate ambiguity."
                ),
            }
        )

    return conflicts


# ─────────────────────────────────────────────────────────────────────────────
# 5. INVALID CONFIGURATION
#    Propagate validation errors as INVALID_CONFIGURATION conflicts
# ─────────────────────────────────────────────────────────────────────────────

def detect_invalid_configurations(raw: Dict[str, Any], validation_errors) -> List[Dict]:
    conflicts = []
    for err in validation_errors:
        conflicts.append(
            {
                "id": _make_id(),
                "conflict_type": ConflictType.INVALID_CONFIGURATION,
                "module": err.field.split(".")[1] if "." in err.field else "general",
                "title": f"Invalid Configuration: {err.field}",
                "description": err.message,
                "fields_involved": [err.field],
                "rule_a": err.field,
                "rule_b": None,
                "value_a": None,
                "value_b": None,
                "why_conflict": (
                    "An invalid configuration value can cause runtime errors, "
                    "incorrect business logic, or deployment failure."
                ),
                "recommendation": (
                    f"Correct the field '{err.field}' before deploying this configuration."
                ),
                "_severity_override": err.severity,
            }
        )
    return conflicts


# ─────────────────────────────────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────────────────────────────────

def run_all_detectors(raw: Dict[str, Any], validation_errors=None) -> List[Dict]:
    """
    Run all 5 conflict detectors and return a combined list of raw conflict dicts.
    """
    if validation_errors is None:
        validation_errors = []

    all_conflicts: List[Dict] = []
    all_conflicts.extend(detect_direct_rule_conflicts(raw))
    all_conflicts.extend(detect_feature_flag_conflicts(raw))
    all_conflicts.extend(detect_dependency_conflicts(raw))
    all_conflicts.extend(detect_duplicate_contradictory_rules(raw))
    all_conflicts.extend(detect_invalid_configurations(raw, validation_errors))
    return all_conflicts
