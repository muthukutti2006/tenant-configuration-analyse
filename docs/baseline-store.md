# Baseline Store

## Overview

The Baseline Store is the **source of truth** for approved tenant configurations. It provides versioned, approved snapshots that the Drift Detection Engine uses to identify deviations in proposed configurations.

## Storage Layout

```
backend/data/baselines/
  UNI-001/
    v1.0.json    ← approved_production (Jan 2026)
    v2.0.json    ← approved_production (Jun 2026)
  UNI-002/
    v1.0.json    ← approved_production (Feb 2026)
  UNI-003/
    v1.0.json    ← approved_production (Mar 2026)
```

Each file is named `{version}.json`. The filename stem (e.g. `v1.0`) is the version key used by all API endpoints.

## Baseline File Structure

```json
{
  "tenant_id": "UNI-001",
  "tenant_name": "Greenfield University",
  "version": "1.0",
  "baseline_label": "approved_production",
  "timestamp": "2026-01-15T10:00:00Z",
  "approved_by": "admin",
  "modules": {
    "admissions": { ... },
    "fees": { ... },
    "attendance": { ... },
    "certificates": { ... }
  },
  "feature_flags": { ... }
}
```

| Field | Purpose |
|-------|---------|
| `tenant_id` | Identifies the tenant |
| `version` | Semantic version of this approved snapshot |
| `baseline_label` | Human label (e.g. `approved_production`) |
| `timestamp` | ISO 8601 approval timestamp |
| `approved_by` | Who approved this baseline |
| `modules` | Full module configuration at approval time |
| `feature_flags` | Full feature flag state at approval time |

## Current Baselines

| Tenant | Version | Label | Timestamp |
|--------|---------|-------|-----------|
| UNI-001 — Greenfield University | v1.0 | approved_production | 2026-01-15 |
| UNI-001 — Greenfield University | v2.0 | approved_production | 2026-06-01 |
| UNI-002 — Summit Institute of Technology | v1.0 | approved_production | 2026-02-01 |
| UNI-003 — Northern Plains College | v1.0 | approved_production | 2026-03-10 |

## Changes from v1.0 → v2.0 (UNI-001)

| Field | v1.0 | v2.0 | Drift Severity |
|-------|------|------|---------------|
| `modules.admissions.minimum_eligibility_percentage` | 60 | 65 | HIGH |
| `modules.fees.grace_period_days` | 30 | 15 | MEDIUM |
| `modules.attendance.exam_eligibility_attendance` | 75 | 80 | HIGH |
| `modules.certificates.attendance_clearance_required` | false | true | HIGH |
| `feature_flags.digital_certificate` | false | true | MEDIUM |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/baselines` | List all stored baselines |
| `GET` | `/api/baselines/{tenant_id}` | List all versions for a tenant |
| `GET` | `/api/baselines/{tenant_id}/{version}` | Retrieve a specific baseline |
| `POST` | `/api/baselines/{tenant_id}/{version}/compare` | Compare candidate against stored baseline |

## Engine Module

`backend/engine/baseline_store.py` provides:

| Function | Description |
|----------|-------------|
| `list_tenants_with_baselines()` | Returns all tenant IDs with at least one baseline |
| `list_versions(tenant_id)` | Returns all version stems for a tenant |
| `load_baseline(tenant_id, version)` | Loads a specific baseline as dict |
| `load_latest_baseline(tenant_id)` | Loads the lexicographically latest baseline |
| `get_baseline_record(tenant_id, version)` | Returns a typed `BaselineRecord` |
| `list_all_baselines()` | Returns all `BaselineRecord` objects |

## Adding a New Baseline

1. Create the tenant directory if it doesn't exist: `data/baselines/{TENANT_ID}/`
2. Create a new file named `{version}.json` (e.g. `v3.0.json`)
3. Follow the baseline file structure above
4. The new baseline is immediately available via all API endpoints — no code change required

## Limitations

- No authentication or write API — baselines are managed as static files
- No rollback mechanism — old versions are preserved but cannot be "reverted" via API
- No conflict-detection between two baselines themselves (only between baseline and candidate)
