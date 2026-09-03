"""
Rule Normalizer
---------------
Flattens a parsed TenantConfig into a canonical list of
(key, value) rule tuples for uniform processing by the conflict detector.
"""
from typing import Any, Dict, List, Tuple
from models.config_model import TenantConfig


NormalizedRule = Dict[str, Any]


def normalize_rules(config: TenantConfig) -> List[NormalizedRule]:
    """
    Flatten all configuration settings into a list of normalized rule dicts.
    Each rule has: module, key, value, path.
    """
    rules: List[NormalizedRule] = []

    mods = config.modules

    def _add(module: str, key: str, value: Any) -> None:
        rules.append(
            {
                "module": module,
                "key": key,
                "value": value,
                "path": f"modules.{module}.{key}",
            }
        )

    def _add_flag(key: str, value: Any) -> None:
        rules.append(
            {
                "module": "feature_flags",
                "key": key,
                "value": value,
                "path": f"feature_flags.{key}",
            }
        )

    # Admissions
    if mods.admissions:
        adm = mods.admissions
        _add("admissions", "enabled", adm.enabled)
        if adm.minimum_eligibility_percentage is not None:
            _add("admissions", "minimum_eligibility_percentage", adm.minimum_eligibility_percentage)
        if adm.exam_eligibility_attendance is not None:
            _add("admissions", "exam_eligibility_attendance", adm.exam_eligibility_attendance)
        if adm.merit_based_selection is not None:
            _add("admissions", "merit_based_selection", adm.merit_based_selection)

    # Fees
    if mods.fees:
        fee = mods.fees
        _add("fees", "enabled", fee.enabled)
        if fee.payment_required_before_admission is not None:
            _add("fees", "payment_required_before_admission", fee.payment_required_before_admission)
        if fee.grace_period_days is not None:
            _add("fees", "grace_period_days", fee.grace_period_days)
        if fee.late_fee_applicable is not None:
            _add("fees", "late_fee_applicable", fee.late_fee_applicable)

    # Attendance
    if mods.attendance:
        att = mods.attendance
        _add("attendance", "enabled", att.enabled)
        if att.minimum_attendance is not None:
            _add("attendance", "minimum_attendance", att.minimum_attendance)
        if att.exam_eligibility_attendance is not None:
            _add("attendance", "exam_eligibility_attendance", att.exam_eligibility_attendance)
        if att.attendance_grace_period is not None:
            _add("attendance", "attendance_grace_period", att.attendance_grace_period)

    # Certificates
    if mods.certificates:
        cert = mods.certificates
        _add("certificates", "enabled", cert.enabled)
        if cert.fee_clearance_required is not None:
            _add("certificates", "fee_clearance_required", cert.fee_clearance_required)
        if cert.attendance_clearance_required is not None:
            _add("certificates", "attendance_clearance_required", cert.attendance_clearance_required)
        if cert.digital_signature_required is not None:
            _add("certificates", "digital_signature_required", cert.digital_signature_required)

    # Feature flags
    if config.feature_flags:
        ff = config.feature_flags
        if ff.online_payment is not None:
            _add_flag("online_payment", ff.online_payment)
        if ff.digital_certificate is not None:
            _add_flag("digital_certificate", ff.digital_certificate)
        if ff.self_registration is not None:
            _add_flag("self_registration", ff.self_registration)
        if ff.bulk_upload is not None:
            _add_flag("bulk_upload", ff.bulk_upload)
        if ff.api_integration is not None:
            _add_flag("api_integration", ff.api_integration)

    return rules


def build_rule_index(rules: List[NormalizedRule]) -> Dict[str, Any]:
    """Build a dict: path -> value for O(1) lookups."""
    return {r["path"]: r["value"] for r in rules}
