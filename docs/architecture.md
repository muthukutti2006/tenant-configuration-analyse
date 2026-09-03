# Architecture Documentation

## System Overview

The Tenant-Configuration Analyser (TCA) is a two-tier web application:

- **Frontend:** React SPA served by Vite dev server
- **Backend:** Python FastAPI application

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│                                                                   │
│  OverviewPage  AnalyzePage  ConflictsPage  ConfigurationsPage   │
│  RulesPage     ApproachPage  AboutPage                           │
│                                                                   │
│  Components: Sidebar · Layout · ConflictCard · Badge · Card      │
│  API Client:  src/api/client.ts  (typed fetch wrappers)          │
│  Types:       src/types/index.ts (mirrors Pydantic models)       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (JSON)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FASTAPI APPLICATION                          │
│                         main.py                                  │
│                                                                   │
│  GET  /api/health          GET  /api/configurations              │
│  POST /api/analyze         GET  /api/configurations/{id}         │
│  GET  /api/analyze-all     GET  /api/conflicts                   │
│  GET  /api/rules           GET  /api/conflicts/{id}              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│   parser.py  │  │ validator.py │  │  normalizer.py   │
│              │  │              │  │                  │
│ Parse JSON   │  │ Type checks  │  │ Flatten rules    │
│ Handle edge  │  │ Range checks │  │ to (path,value)  │
│ cases        │  │ Required     │  │ canonical pairs  │
│              │  │ fields       │  │                  │
└──────┬───────┘  └──────┬───────┘  └────────┬─────────┘
       └──────────────────┴───────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │     detector.py      │
              │                      │
              │ detect_direct_rule_  │
              │ conflicts()          │
              │                      │
              │ detect_feature_flag_ │
              │ conflicts()          │
              │                      │
              │ detect_dependency_   │
              │ conflicts()          │
              │                      │
              │ detect_duplicate_    │
              │ contradictory_       │
              │ rules()              │
              │                      │
              │ detect_invalid_      │
              │ configurations()     │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │    classifier.py     │
              │                      │
              │ Assigns CRITICAL /   │
              │ HIGH / MEDIUM / LOW  │
              │ per documented policy│
              │                      │
              │ Builds Conflict      │
              │ model instances      │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │     evidence.py      │
              │                      │
              │ Structured evidence  │
              │ for HIGH + CRITICAL  │
              │ (tenant_id, fields,  │
              │  values, explanation,│
              │  recommendation)     │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   AnalysisResult     │
              │   (Pydantic model)   │
              │                      │
              │ tenant_id            │
              │ status               │
              │ summary (counts)     │
              │ validation_errors[]  │
              │ conflicts[]          │
              │   └── evidence{}     │
              │ normalized_rules_cnt │
              └──────────────────────┘
```

## Data Models

### TenantConfig (input)
```
TenantConfig
├── tenant_id: str
├── tenant_name: str
├── version: str
├── modules: TenantModules
│   ├── admissions: AdmissionsModule (optional)
│   ├── fees: FeesModule (optional)
│   ├── attendance: AttendanceModule (optional)
│   └── certificates: CertificatesModule (optional)
└── feature_flags: FeatureFlags (optional)
```

### AnalysisResult (output)
```
AnalysisResult
├── tenant_id, tenant_name, version, status
├── summary: AnalysisSummary
│   ├── total_rules_analyzed
│   ├── total_conflicts, critical, high, medium, low
│   └── conflict_types: Dict[str, int]
├── validation_errors: List[ValidationError]
├── conflicts: List[Conflict]
│   ├── id, conflict_type, severity, title, description
│   ├── module, fields_involved
│   └── evidence: Evidence (HIGH/CRITICAL only)
│       ├── tenant_id, module, rule_a, rule_b
│       ├── value_a, value_b
│       ├── conflict_type, severity
│       ├── explanation, why_conflict, recommendation
└── normalized_rules_count: int
```

## File Structure

```
d:\attendance project\
├── README.md
├── backend/
│   ├── main.py                    FastAPI application + endpoints
│   ├── requirements.txt
│   ├── models/
│   │   ├── config_model.py        TenantConfig Pydantic models
│   │   └── conflict_model.py      Conflict, Evidence, AnalysisResult models
│   ├── engine/
│   │   ├── parser.py              Configuration parser
│   │   ├── validator.py           Configuration validator
│   │   ├── normalizer.py          Rule normalizer
│   │   ├── detector.py            Conflict detection (5 categories)
│   │   ├── classifier.py          Severity classification
│   │   └── evidence.py            Evidence generation
│   ├── data/
│   │   └── tenants/               8 JSON test configurations
│   └── tests/
│       └── test_engine.py         43 pytest tests
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          Typed fetch API client
│   │   ├── types/index.ts         TypeScript types (mirrors Pydantic)
│   │   ├── lib/utils.ts           Utility functions
│   │   ├── components/
│   │   │   ├── ui/                Badge, Card UI components
│   │   │   ├── layout/            Sidebar, Layout
│   │   │   └── conflicts/         ConflictCard
│   │   └── pages/                 7 page components
│   ├── vite.config.ts
│   └── package.json
└── docs/
    ├── architecture.md            (this file)
    ├── user-flow.md
    ├── technical-approaches.md
    ├── conflict-rules.md
    ├── testing.md
    └── review-1-status.md
```

## Future Extension Points

These modules are **designed but not built** in Review-1. The architecture accommodates them cleanly:

### AuditTrailModule
- Append-only event log table per tenant
- Every config submission, conflict detection, and resolution is logged
- Accessible via `GET /api/audit/{tenant_id}`

### ChangeApprovalWorkflow
- `POST /api/changes` — propose a new configuration
- `GET /api/changes/{id}` — view proposed change
- `POST /api/changes/{id}/approve` — approve
- `POST /api/changes/{id}/reject` — reject with reason

### RollbackModule
- `GET /api/configurations/{id}/history` — version history
- `POST /api/configurations/{id}/rollback/{version}` — restore

### MLAnomalyDetectionChannel
- Parallel detection path alongside rule-based engine
- Returns anomaly scores with SHAP explanations
- Requires labelled historical configuration data
- Can be enabled per-tenant via feature flag
