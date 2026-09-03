"""
Severity Classifier
--------------------
Assigns CRITICAL / HIGH / MEDIUM / LOW severity to each raw conflict dict.

DOCUMENTED SEVERITY POLICY:
────────────────────────────────────────────────────────────────────────────
CRITICAL  Configuration causes major incorrect business behavior or
          deployment failure. Invalid configuration that prevents the
          system from operating correctly.

HIGH      Conflicting rules affect important student-service decisions
          (admission, exam eligibility, payment, certificate issuance).

MEDIUM    Potential inconsistent behavior with limited operational impact.
          Redundant rules, minor contradictions.

LOW       Minor configuration inconsistency or advisory warning.
────────────────────────────────────────────────────────────────────────────
"""
from typing import Dict, List
from models.conflict_model import Conflict, ConflictType, Severity, Evidence


# Severity mapping per conflict type (default; can be overridden per rule)
_DEFAULT_SEVERITY: Dict[ConflictType, Severity] = {
    ConflictType.DIRECT_RULE_CONFLICT: Severity.HIGH,
    ConflictType.FEATURE_FLAG_CONFLICT: Severity.HIGH,
    ConflictType.DEPENDENCY_CONFLICT: Severity.CRITICAL,
    ConflictType.DUPLICATE_OR_CONTRADICTORY_RULE: Severity.MEDIUM,
    ConflictType.INVALID_CONFIGURATION: Severity.CRITICAL,
}

# Specific title-based overrides for fine-grained classification
_TITLE_OVERRIDES: Dict[str, Severity] = {
    "Duplicate Attendance Threshold Fields": Severity.LOW,
    "Late Fee Disabled but Grace Period Configured": Severity.MEDIUM,
    "Online Payment Disabled but Payment Required Before Admission": Severity.HIGH,
    "Digital Certificate Disabled but Digital Signature Required": Severity.MEDIUM,
    "Attendance Threshold Mismatch": Severity.HIGH,
    "Cross-Module Exam Eligibility Attendance Mismatch": Severity.HIGH,
    "Certificate Fee Clearance Depends on Disabled Fees Module": Severity.CRITICAL,
    "Certificate Attendance Clearance Depends on Disabled Attendance Module": Severity.CRITICAL,
    "Fee Payment Prerequisite Depends on Disabled Admissions Module": Severity.HIGH,
}


def classify_severity(raw_conflict: Dict) -> Severity:
    """
    Determine severity for a raw conflict dict.
    Priority: explicit _severity_override > title-based override > type default.
    """
    if "_severity_override" in raw_conflict:
        return raw_conflict["_severity_override"]

    title = raw_conflict.get("title", "")
    if title in _TITLE_OVERRIDES:
        return _TITLE_OVERRIDES[title]

    conflict_type = raw_conflict.get("conflict_type", ConflictType.INVALID_CONFIGURATION)
    return _DEFAULT_SEVERITY.get(conflict_type, Severity.MEDIUM)


def build_conflicts(raw_conflicts: List[Dict], tenant_id: str) -> List[Conflict]:
    """
    Convert raw conflict dicts into Conflict model instances with severity assigned.
    """
    conflicts: List[Conflict] = []
    for rc in raw_conflicts:
        severity = classify_severity(rc)
        # Build evidence for HIGH and CRITICAL
        evidence = None
        if severity in (Severity.HIGH, Severity.CRITICAL):
            evidence = Evidence(
                tenant_id=tenant_id,
                module=rc["module"],
                rule_a=rc.get("rule_a", rc["fields_involved"][0] if rc["fields_involved"] else ""),
                rule_b=rc.get("rule_b"),
                value_a=rc.get("value_a"),
                value_b=rc.get("value_b"),
                conflict_type=rc["conflict_type"],
                severity=severity,
                explanation=rc["description"],
                why_conflict=rc.get("why_conflict", ""),
                recommendation=rc.get("recommendation", "Review before deployment."),
            )

        conflict = Conflict(
            id=rc["id"],
            conflict_type=rc["conflict_type"],
            severity=severity,
            title=rc["title"],
            description=rc["description"],
            module=rc["module"],
            fields_involved=rc["fields_involved"],
            evidence=evidence,
        )
        conflicts.append(conflict)

    return conflicts
