"""
Evidence Generator
-------------------
Produces human-readable evidence reports for HIGH and CRITICAL conflicts.
Evidence is already embedded inside each Conflict by the classifier,
but this module provides a standalone structured evidence report.
"""
from typing import List
from models.conflict_model import Conflict, Severity


def generate_evidence_report(conflicts: List[Conflict]) -> List[dict]:
    """
    Return a structured list of evidence reports for conflicts that require
    evidence (HIGH or CRITICAL severity).
    """
    reports = []
    for c in conflicts:
        if c.severity not in (Severity.HIGH, Severity.CRITICAL):
            continue
        if c.evidence is None:
            continue

        ev = c.evidence
        report = {
            "conflict_id": c.id,
            "title": c.title,
            "tenant_id": ev.tenant_id,
            "module": ev.module,
            "severity": ev.severity.value,
            "conflict_type": ev.conflict_type.value,
            "evidence": {
                "rule_a": {
                    "field": ev.rule_a,
                    "value": ev.value_a,
                },
                "rule_b": {
                    "field": ev.rule_b,
                    "value": ev.value_b,
                }
                if ev.rule_b
                else None,
                "explanation": ev.explanation,
                "why_this_is_a_conflict": ev.why_conflict,
                "recommendation": ev.recommendation,
            },
        }
        reports.append(report)

    return reports
