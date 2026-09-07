# Before/After Upgrade Experiment

## Purpose

This experiment demonstrates, in a measurable and reproducible way, the difference between:
- **Manual/checklist-based** configuration review (simulated)
- **Automated drift detection** using the Tenant-Configuration Analyser

> **DATA NOTE**: All scenarios are **SYNTHETIC** — created specifically to demonstrate detection capability. They are NOT drawn from real university incident data.

## Definitions

| Term | Definition |
|------|-----------|
| **TP** (True Positive) | Analyser correctly flags a real issue as HIGH or CRITICAL |
| **TN** (True Negative) | No real issues AND no actionable (HIGH/CRITICAL) findings |
| **FP** (False Positive) | Analyser flags HIGH/CRITICAL when there are no real issues |
| **FN** (False Negative) | Real issue exists but analyser did NOT flag it as HIGH/CRITICAL |
| **Avoided** | Detected by analyser as HIGH/CRITICAL AND missed by manual method |

### Strict Definition of "Avoided"

An issue is counted as **avoided** ONLY when all three conditions hold:
1. The analyser detects it as HIGH or CRITICAL **before deployment**
2. The manual/checklist method did **NOT** catch it
3. The scenario records that the configuration **would otherwise have proceeded** to deployment without that detection

## Scenarios

### EXP-001 — Attendance Threshold Raised During Upgrade

| Property | Value |
|----------|-------|
| Baseline | UNI-001 v1.0 |
| Candidate version | upgrade-1.1 |
| Change made | `exam_eligibility_attendance` raised from 75 → 85 |
| Ground-truth issues | `modules.attendance.exam_eligibility_attendance` raised from 75 to 85 |
| Manual review caught | Nothing (checklist focused on feature flags only) |
| Analyser result | **HIGH** drift finding — field is in `_HIGH_CHANGE_FIELDS` |
| Outcome | **1 issue avoided** (analyser detected, manual missed) |

### EXP-002 — Fees Module Accidentally Disabled

| Property | Value |
|----------|-------|
| Baseline | UNI-001 v1.0 |
| Candidate version | upgrade-1.2 |
| Change made | `modules.fees.enabled` changed from true → false |
| Ground-truth issues | Module disabled |
| Manual review caught | The boolean change (obvious boolean flip was noticed) |
| Analyser result | **CRITICAL** drift finding — module `enabled` → disabled |
| Outcome | **0 issues avoided** (manual review caught this one) |

### EXP-003 — Online Payment Flag Disabled, Payment Still Required

| Property | Value |
|----------|-------|
| Baseline | UNI-003 v1.0 |
| Candidate version | upgrade-1.1 |
| Change made | `feature_flags.online_payment` changed from true → false |
| Ground-truth issues | Payment flag disabled while payment-before-admission may be required |
| Manual review caught | Nothing (per-section checklist, no cross-checking) |
| Analyser result | **HIGH** drift finding — `feature_flags.online_payment` in `_HIGH_CHANGE_FIELDS` |
| Outcome | **1 issue avoided** (analyser detected, manual missed) |

### EXP-004 — Clean Upgrade (No Changes)

| Property | Value |
|----------|-------|
| Baseline | UNI-002 v1.0 |
| Candidate version | upgrade-1.1 |
| Change made | None — candidate identical to baseline |
| Ground-truth issues | None |
| Manual review caught | Nothing |
| Analyser result | **0 findings** — no drift detected |
| Outcome | **True Negative** — neither method generated false positives |

## Aggregate Results (from `/api/experiment`)

| Metric | Value | Notes |
|--------|-------|-------|
| Total scenarios | 4 | EXP-001 to EXP-004 |
| Total TP | 2 | EXP-001, EXP-003 |
| Total TN | 1 | EXP-004 |
| Total FP | 0 | No false alarms on clean scenario |
| Total FN | 0 | All real issues were detected |
| Issues avoided | 2 | EXP-001 + EXP-003 (manual missed, analyser caught) |
| Precision | 1.0 | All actionable findings were real issues |
| Recall | 1.0 | All real issues were detected as actionable |
| F1 | 1.0 | Harmonic mean of precision and recall |

> **Note**: Precision/recall of 1.0 is expected in a controlled synthetic experiment designed to demonstrate detection capability. Real-world scenarios would include harder edge cases.

## Engine Module

`backend/engine/experiment.py`:
- `SCENARIOS` list: 4 synthetic scenarios with ground truth and manual catches
- `_deep_merge(base, overrides)`: builds candidate from baseline + overrides
- `run_experiment()`: runs all scenarios, calculates per-scenario and aggregate metrics

## API Endpoint

```
GET /api/experiment
```

Returns the full experiment result with all scenarios, metrics, the `data_note` (SYNTHETIC label), and the `definition_of_avoided`.
