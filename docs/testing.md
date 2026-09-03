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

**Expected output:** 43 passed, 0 failed, 0 skipped

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

## Actual Test Results

```
============================= test session starts =============================
platform win32 -- Python 3.12.9, pytest-8.2.2
collected 43 items

tests/test_engine.py::TestParser::test_parse_valid_config PASSED
tests/test_engine.py::TestParser::test_parse_empty_config PASSED
tests/test_engine.py::TestParser::test_parse_missing_required_field PASSED
tests/test_engine.py::TestParser::test_parse_missing_modules PASSED
tests/test_engine.py::TestParser::test_parse_unknown_module PASSED
tests/test_engine.py::TestParser::test_parse_invalid_json_string PASSED
tests/test_engine.py::TestValidator::test_valid_config_no_errors PASSED
tests/test_engine.py::TestValidator::test_percentage_above_100 PASSED
tests/test_engine.py::TestValidator::test_percentage_below_0 PASSED
tests/test_engine.py::TestValidator::test_invalid_boolean_type PASSED
tests/test_engine.py::TestValidator::test_missing_enabled_field PASSED
tests/test_engine.py::TestNormalizer::test_normalize_produces_rules PASSED
tests/test_engine.py::TestNormalizer::test_normalize_includes_all_modules PASSED
tests/test_engine.py::TestNormalizer::test_normalize_includes_feature_flags PASSED
tests/test_engine.py::TestNormalizer::test_normalize_rule_paths_are_unique PASSED
tests/test_engine.py::TestDetector::test_no_conflicts_on_normal_config PASSED
tests/test_engine.py::TestDetector::test_direct_rule_conflict_detected PASSED
tests/test_engine.py::TestDetector::test_feature_flag_conflict_detected PASSED
tests/test_engine.py::TestDetector::test_dependency_conflict_detected PASSED
tests/test_engine.py::TestDetector::test_duplicate_rule_detected PASSED
tests/test_engine.py::TestDetector::test_multiple_conflicts_detected PASSED
tests/test_engine.py::TestDetector::test_no_false_positive_on_valid_thresholds PASSED
tests/test_engine.py::TestClassifier::test_dependency_conflict_is_critical PASSED
tests/test_engine.py::TestClassifier::test_direct_rule_conflict_is_high PASSED
tests/test_engine.py::TestClassifier::test_duplicate_rule_is_low_or_medium PASSED
tests/test_engine.py::TestClassifier::test_invalid_config_is_critical PASSED
tests/test_engine.py::TestEvidence::test_high_conflicts_have_evidence PASSED
tests/test_engine.py::TestEvidence::test_critical_conflicts_have_evidence PASSED
tests/test_engine.py::TestEvidence::test_low_medium_conflicts_have_no_evidence PASSED
tests/test_engine.py::TestEvidence::test_evidence_report_structure PASSED
tests/test_engine.py::TestEdgeCases::test_edge_missing_required_field PASSED
tests/test_engine.py::TestEdgeCases::test_edge_conflicting_feature_flags PASSED
tests/test_engine.py::TestEdgeCases::test_edge_module_dependency_conflict PASSED
tests/test_engine.py::TestEdgeCases::test_edge_attendance_above_100 PASSED
tests/test_engine.py::TestEdgeCases::test_edge_empty_configuration PASSED
tests/test_engine.py::TestEdgeCases::test_edge_unknown_module PASSED
tests/test_engine.py::TestAPI::test_health_endpoint PASSED
tests/test_engine.py::TestAPI::test_analyze_valid_config PASSED
tests/test_engine.py::TestAPI::test_analyze_returns_real_conflicts PASSED
tests/test_engine.py::TestAPI::test_list_configurations PASSED
tests/test_engine.py::TestAPI::test_analyze_all PASSED
tests/test_engine.py::TestAPI::test_list_all_conflicts PASSED
tests/test_engine.py::TestAPI::test_list_rules PASSED

============================= 43 passed in 1.56s ==============================
```

---

## Known Limitations

- Frontend tests (Vitest) are not yet implemented — TypeScript type checking passes.
- The ML/anomaly detection module has no tests (it does not exist yet).
- Performance tests for large tenant sets (>1000 configs) are future work.
