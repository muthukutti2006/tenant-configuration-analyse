"""
Configuration Validator
-----------------------
Validates field presence, types, and value ranges in a parsed TenantConfig.
Returns a list of ValidationError items.
"""
from typing import List, Dict, Any, Optional
from models.conflict_model import ValidationError, Severity


def validate_config(raw: Dict[str, Any]) -> List[ValidationError]:
    """
    Validate a raw configuration dict.
    Returns list of ValidationError.  Empty list = valid.
    """
    errors: List[ValidationError] = []

    # ── Percentage fields that must be in [0, 100] ──────────────────────────
    PERCENTAGE_FIELDS = {
        "modules.admissions.minimum_eligibility_percentage": (
            raw.get("modules", {}).get("admissions", {}) or {}
        ).get("minimum_eligibility_percentage"),
        "modules.admissions.exam_eligibility_attendance": (
            raw.get("modules", {}).get("admissions", {}) or {}
        ).get("exam_eligibility_attendance"),
        "modules.attendance.minimum_attendance": (
            raw.get("modules", {}).get("attendance", {}) or {}
        ).get("minimum_attendance"),
        "modules.attendance.exam_eligibility_attendance": (
            raw.get("modules", {}).get("attendance", {}) or {}
        ).get("exam_eligibility_attendance"),
    }

    for field_path, value in PERCENTAGE_FIELDS.items():
        if value is not None:
            if not isinstance(value, (int, float)):
                errors.append(
                    ValidationError(
                        field=field_path,
                        message=f"Expected a numeric value, got {type(value).__name__}.",
                        severity=Severity.CRITICAL,
                    )
                )
            elif value < 0 or value > 100:
                # EDGE CASE 4: Invalid threshold (> 100 or < 0)
                errors.append(
                    ValidationError(
                        field=field_path,
                        message=(
                            f"Percentage value {value} is out of valid range [0, 100]."
                        ),
                        severity=Severity.CRITICAL,
                    )
                )

    # ── Boolean fields that must actually be bool ───────────────────────────
    BOOL_PATHS = [
        ("modules.admissions.enabled", raw.get("modules", {}).get("admissions"), "enabled"),
        ("modules.fees.enabled", raw.get("modules", {}).get("fees"), "enabled"),
        ("modules.fees.payment_required_before_admission", raw.get("modules", {}).get("fees"), "payment_required_before_admission"),
        ("modules.attendance.enabled", raw.get("modules", {}).get("attendance"), "enabled"),
        ("modules.certificates.enabled", raw.get("modules", {}).get("certificates"), "enabled"),
        ("modules.certificates.fee_clearance_required", raw.get("modules", {}).get("certificates"), "fee_clearance_required"),
    ]
    for field_path, parent, key in BOOL_PATHS:
        if parent and key in parent:
            val = parent[key]
            if not isinstance(val, bool):
                errors.append(
                    ValidationError(
                        field=field_path,
                        message=f"Expected boolean, got {type(val).__name__} with value '{val}'.",
                        severity=Severity.HIGH,
                    )
                )

    # ── Version string must be non-empty ────────────────────────────────────
    version = raw.get("version", "")
    if not version or not isinstance(version, str):
        errors.append(
            ValidationError(
                field="version",
                message="'version' must be a non-empty string.",
                severity=Severity.MEDIUM,
            )
        )

    # ── tenant_id format ────────────────────────────────────────────────────
    tid = raw.get("tenant_id", "")
    if not tid or not isinstance(tid, str) or len(tid.strip()) == 0:
        errors.append(
            ValidationError(
                field="tenant_id",
                message="'tenant_id' must be a non-empty string.",
                severity=Severity.CRITICAL,
            )
        )

    # ── Modules must each have 'enabled' boolean ────────────────────────────
    modules = raw.get("modules", {})
    known_modules = ["admissions", "fees", "attendance", "certificates"]
    for mod_name in known_modules:
        mod = modules.get(mod_name)
        if mod is None:
            continue  # Optional module — not present is fine
        if not isinstance(mod, dict):
            errors.append(
                ValidationError(
                    field=f"modules.{mod_name}",
                    message=f"Module '{mod_name}' must be an object.",
                    severity=Severity.CRITICAL,
                )
            )
            continue
        if "enabled" not in mod:
            errors.append(
                ValidationError(
                    field=f"modules.{mod_name}.enabled",
                    message=f"Module '{mod_name}' is missing required 'enabled' field.",
                    severity=Severity.HIGH,
                )
            )

    return errors
