# Drift Detection

## Overview

Configuration drift occurs when a deployed configuration diverges from its approved baseline. The Drift Detection Engine compares any candidate configuration against a stored, approved baseline and reports every field-level change as a structured finding with severity and evidence.

## Limitation of Single-Config Analysis (Review-1)

Review-1 detected *internal* conflicts within a single configuration (e.g. two rules within the same config contradicting each other). It could not detect:
- A configuration that was valid in isolation but had *changed* from its approved state.
- Fields silently added, removed, or modified during an upgrade.
- Regression — a previously approved setting being overwritten by a new value.

## New Capability (Review-2)

The Drift Detection Engine (independent of the conflict detector) answers:
> "Has this configuration deviated from its approved baseline, and if so, how severely?"

## Architecture

```
Baseline Store (data/baselines/{tenant_id}/{version}.json)
          │
          ▼
Baseline Resolver (engine/baseline_store.py)
          │
          ▼
Deep Configuration Comparator (engine/drift_detector.py: _flatten)
          │
     ┌────┴─────┐
  ADDED    REMOVED    CHANGED
          │
          ▼
Drift Severity Classifier (deterministic policy)
          │
          ▼
Evidence Generator (structured reason + impact + recommendation)
          │
          ▼
DriftReport (Pydantic model → JSON response)
```

## Drift Types

| Type | Description |
|------|------------|
| `ADDED` | Field present in candidate but absent in baseline |
| `REMOVED` | Field present in baseline but absent in candidate |
| `CHANGED` | Field present in both but values differ |
| `UNCHANGED` | Field identical in both (counted but not reported as a finding) |

## Severity Policy

| Severity | Rule |
|---------|------|
| `CRITICAL` | Module `enabled` changed from `true` to `false`; or a critical module field removed |
| `HIGH` | Important policy threshold changed (attendance %, eligibility %, payment behaviour, fee clearance, important feature flag) |
| `MEDIUM` | Moderate-impact change (grace period, non-critical feature flag) |
| `LOW` | New optional field added; or any other unclassified field change |

Priority: first matching rule wins.

## Evidence Structure

Every finding includes structured evidence:
```json
{
  "reason": "Field 'modules.attendance.exam_eligibility_attendance' changed from 75 (baseline) to 85 (candidate).",
  "impact": "This field controls an important policy. Changing from 75 to 85 may affect student services.",
  "recommendation": "Review the change. If intentional, update the approved baseline. If not, revert to 75."
}
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/drift` | Compare two raw configs — returns DriftReport |
| `POST` | `/api/baselines/{tenant_id}/{version}/compare` | Compare candidate against stored baseline |
| `GET` | `/api/baselines/{tenant_id}/versions/compare?from_version=v1.0&to_version=v2.0` | Compare two stored versions |

## Example Finding

```json
{
  "tenant_id": "UNI-001",
  "baseline_version": "v1.0",
  "candidate_version": "upgrade-1.1",
  "drift_type": "CHANGED",
  "field": "modules.attendance.exam_eligibility_attendance",
  "old_value": 75,
  "new_value": 85,
  "severity": "HIGH",
  "evidence": {
    "reason": "Field changed from 75 (baseline) to 85 (candidate).",
    "impact": "This field controls an important policy. Changing from 75 to 85 may affect student services.",
    "recommendation": "Review. If intentional, update approved baseline. If not, revert to 75."
  }
}
```

## Limitations

1. Drift detection compares only `modules` and `feature_flags` sections. Metadata (`tenant_id`, `version`, `baseline_label`) is excluded.
2. Drift does not infer semantic meaning of numeric changes (e.g. does not know if raising a threshold is good or bad).
3. Severity is based on field name matching; unknown fields default to MEDIUM/LOW.
4. No audit trail — drift findings are computed on demand and not persisted.
