# Tenant-Configuration Analyser

**Academic Project Review-1 Prototype**

A system that detects conflicting rules in tenant-specific configuration files for a University Student-Services Portal **before** deployment. Uses Rule-Based Conflict Detection to provide deterministic, explainable, field-level evidence for every detected conflict.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Problem Statement](#problem-statement)
3. [Objectives](#objectives)
4. [Scope](#scope)
5. [Architecture](#architecture)
6. [User Flow](#user-flow)
7. [Technology Stack](#technology-stack)
8. [Technical Approach Comparison](#technical-approach-comparison)
9. [Selected Approach](#selected-approach)
10. [Conflict Categories](#conflict-categories)
11. [Severity Labels](#severity-labels)
12. [Evidence Model](#evidence-model)
13. [Test Strategy](#test-strategy)
14. [Edge Cases](#edge-cases)
15. [Implementation Status](#implementation-status)
16. [How to Run Locally](#how-to-run-locally)
17. [API Endpoints](#api-endpoints)
18. [Example Configuration](#example-configuration)
19. [Review-1 Completion Statement](#review-1-completion-statement)

---

## Project Overview

The **Tenant-Configuration Analyser (TCA)** is a pre-deployment analysis tool for a multi-tenant university student-services portal. The portal serves four modules: **Admissions**, **Fees**, **Attendance**, and **Certificates**. Each university tenant can independently configure each module, and inconsistent configuration values can cause incorrect business behavior, failed student workflows, and difficult software upgrades.

TCA automatically detects these configuration conflicts and presents structured, evidence-backed results to a reviewer before deployment.

---

## Problem Statement

Different university tenants can configure a shared portal differently. These per-tenant customizations can create:

- Contradictory rules (e.g., minimum attendance ≠ exam eligibility attendance)
- Feature flag conflicts (e.g., online payment disabled but required)
- Module dependency conflicts (e.g., fee clearance required but fees module disabled)
- Duplicate or redundant rules
- Invalid configuration values (out-of-range percentages, wrong types)

Without automated pre-deployment checking, these conflicts cause runtime errors, incorrect student-service decisions, and difficult root-cause analysis during upgrades.

---

## Objectives

- Detect configuration conflicts **before** deployment
- Provide **explainable evidence** for every HIGH/CRITICAL conflict
- Define a **transparent severity policy**
- Build a **working end-to-end prototype** for Review-1 (≈35% completion)
- Design a clean **extensible architecture** for future audit, rollback, and ML modules

---

## Scope

### Review-1 (Implemented)
- Tenant configuration input (JSON upload + preset selection)
- Configuration parser with edge case handling
- Configuration validator (type/range checks)
- Rule normalizer
- Conflict detection engine (5 conflict types, 10 rules)
- Severity classification (CRITICAL/HIGH/MEDIUM/LOW)
- Evidence generation (field-level, for HIGH+CRITICAL)
- React dashboard (7 pages, real API data)
- 8 realistic test configurations
- 43 automated tests
- 6 edge/failure cases
- Architecture and technical documentation

### Future Work (Explicitly Out of Scope for Review-1)
- Full audit trail
- Change approval workflow
- Rollback mechanism
- Upgrade history analysis
- False-positive/negative experiment
- Stakeholder validation
- Performance benchmarking
- Production deployment / CI-CD

---

## Architecture

```
User
 ↓
React Dashboard (Vite + TypeScript + Tailwind CSS)
 ↓  HTTP POST /api/analyze
FastAPI Application (Python)
 ↓
Configuration Parser       ← parse JSON, handle empty/malformed/unknown-module
 ↓
Configuration Validator    ← type checks, range validation, required fields
 ↓
Rule Normalizer            ← flatten to canonical (path → value) pairs
 ↓
Conflict Detection Engine  ← 5 detector functions, 10 named rules
 ↓
Severity Classifier        ← CRITICAL / HIGH / MEDIUM / LOW (documented policy)
 ↓
Evidence Generator         ← field-level structured evidence (HIGH/CRITICAL only)
 ↓
AnalysisResult (JSON)
 ↓
Dashboard — Overview · Analyze · Conflicts · Configurations · Rules · Approach · Docs
```

**Future extension points (designed, not built):**
- `AuditTrailModule` — append-only event log per configuration change
- `ChangeApprovalWorkflow` — propose → review → approve/reject pipeline
- `RollbackModule` — store/restore prior approved configurations
- `MLAnomalyDetectionChannel` — parallel experimental engine for unseen patterns

---

## User Flow

1. User navigates to **Analyze Config** page
2. Selects a preset test configuration OR pastes custom JSON
3. Clicks **Run Analysis**
4. Frontend `POST /api/analyze` → FastAPI
5. Backend: parse → validate → normalize → detect → classify → generate evidence
6. `AnalysisResult` returned as JSON
7. Dashboard displays: summary stats, validation errors, conflict cards with evidence

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

---

## Technical Approach Comparison

### Approach 1: Rule-Based Conflict Detection ✓ SELECTED

Each conflict is defined as an explicit named rule. The engine evaluates deterministic conditions and returns structured results.

| Criterion | Assessment |
|-----------|-----------|
| Explainability | EXCELLENT — every conflict maps to a rule ID, fields, and documented severity |
| Data requirements | None — pure logic |
| False positive risk | LOW — precise conditions, tunable |
| False negative risk | MEDIUM — unanticipated patterns not covered until rules are extended |
| Auditability | HIGH — rule ID + field path + value pair + evidence for every conflict |
| Data requirements | None |

### Approach 2: ML/Anomaly Detection

A model (e.g., Isolation Forest, Autoencoder) learns from historical configuration data and flags deviations.

| Criterion | Assessment |
|-----------|-----------|
| Explainability | POOR–MODERATE — anomaly scores don't map to business rules |
| Data requirements | HIGH — needs labelled historical conflict data |
| False positive risk | HIGH — novel-but-valid configurations flagged |
| Auditability | LOW — model internals opaque without additional tooling |

**Selection reason:** Rule-Based is deterministic, explainable, requires no data, and maps directly to the university's formal configuration policies. ML can be added as a parallel experimental channel once labelled data is accumulated.

---

## Conflict Categories

| Type | Description | Example |
|------|------------|---------|
| `DIRECT_RULE_CONFLICT` | Two rules governing the same decision give contradictory values | `minimum_attendance=75` vs `exam_eligibility_attendance=80` |
| `FEATURE_FLAG_CONFLICT` | A feature flag disables functionality that another rule requires | `online_payment=false` + `payment_required_before_admission=true` |
| `DEPENDENCY_CONFLICT` | A module depends on another module that is disabled | `fee_clearance_required=true` + `fees.enabled=false` |
| `DUPLICATE_OR_CONTRADICTORY_RULE` | Same concept defined twice with equal or conflicting values | `minimum_attendance=75` and `exam_eligibility_attendance=75` (redundant) |
| `INVALID_CONFIGURATION` | Field value violates schema, type, or range constraints | `minimum_attendance=105` (>100%) |

---

## Severity Labels

Severity is assigned **deterministically** based on a documented policy. No arbitrary AI scores.

| Severity | Policy | Examples |
|----------|--------|---------|
| **CRITICAL** | Causes major incorrect business behavior or deployment failure | Disabled fees module + fee clearance required |
| **HIGH** | Conflicting rules affect important student-service decisions | Online payment disabled but required before admission |
| **MEDIUM** | Potential inconsistency with limited operational impact | Grace period configured without late fee enabled |
| **LOW** | Minor redundancy or advisory warning | Duplicate attendance threshold fields |

Every classification has a documented rationale stored in `engine/classifier.py`.

---

## Evidence Model

Every HIGH or CRITICAL conflict carries structured evidence:

```json
{
  "conflict_id": "abc12345",
  "title": "Certificate Fee Clearance Depends on Disabled Fees Module",
  "tenant_id": "UNI-004",
  "module": "certificates / fees",
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

MEDIUM and LOW conflicts do not generate evidence (by policy — limited operational impact).

---

## Test Strategy

**Backend (Pytest):** 43 tests, 0 failures

| Class | Tests | Coverage |
|-------|-------|---------|
| `TestParser` | 6 | Valid config, empty, missing fields, unknown modules, invalid JSON |
| `TestValidator` | 5 | Valid config, % > 100, % < 0, wrong bool type, missing enabled |
| `TestNormalizer` | 4 | Produces rules, all modules present, feature flags, unique paths |
| `TestDetector` | 7 | All 5 conflict types, multiple conflicts, false-positive check |
| `TestClassifier` | 4 | CRITICAL/HIGH/MEDIUM/LOW assignments |
| `TestEvidence` | 4 | HIGH/CRITICAL have evidence, LOW/MEDIUM do not, evidence structure |
| `TestEdgeCases` | 6 | All 6 edge cases |
| `TestAPI` | 7 | All 7 endpoints end-to-end via TestClient |

---

## Edge Cases

| Case | Input | Expected Behavior | Implemented |
|------|-------|------------------|-------------|
| EC-1 | Missing `tenant_id` | Parse fails, clear error message | ✓ |
| EC-2 | `online_payment=false` + `payment_required=true` | FEATURE_FLAG_CONFLICT detected, HIGH severity | ✓ |
| EC-3 | Fees disabled + fee clearance required | DEPENDENCY_CONFLICT, CRITICAL severity | ✓ |
| EC-4 | `minimum_attendance=105` (>100) | INVALID_CONFIGURATION, CRITICAL severity | ✓ |
| EC-5 | Empty JSON `{}` | Parse fails, "Empty configuration" message | ✓ |
| EC-6 | Unknown module name | Parse error listing known modules | ✓ |

---

## Implementation Status

### ✓ Completed (Review-1)

- Configuration parser (`engine/parser.py`)
- Configuration validator (`engine/validator.py`)
- Rule normalizer (`engine/normalizer.py`)
- Conflict detection engine (`engine/detector.py`) — 5 categories, 10 rules
- Severity classifier (`engine/classifier.py`) — documented policy
- Evidence generator (`engine/evidence.py`)
- FastAPI backend (`main.py`) — 8 endpoints
- 8 realistic test tenant JSON configurations
- 43 automated backend tests (pytest) — all passing
- 6 edge/failure cases tested
- React + TypeScript + Tailwind dashboard
- 7 frontend pages (Overview, Analyze, Conflicts, Configurations, Rules, Approach, Docs)
- TypeScript: 0 errors, frontend build: success
- Architecture documentation (`docs/architecture.md`)
- User flow documentation (`docs/user-flow.md`)
- Technical approaches comparison (`docs/technical-approaches.md`)
- Conflict rules documentation (`docs/conflict-rules.md`)
- Testing documentation (`docs/testing.md`)
- Review-1 status document (`docs/review-1-status.md`)

### ○ Future Work

- Full audit trail (immutable event log)
- Change approval workflow (propose → review → approve/reject)
- Rollback path for high-impact configurations
- Upgrade history analysis
- False-positive/negative experiment with labelled data
- Stakeholder validation study
- Full performance benchmarking
- Deployment checklist
- Production deployment / containerisation
- ML/Anomaly detection parallel module

---

## How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd "d:\attendance project\backend"
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

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
pytest tests/ -v
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Service health check |
| `POST` | `/api/analyze` | Analyse a single tenant configuration |
| `GET` | `/api/analyze-all` | Analyse all 8 bundled configurations (used by Overview) |
| `GET` | `/api/configurations` | List all bundled test configurations |
| `GET` | `/api/configurations/{id}` | Get a specific tenant configuration |
| `GET` | `/api/conflicts` | All conflicts across all tenants |
| `GET` | `/api/conflicts/{id}` | Specific conflict with full evidence |
| `GET` | `/api/rules` | All documented detection rules |

---

## Example Configuration

```json
{
  "tenant_id": "UNI-001",
  "tenant_name": "Greenfield University",
  "version": "2.1.0",
  "modules": {
    "admissions": {
      "enabled": true,
      "minimum_eligibility_percentage": 60
    },
    "fees": {
      "enabled": true,
      "payment_required_before_admission": false,
      "late_fee_applicable": true,
      "grace_period_days": 30
    },
    "attendance": {
      "enabled": true,
      "minimum_attendance": 75,
      "exam_eligibility_attendance": 75
    },
    "certificates": {
      "enabled": true,
      "fee_clearance_required": true
    }
  },
  "feature_flags": {
    "online_payment": true,
    "digital_certificate": false
  }
}
```

---

## Review-1 Completion Statement

This prototype represents an honest, demonstrable **≈35% completion** of the final project. All components listed under "Completed" are genuinely working end-to-end:

- The backend engine actually parses, validates, detects, classifies, and generates evidence.
- The dashboard fetches real API data — no hardcoded statistics.
- All 43 automated tests pass against real logic.
- HIGH/CRITICAL conflicts always carry structured evidence.
- No feature is marked complete unless it actually works.

The remaining ~65% (audit trail, change approval, rollback, ML module, upgrade experiment, stakeholder validation, production deployment) is explicitly documented as future work with clear architectural extension points.
