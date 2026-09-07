"""
Before/After Experiment
========================
Reproducible experiment demonstrating configuration issues detected by the analyser
compared to a simulated manual/checklist method.

DATA NOTE: All scenarios are SYNTHETIC — created specifically to demonstrate
detection capability. They are NOT drawn from real university incident data.

Definitions
-----------
  TP  = analyser correctly flags a real issue as HIGH or CRITICAL
  TN  = no real issues present AND no actionable (HIGH/CRITICAL) findings
  FP  = analyser flags HIGH/CRITICAL when there are no real issues
  FN  = real issue present BUT analyser did NOT flag it as HIGH/CRITICAL

Definition of 'avoided'
-----------------------
An issue is counted as 'avoided' ONLY when:
  1. The analyser detects it as HIGH or CRITICAL before deployment.
  2. The manual/checklist method did NOT catch it.
  3. The scenario records that the config would otherwise have proceeded
     to deployment without that detection.
"""
import copy
from typing import Any, Dict, List
from engine.drift_detector import compare_configurations
from engine.baseline_store import load_baseline


# ─────────────────────────────────────────────────────────────────────────────
# Synthetic upgrade scenarios
# ─────────────────────────────────────────────────────────────────────────────

SCENARIOS: List[Dict[str, Any]] = [
    {
        "id": "EXP-001",
        "description": "[SYNTHETIC] Attendance threshold raised during upgrade — students who passed v1 would fail v2 eligibility",
        "notes": "Manual checklist focused on feature flags only; missed the numeric threshold change.",
        "baseline_tenant": "UNI-001",
        "baseline_version": "v1.0",
        "candidate_version": "upgrade-1.1",
        "candidate_overrides": {
            "modules": {
                "attendance": {
                    "enabled": True,
                    "minimum_attendance": 75,
                    "exam_eligibility_attendance": 85,
                }
            }
        },
        "ground_truth_issues": [
            "modules.attendance.exam_eligibility_attendance raised from 75 to 85"
        ],
        "manual_catches": [],  # Manual review missed this nested numeric change
    },
    {
        "id": "EXP-002",
        "description": "[SYNTHETIC] Fees module accidentally disabled during upgrade — certificate clearance breaks",
        "notes": "Manual review caught the boolean change but not the downstream certificate dependency impact.",
        "baseline_tenant": "UNI-001",
        "baseline_version": "v1.0",
        "candidate_version": "upgrade-1.2",
        "candidate_overrides": {
            "modules": {
                "fees": {
                    "enabled": False,
                    "payment_required_before_admission": False,
                    "grace_period_days": 30,
                    "late_fee_applicable": True,
                }
            }
        },
        "ground_truth_issues": [
            "modules.fees.enabled changed from true to false"
        ],
        "manual_catches": [
            "modules.fees.enabled changed from true to false"
        ],  # Manual review caught this obvious boolean change
    },
    {
        "id": "EXP-003",
        "description": "[SYNTHETIC] Online payment flag disabled while payment-before-admission still required",
        "notes": "Manual review applied per-section checklist without cross-checking flags against module settings.",
        "baseline_tenant": "UNI-003",
        "baseline_version": "v1.0",
        "candidate_version": "upgrade-1.1",
        "candidate_overrides": {
            "feature_flags": {
                "online_payment": False,
                "digital_certificate": False,
                "self_registration": True,
                "bulk_upload": False,
            }
        },
        "ground_truth_issues": [
            "feature_flags.online_payment changed from true to false"
        ],
        "manual_catches": [],  # Manual review did not cross-check flag+module combinations
    },
    {
        "id": "EXP-004",
        "description": "[SYNTHETIC] Clean upgrade — eligibility percentage unchanged, no policy issues",
        "notes": "Tests that the clean scenario produces no false positives for unchanged fields.",
        "baseline_tenant": "UNI-002",
        "baseline_version": "v1.0",
        "candidate_version": "upgrade-1.1",
        "candidate_overrides": {},  # No changes — candidate identical to baseline
        "ground_truth_issues": [],  # No real issues
        "manual_catches": [],
    },
]


def _deep_merge(base: Dict[str, Any], overrides: Dict[str, Any]) -> Dict[str, Any]:
    """Deep merge overrides into base dict without mutating base."""
    result = copy.deepcopy(base)
    for k, v in overrides.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = _deep_merge(result[k], v)
        else:
            result[k] = v
    return result


def run_experiment() -> Dict[str, Any]:
    """
    Run the before/after experiment across all synthetic scenarios.
    Returns structured results with per-scenario detail and aggregate metrics.
    """
    scenario_results = []
    total_tp = total_fp = total_fn = total_tn = 0
    total_detected = 0
    total_avoided = 0

    for scenario in SCENARIOS:
        baseline_raw = load_baseline(
            scenario["baseline_tenant"],
            scenario["baseline_version"],
        )
        if baseline_raw is None:
            scenario_results.append({
                "id": scenario["id"],
                "error": (
                    f"Baseline not found: {scenario['baseline_tenant']} "
                    f"version='{scenario['baseline_version']}'"
                ),
            })
            continue

        # Build candidate by merging overrides into the baseline
        candidate = _deep_merge(baseline_raw, scenario["candidate_overrides"])
        candidate["version"] = scenario["candidate_version"]

        # Run drift analysis
        drift_report = compare_configurations(
            baseline=baseline_raw,
            candidate=candidate,
            tenant_id=scenario["baseline_tenant"],
            baseline_version=scenario["baseline_version"],
            candidate_version=scenario["candidate_version"],
        )

        # Actionable findings = HIGH or CRITICAL
        actionable_findings = [
            f for f in drift_report.findings
            if f.severity in ("CRITICAL", "HIGH")
        ]

        ground_truth = scenario["ground_truth_issues"]
        manual_catches = scenario["manual_catches"]

        # TP: analyser found actionable drift when real issues exist
        tp = len(actionable_findings) if ground_truth else 0
        # FN: real issues that analyser did NOT detect as HIGH/CRITICAL
        fn = max(0, len(ground_truth) - tp)
        # FP: actionable findings when there are no real issues
        fp = len(actionable_findings) if not ground_truth else 0
        # TN: no real issues AND no actionable findings
        tn = 1 if (not ground_truth and not actionable_findings) else 0

        # Avoided: detected by analyser AND missed by manual review
        avoided_issues = [i for i in ground_truth if i not in manual_catches]
        avoided_count = tp if avoided_issues else 0

        total_tp += tp
        total_fp += fp
        total_fn += fn
        total_tn += tn
        total_detected += len(actionable_findings)
        total_avoided += avoided_count

        scenario_results.append({
            "id": scenario["id"],
            "description": scenario["description"],
            "notes": scenario["notes"],
            "baseline": f"{scenario['baseline_tenant']} {scenario['baseline_version']}",
            "candidate_version": scenario["candidate_version"],
            "ground_truth_issues": ground_truth,
            "manual_catches": manual_catches,
            "drift_findings_total": drift_report.summary.total_findings,
            "drift_findings_actionable": len(actionable_findings),
            "actionable_findings": [
                {
                    "field": f.field,
                    "drift_type": f.drift_type,
                    "severity": f.severity,
                    "old_value": f.old_value,
                    "new_value": f.new_value,
                    "reason": f.evidence.reason,
                    "recommendation": f.evidence.recommendation,
                }
                for f in actionable_findings
            ],
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "tn": tn,
            "avoided": avoided_count,
            "avoided_issues": avoided_issues,
        })

    precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else None
    recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else None
    f1 = (
        2 * precision * recall / (precision + recall)
        if precision is not None and recall is not None and (precision + recall) > 0
        else None
    )

    return {
        "experiment_label": "Before/After Upgrade Experiment",
        "data_note": "All scenarios use SYNTHETIC data created for demonstration purposes. Not drawn from real incident data.",
        "definition_of_avoided": (
            "An issue is counted as avoided only when: "
            "(1) the analyser detects it as HIGH or CRITICAL before deployment, "
            "(2) the manual/checklist method did NOT catch it, "
            "(3) the scenario records that the config would otherwise have proceeded to deployment."
        ),
        "total_scenarios": len(SCENARIOS),
        "total_tp": total_tp,
        "total_fp": total_fp,
        "total_fn": total_fn,
        "total_tn": total_tn,
        "total_detected": total_detected,
        "total_avoided": total_avoided,
        "precision": round(precision, 3) if precision is not None else None,
        "recall": round(recall, 3) if recall is not None else None,
        "f1": round(f1, 3) if f1 is not None else None,
        "scenarios": scenario_results,
    }
