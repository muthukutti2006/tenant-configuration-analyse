# Testing Documentation

## Test Strategy

All backend testing uses **pytest** with FastAPI's `TestClient`.  
Frontend TypeScript is checked with `tsc --noEmit` (0 errors).

---

## Running Tests

```bash
# From backend directory
cd "d:\attendance project\backend"
pytest tests/ -v
```

**Expected output:** 93 passed, 0 failed, 0 skipped  
_(43 original in `test_engine.py` + 50 new in `test_drift.py`)_

---

## Test Classes and Coverage

### TestParser (6 tests)

| Test | Scenario | Expected |
|------|----------|---------|
| `test_parse_valid_config` | Normal config | success=True, config object returned |
| `test_parse_empty_config` | Empty `{}` | success=False, "Empty configuration" error |
| `test_parse_missing_required_field` | No `tenant_id` | success=False, field-name in errors |
| `test_parse_missing_modules` | No `modules` key | success=False |
| `test_parse_unknown_module` | `alien_module` | parse_errors contains "alien_module" |
| `test_parse_invalid_json_string` | `{invalid json}` | success=False, "Invalid JSON" |

### TestValidator (5 tests)

| Test | Scenario | Expected |
|------|----------|---------|
| `test_valid_config_no_errors` | Well-formed config | 0 validation errors |
| `test_percentage_above_100` | `minimum_eligibility_percentage=110` | CRITICAL error on that field |
| `test_percentage_below_0` | `minimum_attendance=-10` | CRITICAL error on that field |
| `test_invalid_boolean_type` | `fees.enabled="yes"` | HIGH error — wrong type |
| `test_missing_enabled_field` | Module without `enabled` | HIGH error — missing field |

### TestNormalizer (4 tests)

| Test | Scenario | Expected |
|------|----------|---------|
| `test_normalize_produces_rules` | Normal config | len(rules) > 0 |
| `test_normalize_includes_all_modules` | All modules present | admissions, fees, attendance, certificates in modules |
| `test_normalize_includes_feature_flags` | Flags present | feature_flags module in output |
| `test_normalize_rule_paths_are_unique` | Normal config | no duplicate path keys |

### TestDetector (7 tests)

| Test | Scenario | Expected |
|------|----------|---------|
| `test_no_conflicts_on_normal_config` | Normal config | No DEPENDENCY or FEATURE_FLAG conflicts |
| `test_direct_rule_conflict_detected` | att min=75, exam=80 | DIRECT_RULE_CONFLICT detected |
| `test_feature_flag_conflict_detected` | online_payment=false+required=true | FEATURE_FLAG_CONFLICT detected |
| `test_dependency_conflict_detected` | fees disabled+clearance required | DEPENDENCY_CONFLICT detected |
| `test_duplicate_rule_detected` | min_att=75, exam_att=75 | DUPLICATE_OR_CONTRADICTORY_RULE |
| `test_multiple_conflicts_detected` | 6 simultaneous conflicts | 3+ conflict types present |
| `test_no_false_positive_on_valid_thresholds` | exam_att < min_att | No spurious attendance mismatch |

### TestClassifier (4 tests)

| Test | Expected |
|------|---------|
| `test_dependency_conflict_is_critical` | All DEPENDENCY_CONFLICTs → CRITICAL |
| `test_direct_rule_conflict_is_high` | All DIRECT_RULE_CONFLICTs → HIGH |
| `test_duplicate_rule_is_low_or_medium` | DUPLICATE conflicts → LOW or MEDIUM |
| `test_invalid_config_is_critical` | INVALID_CONFIGURATION → CRITICAL |

### TestEvidence (4 tests)

| Test | Expected |
|------|---------|
| `test_high_conflicts_have_evidence` | Evidence present, tenant_id set, why_conflict non-empty |
| `test_critical_conflicts_have_evidence` | Evidence present for all CRITICAL |
| `test_low_medium_conflicts_have_no_evidence` | evidence=None for LOW/MEDIUM |
| `test_evidence_report_structure` | report has conflict_id, evidence, rule_a, recommendation, why_this_is_a_conflict |

### TestEdgeCases (6 tests)

| Edge Case | Test | Expected |
|-----------|------|---------|
| EC-1: Missing required field | `test_edge_missing_required_field` | parse fails with error list |
| EC-2: Conflicting feature flags | `test_edge_conflicting_feature_flags` | FEATURE_FLAG_CONFLICT detected |
| EC-3: Module dependency conflict | `test_edge_module_dependency_conflict` | CRITICAL DEPENDENCY_CONFLICT |
| EC-4: Attendance > 100% | `test_edge_attendance_above_100` | CRITICAL validation error |
| EC-5: Empty configuration | `test_edge_empty_configuration` | parse fails |
| EC-6: Unknown module | `test_edge_unknown_module` | parse error naming the unknown module |

### TestAPI (7 tests)

| Test | Endpoint | Expected |
|------|----------|---------|
| `test_health_endpoint` | `GET /api/health` | status=200, status="ok" |
| `test_analyze_valid_config` | `POST /api/analyze` | 200, tenant_id present, summary present |
| `test_analyze_returns_real_conflicts` | `POST /api/analyze` | total_conflicts > 0 for conflict config |
| `test_list_configurations` | `GET /api/configurations` | count ≥ 8 |
| `test_analyze_all` | `GET /api/analyze-all` | total_tenants ≥ 8 |
| `test_list_all_conflicts` | `GET /api/conflicts` | conflicts array present |
| `test_list_rules` | `GET /api/rules` | rules array, len ≥ 10 |

---

## Actual Test Results (Review-2)

```
============================= test session starts =============================
platform win32 -- Python 3.12, pytest-8.2.2
collected 93 items

tests/test_drift.py::TestDriftDetector::... (13 tests) PASSED
tests/test_drift.py::TestBaselineStore::... (8 tests)  PASSED
tests/test_drift.py::TestRuleCatalog::...  (6 tests)   PASSED
tests/test_drift.py::TestExperiment::...   (9 tests)   PASSED
tests/test_drift.py::TestNewAPIEndpoints:: (14 tests)  PASSED
tests/test_engine.py::TestParser::...      (6 tests)   PASSED
tests/test_engine.py::TestValidator::...   (5 tests)   PASSED
tests/test_engine.py::TestNormalizer::...  (4 tests)   PASSED
tests/test_engine.py::TestDetector::...    (7 tests)   PASSED
tests/test_engine.py::TestClassifier::...  (4 tests)   PASSED
tests/test_engine.py::TestEvidence::...    (4 tests)   PASSED
tests/test_engine.py::TestEdgeCases::...   (6 tests)   PASSED
tests/test_engine.py::TestAPI::...         (7 tests)   PASSED

============================== 93 passed in 1.56s ==============================
```

---

## Review-2 Test Classes (test_drift.py — 50 tests)

### TestDriftDetector (13 tests)

| Test | What is verified |
|------|----------------|
| `test_added_field_detected` | ADDED drift type appears when field is new in candidate |
| `test_removed_field_detected` | REMOVED drift type when field deleted from candidate |
| `test_changed_field_detected` | CHANGED drift type when value differs |
| `test_no_drift_on_identical_configs` | Zero findings when baseline == candidate |
| `test_feature_flag_drift_detected` | `feature_flags.online_payment` change detected |
| `test_module_disabled_is_critical` | `fees.enabled` true→false → CRITICAL |
| `test_attendance_change_is_high` | `exam_eligibility_attendance` change → HIGH |
| `test_added_field_is_low_severity` | All ADDED findings are LOW severity |
| `test_summary_counts_match_findings` | Summary counts consistent with findings list |
| `test_evidence_populated` | Every finding has non-empty reason and recommendation |
| `test_nested_field_change_detected` | Deep nested field (minimum_eligibility_percentage) detected |
| `test_version_comparison_report_structure` | DriftReport has required fields |
| `test_flatten_function` | Dot-path flattener works on nested dict |

### TestBaselineStore (8 tests)

Covers: `list_tenants_with_baselines`, `list_versions`, `load_baseline`, `load_latest_baseline`, `get_baseline_record`, `list_all_baselines`, not-found returns None, real UNI-001 v1→v2 comparison.

### TestRuleCatalog (6 tests)

Covers: count ≥ 12, required fields on all rules, category filter, severity filter, drift rules present, conflict rules present.

### TestExperiment (9 tests)

Covers: experiment runs without error, 4 scenarios, SYNTHETIC label, avoided definition, metrics types, EXP-001 threshold detection, EXP-002 module disabled detection, EXP-004 clean no-findings, all 4 IDs present.

### TestNewAPIEndpoints (14 tests)

Covers all 11 new endpoints via FastAPI TestClient: list baselines, tenant baselines, specific baseline, 404s, POST `/api/drift`, POST `compare`, version comparison, version not-found 404, GET `/api/catalog`, catalog filters (category, severity), GET `/api/experiment`.

---

## Known Limitations

- Frontend tests (Vitest) are not implemented — TypeScript type checking (`tsc -b`) passes with 0 errors.
- Code coverage percentage is not measured — no `--cov` flag used in this review.
- The ML/anomaly detection module does not exist and has no tests (by design).
- Performance tests for large tenant sets (>1000 configs) are future work.

