# CONFIQRA — Tenant-Configuration Analyser

**Academic Project | Review-2 Prototype**

A pre-deployment analysis system that detects conflicting rules and configuration drift in tenant-specific configuration files for a University Student-Services Portal. Produces deterministic, evidence-backed results before any configuration reaches production.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Problem Statement](#problem-statement)
3. [Current Implementation Status](#current-implementation-status)
4. [Architecture](#architecture)
5. [Technology Stack](#technology-stack)
6. [Conflict Detection](#conflict-detection)
7. [Configuration Drift Detection](#configuration-drift-detection)
8. [Severity Labels](#severity-labels)
9. [Evidence Model](#evidence-model)
10. [Rule Catalogue](#rule-catalogue)
11. [Before/After Experiment](#beforeafter-experiment)
12. [Test Strategy](#test-strategy)
13. [Edge Cases](#edge-cases)
14. [How to Run Locally](#how-to-run-locally)
15. [API Endpoints](#api-endpoints)
16. [Frontend Routes](#frontend-routes)
17. [Project Structure](#project-structure)
18. [Technical Approach](#technical-approach)

---

## Project Overview

**CONFIQRA** (Tenant-Configuration Analyser) is a pre-deployment analysis tool for a multi-tenant university student-services portal. The portal serves four modules: **Admissions**, **Fees**, **Attendance**, and **Certificates**. Each university tenant can independently configure each module.

TCA detects two classes of problems:

1. **Configuration Conflicts** — Internal contradictions within a single configuration (e.g. a required payment channel is disabled).
2. **Configuration Drift** — Deviations from an approved baseline when a configuration is upgraded (e.g. attendance threshold silently raised during a version upgrade).

---

## Problem Statement

Per-tenant configuration customisations can create:

- Contradictory rules (e.g. `minimum_attendance=75` vs `exam_eligibility_attendance=80`)
- Feature flag conflicts (online payment disabled but payment required before admission)
- Module dependency conflicts (fee clearance required but fees module disabled)
- Duplicate or redundant rules
- Invalid configuration values (out-of-range percentages, wrong types)
- Silent drift from approved baselines during upgrades

Without automated pre-deployment checking, these issues cause runtime errors, incorrect student-service decisions, and difficult root-cause analysis.

---

## Current Implementation Status

> All items listed below are **genuinely implemented and verified working**. No item is listed unless it passes the test suite and/or can be demonstrated end-to-end.

### ✅ Implemented — Review-1 (Conflict Detection)

| Component | Status |
|-----------|--------|
| Configuration parser | ✅ Working |
| Configuration validator (type/range) | ✅ Working |
| Rule normaliser | ✅ Working |
| Conflict detection engine (5 types, 10 rules) | ✅ Working |
| Severity classifier (CRITICAL/HIGH/MEDIUM/LOW) | ✅ Working |
| Evidence generator (HIGH/CRITICAL only) | ✅ Working |
| FastAPI backend | ✅ Working |
| 8 realistic test tenant JSON fixtures | ✅ Working |
| 43 automated backend tests | ✅ All passing |
| React + TypeScript frontend dashboard | ✅ Working |
| 7 original frontend pages | ✅ Working |
| Auto-analysis on preset selection | ✅ Working |

### ✅ Implemented — Review-2 (Drift Detection & Baselines)

| Component | Status |
|-----------|--------|
| Versioned baseline store (4 baselines, 3 tenants) | ✅ Working |
| Configuration drift detection engine | ✅ Working |
| ADDED / REMOVED / CHANGED field comparison | ✅ Working |
| Drift severity classification (same 4 levels) | ✅ Working |
| Structured drift evidence (reason, impact, recommendation) | ✅ Working |
| Version-to-version comparison (e.g. v1.0 → v2.0) | ✅ Working |
| Compare candidate against stored baseline | ✅ Working |
| Machine-readable rule catalogue (18 rules) | ✅ Working |
| Filterable catalogue API (category, severity, enabled) | ✅ Working |
| Synthetic before/after experiment | ✅ Working |
| Configuration Drift frontend page | ✅ Working |
| Rules Catalogue frontend page | ✅ Working |
| 50 new automated tests (93 total) | ✅ All passing |
| GitHub Actions CI/CD (backend + frontend) | ✅ In `.github/workflows/ci.yml` |
| 4 new documentation files | ✅ Written |

### ○ Not Yet Implemented (Future Work)

- Full immutable audit trail
- Change approval workflow (propose → review → approve/reject)
- Rollback mechanism for approved configurations
- ML/anomaly detection parallel channel
- Production deployment / containerisation
- Performance benchmarking under load
- Stakeholder validation study

---

## Architecture

### Conflict Detection Pipeline

```
Tenant Configuration (JSON)
        ↓
    Parser              ← parse JSON; handle empty / malformed / unknown-module
        ↓
    Validator           ← type checks, range validation, required fields
        ↓
    Normaliser          ← flatten to canonical (path → value) pairs
        ↓
Conflict Detection      ← 5 detector functions, 10 named rules
        ↓
Severity Classifier     ← CRITICAL / HIGH / MEDIUM / LOW (deterministic policy)
        ↓
Evidence Generator      ← field-level structured evidence (HIGH/CRITICAL only)
        ↓
   AnalysisResult (JSON)
        ↓
  React Dashboard       ← live data, no hardcoded statistics
```

### Drift Detection Pipeline

```
Approved Baseline (data/baselines/{tenant_id}/{version}.json)
        ↓
  Baseline Resolver     ← engine/baseline_store.py
        ↓
  Deep Comparator       ← _flatten() → dot-path key comparison
        ↓
Drift Classification    ← ADDED / REMOVED / CHANGED / UNCHANGED
        ↓
Severity Classifier     ← CRITICAL / HIGH / MEDIUM / LOW (deterministic policy)
        ↓
Evidence Generator      ← reason + impact + recommendation per finding
        ↓
    DriftReport (JSON)
        ↓
Configuration Drift page (React)
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| UI Components | Lucide React (icons), Recharts (charts) |
| Routing | React Router v7 |
| Backend | Python 3.12, FastAPI |
| Data Models | Pydantic v2 |
| Configuration | JSON |
| Testing (backend) | Pytest, FastAPI TestClient |
| Dev Server | Uvicorn |
| CI/CD | GitHub Actions |

---

## Conflict Detection

### Conflict Categories

| Type | Description | Example |
|------|------------|---------|
| `DIRECT_RULE_CONFLICT` | Two rules governing the same decision give contradictory values | `minimum_attendance=75` vs `exam_eligibility_attendance=80` |
| `FEATURE_FLAG_CONFLICT` | A feature flag disables functionality that another rule requires | `online_payment=false` + `payment_required_before_admission=true` |
| `DEPENDENCY_CONFLICT` | A module depends on another module that is disabled | `fee_clearance_required=true` + `fees.enabled=false` |
| `DUPLICATE_OR_CONTRADICTORY_RULE` | Same concept defined twice with equal or conflicting values | `minimum_attendance=75` and `exam_eligibility_attendance=75` |
| `INVALID_CONFIGURATION` | Field value violates schema, type, or range constraints | `minimum_attendance=105` (>100%) |

### Results on Bundled Fixtures

| Metric | Value |
|--------|-------|
| Tenant fixtures | 8 |
| Rules analysed per configuration | 137 (across all 8 tenants) |
| Conflict findings | 21 (across all 8 tenants) |

---

## Configuration Drift Detection

Drift detection compares a **candidate** configuration field-by-field against an **approved baseline**. Only `modules` and `feature_flags` sections are compared; metadata fields are excluded.

### Baseline Store

Approved baselines are stored as versioned JSON files:

```
backend/data/baselines/
  UNI-001/
    v1.0.json    ← approved_production  (2026-01-15)
    v2.0.json    ← approved_production  (2026-06-01)
  UNI-002/
    v1.0.json    ← approved_production  (2026-02-01)
  UNI-003/
    v1.0.json    ← approved_production  (2026-03-10)
```

Each baseline file contains the full approved `modules` + `feature_flags` state plus metadata (`tenant_id`, `version`, `baseline_label`, `timestamp`, `approved_by`).

### Known v1.0 → v2.0 Drift (UNI-001)

| Field | v1.0 | v2.0 | Drift Severity |
|-------|------|------|---------------|
| `modules.admissions.minimum_eligibility_percentage` | 60 | 65 | HIGH |
| `modules.fees.grace_period_days` | 30 | 15 | MEDIUM |
| `modules.attendance.exam_eligibility_attendance` | 75 | 80 | HIGH |
| `modules.certificates.attendance_clearance_required` | false | true | HIGH |
| `feature_flags.digital_certificate` | false | true | MEDIUM |

### Drift Severity Policy

| Severity | Condition |
|---------|-----------|
| **CRITICAL** | Module `enabled` changed from `true` → `false`; critical module field removed |
| **HIGH** | Important threshold changed (attendance %, eligibility %, payment behaviour, clearance flags, `online_payment` flag) |
| **MEDIUM** | Moderate-impact change (grace period, `digital_certificate` flag, `self_registration` flag) |
| **LOW** | New optional field added |

First matching rule wins.

---

## Severity Labels

Same 4-level policy applies to both conflict detection and drift detection:

| Severity | Meaning |
|----------|---------|
| **CRITICAL** | Causes major incorrect business behavior or workflow failure |
| **HIGH** | Conflicting rules affect important student-service decisions |
| **MEDIUM** | Potential inconsistency with limited operational impact |
| **LOW** | Minor redundancy or advisory notice |

Severity is **deterministic** — same input always produces the same output. No AI scoring.

---

## Evidence Model

### Conflict Evidence (HIGH/CRITICAL only)

```json
{
  "conflict_id": "abc12345",
  "title": "Certificate Fee Clearance Depends on Disabled Fees Module",
  "severity": "CRITICAL",
  "conflict_type": "DEPENDENCY_CONFLICT",
  "evidence": {
    "rule_a": { "field": "modules.certificates.fee_clearance_required", "value": true },
    "rule_b": { "field": "modules.fees.enabled", "value": false },
    "explanation": "...",
    "why_this_is_a_conflict": "...",
    "recommendation": "Enable the fees module or set fee_clearance_required to false."
  }
}
```

### Drift Evidence (all findings)

```json
{
  "field": "modules.attendance.exam_eligibility_attendance",
  "drift_type": "CHANGED",
  "severity": "HIGH",
  "old_value": 75,
  "new_value": 80,
  "evidence": {
    "reason": "Field changed from 75 (baseline) to 80 (candidate).",
    "impact": "This field controls an important policy. Changing from 75 to 80 may affect student services.",
    "recommendation": "Review. If intentional, update approved baseline. If not, revert to 75."
  }
}
```

---

## Rule Catalogue

A machine-readable catalogue of **18 rules** is served at `/api/catalog`:

| Category | Count | Rule Type |
|----------|-------|-----------|
| ATTENDANCE | 3 | conflict |
| FEES | 1 | conflict |
| FEATURE_FLAGS | 2 | conflict |
| DEPENDENCIES | 3 | conflict |
| VALIDATION | 3 | validation |
| DRIFT | 6 | drift |

Each rule exposes: `rule_id`, `category`, `name`, `description`, `condition`, `severity`, `evidence_template`, `enabled`, `rule_type`.

The `/api/catalog` endpoint supports query filters: `?category=ATTENDANCE`, `?severity=CRITICAL`, `?enabled=true`.

---

## Before/After Experiment

> **DATA NOTE: All scenarios are SYNTHETIC** — created specifically to demonstrate detection capability. They are NOT drawn from real university incident data.

### Precise Definitions

| Term | Definition |
|------|-----------|
| **Detected** | The analyser returned one or more HIGH/CRITICAL findings for the scenario |
| **Flagged** | A specific field was identified as a drift finding |
| **Reviewed** | A human examines the flagged finding before deciding whether to deploy |
| **Avoided/Prevented** | An issue was detected as HIGH/CRITICAL by the analyser AND the manual/checklist method did NOT catch it AND the configuration would otherwise have proceeded to deployment |

Detection does **not** automatically equal prevention. Prevention requires a human to act on the finding before deployment.

### Scenarios

| ID | Issue | Manual Caught | Analyser Result | Avoided |
|----|-------|--------------|----------------|---------|
| EXP-001 | `exam_eligibility_attendance` raised 75→85 (SYNTHETIC) | ❌ No | ✅ HIGH finding | ✅ 1 |
| EXP-002 | `fees.enabled` changed true→false (SYNTHETIC) | ✅ Yes | ✅ CRITICAL finding | ❌ 0 |
| EXP-003 | `online_payment` flag disabled (SYNTHETIC) | ❌ No | ✅ HIGH finding | ✅ 1 |
| EXP-004 | Clean upgrade — no changes (SYNTHETIC) | — | ✅ 0 findings (TN) | — |

### Exact Metrics (from `/api/experiment`)

| Metric | Value |
|--------|-------|
| Total scenarios | 4 |
| True Positives (TP) | 3 |
| True Negatives (TN) | 1 |
| False Positives (FP) | 0 |
| False Negatives (FN) | 0 |
| Issues avoided | 2 |
| Precision | 1.0 |
| Recall | 1.0 |
| F1 | 1.0 |

> Precision/Recall of 1.0 is expected in a **controlled synthetic experiment** designed to demonstrate detection capability. Real-world scenarios would include harder edge cases and require empirical validation.

---

## Test Strategy

### Backend — pytest

**Exact result: `93 passed in 1.56s`**

| Test file | Class | Tests | What is covered |
|-----------|-------|-------|----------------|
| `test_engine.py` | `TestParser` | 6 | Valid config, empty, missing fields, unknown modules, invalid JSON |
| `test_engine.py` | `TestValidator` | 5 | Valid config, % > 100, % < 0, wrong bool type, missing enabled |
| `test_engine.py` | `TestNormalizer` | 4 | Produces rules, all modules, feature flags, unique paths |
| `test_engine.py` | `TestDetector` | 7 | All 5 conflict types, multiple conflicts, false-positive check |
| `test_engine.py` | `TestClassifier` | 4 | CRITICAL/HIGH/MEDIUM/LOW assignments |
| `test_engine.py` | `TestEvidence` | 4 | HIGH/CRITICAL have evidence, LOW/MEDIUM do not, evidence structure |
| `test_engine.py` | `TestEdgeCases` | 6 | All 6 edge cases |
| `test_engine.py` | `TestAPI` | 7 | All original endpoints via TestClient |
| `test_drift.py` | `TestDriftDetector` | 13 | ADDED/REMOVED/CHANGED detection, severity, evidence, flatten |
| `test_drift.py` | `TestBaselineStore` | 8 | List tenants, load versions, load baseline, records, version comparison |
| `test_drift.py` | `TestRuleCatalog` | 6 | Rule count, required fields, category/severity filters, rule types |
| `test_drift.py` | `TestExperiment` | 9 | Scenarios, metrics, SYNTHETIC label, avoided definition |
| `test_drift.py` | `TestNewAPIEndpoints` | 14 | All 11 new endpoints via TestClient |

**No coverage percentage is claimed** — coverage tooling was not run as part of this review.

### Frontend — TypeScript + Vite

**Exact result: `exit code 0` — `✓ 2424 modules transformed — built in 9.41s`**

Zero TypeScript errors. Zero build errors.

---

## Edge Cases

| Case | Input | Expected Behavior | Implemented |
|------|-------|------------------|-------------|
| EC-1 | Missing `tenant_id` | Parse fails, clear error | ✅ |
| EC-2 | `online_payment=false` + `payment_required=true` | FEATURE_FLAG_CONFLICT, HIGH | ✅ |
| EC-3 | Fees disabled + fee clearance required | DEPENDENCY_CONFLICT, CRITICAL | ✅ |
| EC-4 | `minimum_attendance=105` | INVALID_CONFIGURATION, CRITICAL | ✅ |
| EC-5 | Empty JSON `{}` | Parse fails, "Empty configuration" | ✅ |
| EC-6 | Unknown module name | Parse error listing known modules | ✅ |

---

## How to Run Locally

**Prerequisites:** Python 3.10+, Node.js 18+

### Backend

```bash
cd "d:\attendance project\backend"
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

### Frontend

```bash
cd "d:\attendance project\frontend"
npm install
npm run dev
```

Dashboard: http://localhost:5173

### Run Tests

```bash
cd "d:\attendance project\backend"
python -m pytest tests/ -v
```

---

## API Endpoints

### Original (Review-1)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Service health check |
| `POST` | `/api/analyze` | Analyse a single tenant configuration |
| `GET` | `/api/analyze-all` | Analyse all 8 bundled configurations |
| `GET` | `/api/configurations` | List all bundled test configurations |
| `GET` | `/api/configurations/{id}` | Get a specific tenant configuration |
| `GET` | `/api/conflicts` | All conflicts across all tenants |
| `GET` | `/api/conflicts/{id}` | Specific conflict with full evidence |
| `GET` | `/api/rules` | All documented detection rules (legacy format) |

### New (Review-2)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/baselines` | List all stored approved baselines |
| `GET` | `/api/baselines/{tenant_id}` | List all versions for a tenant |
| `GET` | `/api/baselines/{tenant_id}/{version}` | Get a specific approved baseline |
| `POST` | `/api/drift` | Compare two raw configs — returns DriftReport |
| `POST` | `/api/baselines/{tenant_id}/{version}/compare` | Compare candidate against stored baseline |
| `GET` | `/api/baselines/{tenant_id}/versions/compare?from_version=v1.0&to_version=v2.0` | Compare two stored versions |
| `GET` | `/api/catalog` | Machine-readable rule catalogue (supports `?category=`, `?severity=`, `?enabled=` filters) |
| `GET` | `/api/experiment` | Run and return the synthetic before/after experiment |

---

## Frontend Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Overview | Aggregated stats across all 8 tenants |
| `/analyze` | Analyze Config | Submit a configuration for conflict analysis |
| `/conflicts` | All Conflicts | Browse all 21 conflict findings |
| `/drift` | Configuration Drift | Compare configurations against stored baselines |
| `/configurations` | Test Configurations | Browse the 8 bundled tenant fixtures |
| `/catalog` | Rules Catalogue | Browse all 18 rules with search and filters |
| `/rules` | Detection Rules | Legacy rules listing page |
| `/approach` | Technical Approach | Architecture and design decisions |
| `/about` | Documentation | Project documentation |

---

## Project Structure

```
attendance project/
├── .github/
│   └── workflows/
│       └── ci.yml                  ← GitHub Actions CI (backend + frontend)
├── backend/
│   ├── data/
│   │   ├── tenants/                ← 8 tenant fixture JSON files
│   │   └── baselines/              ← versioned approved baseline store
│   │       ├── UNI-001/
│   │       │   ├── v1.0.json
│   │       │   └── v2.0.json
│   │       ├── UNI-002/
│   │       │   └── v1.0.json
│   │       └── UNI-003/
│   │           └── v1.0.json
│   ├── engine/
│   │   ├── parser.py               ← configuration parser
│   │   ├── validator.py            ← type/range validation
│   │   ├── normalizer.py           ← rule normalisation
│   │   ├── detector.py             ← conflict detection (5 types, 10 rules)
│   │   ├── classifier.py           ← severity classification
│   │   ├── evidence.py             ← evidence generation
│   │   ├── drift_detector.py       ← drift detection (independent)
│   │   ├── baseline_store.py       ← baseline file loader/resolver
│   │   ├── rule_catalog.py         ← machine-readable rule catalogue
│   │   └── experiment.py           ← synthetic before/after experiment
│   ├── models/
│   │   ├── conflict_model.py       ← Pydantic models for conflicts
│   │   └── drift_model.py          ← Pydantic models for drift
│   ├── tests/
│   │   ├── test_engine.py          ← 43 tests (original)
│   │   └── test_drift.py           ← 50 tests (Review-2)
│   ├── main.py                     ← FastAPI app (19 endpoints)
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/client.ts           ← API client (all endpoints)
│       ├── types/index.ts          ← TypeScript types
│       ├── pages/
│       │   ├── OverviewPage.tsx
│       │   ├── AnalyzePage.tsx
│       │   ├── ConflictsPage.tsx
│       │   ├── DriftPage.tsx       ← NEW: drift comparison UI
│       │   ├── ConfigurationsPage.tsx
│       │   ├── CatalogPage.tsx     ← NEW: rule catalogue UI
│       │   ├── RulesPage.tsx
│       │   ├── ApproachPage.tsx
│       │   └── AboutPage.tsx
│       └── components/
│           └── layout/
│               └── Sidebar.tsx     ← 9-link navigation
└── docs/
    ├── architecture.md
    ├── baseline-store.md           ← NEW
    ├── ci-cd.md                    ← NEW
    ├── conflict-rules.md
    ├── drift-detection.md          ← NEW
    ├── review-1-status.md
    ├── technical-approaches.md
    ├── testing.md
    ├── upgrade-experiment.md       ← NEW
    └── user-flow.md
```

---

## Technical Approach

### Selected: Rule-Based Conflict Detection

Each conflict and each drift finding is defined as an explicit named rule. The engine evaluates deterministic conditions and returns structured results.

| Criterion | Assessment |
|-----------|-----------|
| Explainability | **Excellent** — every finding maps to a rule ID, fields, and documented severity |
| Data requirements | **None** — pure logic, no training data needed |
| False positive risk | **Low** — precise conditions |
| False negative risk | **Medium** — unanticipated patterns not covered until rules are extended |
| Auditability | **High** — rule ID + field path + value pair + evidence for every finding |

### Not Selected: ML/Anomaly Detection

A model (e.g. Isolation Forest, Autoencoder) would learn from historical configuration data and flag deviations.

| Criterion | Assessment |
|-----------|-----------|
| Explainability | **Poor–Moderate** — anomaly scores don't map to business rules |
| Data requirements | **High** — needs labelled historical conflict data |
| False positive risk | **High** — novel-but-valid configurations flagged |
| Auditability | **Low** — model internals opaque without additional tooling |

ML can be added as a **parallel experimental channel** once labelled data is accumulated. The architecture reserves an extension point for this.
