"""
Tests for drift detection, baseline store, rule catalogue, and experiment.
All 43 original tests in test_engine.py are preserved and NOT modified.
"""
import sys
import os
import copy
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from engine.drift_detector import compare_configurations, _flatten
from engine.baseline_store import (
    list_tenants_with_baselines,
    list_versions,
    load_baseline,
    load_latest_baseline,
    get_baseline_record,
    list_all_baselines,
)
from engine.rule_catalog import get_all_rules, get_rules_by_category, get_rules_by_severity
from engine.experiment import run_experiment
from models.drift_model import DriftType, DriftSeverity
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def baseline_v1():
    return {
        "tenant_id": "TEST-DRIFT",
        "tenant_name": "Drift Test University",
        "version": "1.0",
        "modules": {
            "admissions": {"enabled": True, "minimum_eligibility_percentage": 60},
            "fees": {
                "enabled": True,
                "payment_required_before_admission": False,
                "grace_period_days": 30,
                "late_fee_applicable": True,
            },
            "attendance": {
                "enabled": True,
                "minimum_attendance": 75,
                "exam_eligibility_attendance": 75,
            },
            "certificates": {"enabled": True, "fee_clearance_required": True},
        },
        "feature_flags": {"online_payment": True, "digital_certificate": False},
    }


@pytest.fixture
def candidate_added_field(baseline_v1):
    c = copy.deepcopy(baseline_v1)
    c["modules"]["attendance"]["attendance_grace_period"] = 3
    c["version"] = "2.0"
    return c


@pytest.fixture
def candidate_removed_field(baseline_v1):
    c = copy.deepcopy(baseline_v1)
    del c["modules"]["fees"]["grace_period_days"]
    c["version"] = "2.0"
    return c


@pytest.fixture
def candidate_changed_attendance(baseline_v1):
    c = copy.deepcopy(baseline_v1)
    c["modules"]["attendance"]["exam_eligibility_attendance"] = 85
    c["version"] = "2.0"
    return c


@pytest.fixture
def candidate_module_disabled(baseline_v1):
    c = copy.deepcopy(baseline_v1)
    c["modules"]["fees"]["enabled"] = False
    c["version"] = "2.0"
    return c


@pytest.fixture
def candidate_feature_flag_changed(baseline_v1):
    c = copy.deepcopy(baseline_v1)
    c["feature_flags"]["online_payment"] = False
    c["version"] = "2.0"
    return c


@pytest.fixture
def candidate_clean(baseline_v1):
    return copy.deepcopy(baseline_v1)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Drift Detector — core logic
# ─────────────────────────────────────────────────────────────────────────────

class TestDriftDetector:
    def test_added_field_detected(self, baseline_v1, candidate_added_field):
        report = compare_configurations(baseline_v1, candidate_added_field, "TEST-DRIFT", "1.0", "2.0")
        types = [f.drift_type for f in report.findings]
        assert DriftType.ADDED in types

    def test_removed_field_detected(self, baseline_v1, candidate_removed_field):
        report = compare_configurations(baseline_v1, candidate_removed_field, "TEST-DRIFT", "1.0", "2.0")
        types = [f.drift_type for f in report.findings]
        assert DriftType.REMOVED in types

    def test_changed_field_detected(self, baseline_v1, candidate_changed_attendance):
        report = compare_configurations(baseline_v1, candidate_changed_attendance, "TEST-DRIFT", "1.0", "2.0")
        types = [f.drift_type for f in report.findings]
        assert DriftType.CHANGED in types

    def test_no_drift_on_identical_configs(self, baseline_v1, candidate_clean):
        report = compare_configurations(baseline_v1, candidate_clean, "TEST-DRIFT", "1.0", "1.0")
        assert report.summary.total_findings == 0
        assert len(report.findings) == 0

    def test_feature_flag_drift_detected(self, baseline_v1, candidate_feature_flag_changed):
        report = compare_configurations(baseline_v1, candidate_feature_flag_changed, "TEST-DRIFT", "1.0", "2.0")
        fields = [f.field for f in report.findings]
        assert "feature_flags.online_payment" in fields

    def test_module_disabled_is_critical(self, baseline_v1, candidate_module_disabled):
        report = compare_configurations(baseline_v1, candidate_module_disabled, "TEST-DRIFT", "1.0", "2.0")
        critical = [f for f in report.findings if f.severity == DriftSeverity.CRITICAL]
        assert len(critical) >= 1
        fields = [f.field for f in critical]
        assert "modules.fees.enabled" in fields

    def test_attendance_change_is_high(self, baseline_v1, candidate_changed_attendance):
        report = compare_configurations(baseline_v1, candidate_changed_attendance, "TEST-DRIFT", "1.0", "2.0")
        high_findings = [f for f in report.findings if f.severity == DriftSeverity.HIGH]
        assert len(high_findings) >= 1

    def test_added_field_is_low_severity(self, baseline_v1, candidate_added_field):
        report = compare_configurations(baseline_v1, candidate_added_field, "TEST-DRIFT", "1.0", "2.0")
        added = [f for f in report.findings if f.drift_type == DriftType.ADDED]
        assert len(added) >= 1
        assert all(f.severity == DriftSeverity.LOW for f in added)

    def test_summary_counts_match_findings(self, baseline_v1, candidate_changed_attendance):
        report = compare_configurations(baseline_v1, candidate_changed_attendance, "TEST-DRIFT", "1.0", "2.0")
        assert report.summary.changed == len([f for f in report.findings if f.drift_type == DriftType.CHANGED])
        assert report.summary.added == len([f for f in report.findings if f.drift_type == DriftType.ADDED])
        assert report.summary.removed == len([f for f in report.findings if f.drift_type == DriftType.REMOVED])

    def test_evidence_populated(self, baseline_v1, candidate_changed_attendance):
        report = compare_configurations(baseline_v1, candidate_changed_attendance, "TEST-DRIFT", "1.0", "2.0")
        for f in report.findings:
            assert f.evidence is not None
            assert len(f.evidence.reason) > 0
            assert len(f.evidence.recommendation) > 0

    def test_nested_field_change_detected(self, baseline_v1):
        candidate = copy.deepcopy(baseline_v1)
        candidate["modules"]["admissions"]["minimum_eligibility_percentage"] = 75
        report = compare_configurations(baseline_v1, candidate, "TEST-DRIFT", "1.0", "2.0")
        fields = [f.field for f in report.findings]
        assert "modules.admissions.minimum_eligibility_percentage" in fields

    def test_version_comparison_report_structure(self, baseline_v1, candidate_changed_attendance):
        report = compare_configurations(baseline_v1, candidate_changed_attendance, "TEST-DRIFT", "1.0", "2.0")
        assert report.tenant_id == "TEST-DRIFT"
        assert report.baseline_version == "1.0"
        assert report.candidate_version == "2.0"
        assert report.summary is not None
        assert isinstance(report.findings, list)

    def test_flatten_function(self):
        d = {"a": {"b": {"c": 1}, "d": 2}, "e": 3}
        flat = _flatten(d)
        assert flat == {"a.b.c": 1, "a.d": 2, "e": 3}


# ─────────────────────────────────────────────────────────────────────────────
# 2. Baseline Store
# ─────────────────────────────────────────────────────────────────────────────

class TestBaselineStore:
    def test_list_tenants_returns_tenants(self):
        tenants = list_tenants_with_baselines()
        assert len(tenants) >= 3
        assert "UNI-001" in tenants
        assert "UNI-002" in tenants

    def test_list_versions_for_uni001(self):
        versions = list_versions("UNI-001")
        assert "v1.0" in versions
        assert "v2.0" in versions

    def test_load_baseline_returns_dict(self):
        raw = load_baseline("UNI-001", "v1.0")
        assert raw is not None
        assert raw["tenant_id"] == "UNI-001"
        assert "modules" in raw

    def test_load_baseline_not_found_returns_none(self):
        raw = load_baseline("NONEXISTENT", "v99.0")
        assert raw is None

    def test_load_latest_baseline(self):
        raw = load_latest_baseline("UNI-001")
        assert raw is not None
        assert raw["tenant_id"] == "UNI-001"

    def test_get_baseline_record(self):
        rec = get_baseline_record("UNI-001", "v1.0")
        assert rec is not None
        assert rec.tenant_id == "UNI-001"
        assert rec.baseline_label == "approved_production"
        assert rec.approved_by == "admin"

    def test_list_all_baselines(self):
        all_bl = list_all_baselines()
        assert len(all_bl) >= 4  # UNI-001 v1+v2, UNI-002 v1, UNI-003 v1

    def test_baseline_version_comparison_uni001(self):
        """Compare UNI-001 v1.0 vs v2.0 using real stored baselines."""
        v1 = load_baseline("UNI-001", "v1.0")
        v2 = load_baseline("UNI-001", "v2.0")
        assert v1 is not None
        assert v2 is not None
        report = compare_configurations(v1, v2, "UNI-001", "v1.0", "v2.0")
        # v1->v2: eligibility %, grace period, exam_eligibility_attendance,
        #         attendance_clearance, digital_certificate all changed
        assert report.summary.total_findings > 0
        assert report.summary.changed > 0


# ─────────────────────────────────────────────────────────────────────────────
# 3. Rule Catalogue
# ─────────────────────────────────────────────────────────────────────────────

class TestRuleCatalog:
    def test_get_all_rules_returns_list(self):
        rules = get_all_rules()
        assert len(rules) >= 12

    def test_rules_have_required_fields(self):
        rules = get_all_rules()
        for r in rules:
            assert r.rule_id != ""
            assert r.category != ""
            assert r.name != ""
            assert r.severity in ("CRITICAL", "HIGH", "MEDIUM", "LOW")
            assert r.rule_type in ("conflict", "drift", "validation")

    def test_filter_by_category_attendance(self):
        rules = get_rules_by_category("ATTENDANCE")
        assert len(rules) >= 2
        assert all(r.category == "ATTENDANCE" for r in rules)

    def test_filter_by_severity_critical(self):
        rules = get_rules_by_severity("CRITICAL")
        assert len(rules) >= 3
        assert all(r.severity == "CRITICAL" for r in rules)

    def test_drift_rules_present(self):
        rules = get_all_rules()
        drift_rules = [r for r in rules if r.rule_type == "drift"]
        assert len(drift_rules) >= 4

    def test_conflict_rules_present(self):
        rules = get_all_rules()
        conflict_rules = [r for r in rules if r.rule_type == "conflict"]
        assert len(conflict_rules) >= 6


# ─────────────────────────────────────────────────────────────────────────────
# 4. Before/After Experiment
# ─────────────────────────────────────────────────────────────────────────────

class TestExperiment:
    def test_experiment_runs_without_error(self):
        result = run_experiment()
        assert "scenarios" in result
        assert "total_tp" in result

    def test_experiment_has_expected_scenarios(self):
        result = run_experiment()
        assert result["total_scenarios"] == 4

    def test_experiment_data_note_present(self):
        result = run_experiment()
        assert "SYNTHETIC" in result["data_note"]

    def test_experiment_avoided_definition_present(self):
        result = run_experiment()
        assert "definition_of_avoided" in result
        assert len(result["definition_of_avoided"]) > 0

    def test_experiment_metrics_calculated(self):
        result = run_experiment()
        assert result["precision"] is None or isinstance(result["precision"], float)
        assert result["recall"] is None or isinstance(result["recall"], float)

    def test_exp001_detects_threshold_change(self):
        result = run_experiment()
        exp001 = next((s for s in result["scenarios"] if s["id"] == "EXP-001"), None)
        assert exp001 is not None
        assert exp001["drift_findings_actionable"] >= 1

    def test_exp002_detects_module_disabled(self):
        result = run_experiment()
        exp002 = next((s for s in result["scenarios"] if s["id"] == "EXP-002"), None)
        assert exp002 is not None
        assert exp002["drift_findings_actionable"] >= 1

    def test_exp004_clean_no_findings(self):
        """EXP-004 has no overrides — candidate identical to baseline — zero drift."""
        result = run_experiment()
        exp004 = next((s for s in result["scenarios"] if s["id"] == "EXP-004"), None)
        assert exp004 is not None
        assert exp004["drift_findings_total"] == 0

    def test_experiment_scenarios_have_all_ids(self):
        result = run_experiment()
        ids = [s["id"] for s in result["scenarios"]]
        assert "EXP-001" in ids
        assert "EXP-002" in ids
        assert "EXP-003" in ids
        assert "EXP-004" in ids


# ─────────────────────────────────────────────────────────────────────────────
# 5. New API Endpoints
# ─────────────────────────────────────────────────────────────────────────────

class TestNewAPIEndpoints:
    def test_get_baselines(self):
        resp = client.get("/api/baselines")
        assert resp.status_code == 200
        data = resp.json()
        assert "baselines" in data
        assert data["count"] >= 4

    def test_get_tenant_baselines(self):
        resp = client.get("/api/baselines/UNI-001")
        assert resp.status_code == 200
        data = resp.json()
        assert "versions" in data
        assert "v1.0" in data["versions"]
        assert "v2.0" in data["versions"]

    def test_get_specific_baseline(self):
        resp = client.get("/api/baselines/UNI-001/v1.0")
        assert resp.status_code == 200
        data = resp.json()
        assert data["tenant_id"] == "UNI-001"
        assert data["version"] == "1.0"

    def test_get_baseline_not_found(self):
        resp = client.get("/api/baselines/NONEXISTENT/v99.0")
        assert resp.status_code == 404

    def test_get_tenant_baselines_not_found(self):
        resp = client.get("/api/baselines/NONEXISTENT-TENANT")
        assert resp.status_code == 404

    def test_drift_endpoint(self):
        baseline = {
            "tenant_id": "TEST",
            "modules": {"attendance": {"enabled": True, "minimum_attendance": 75}},
            "feature_flags": {"online_payment": True},
        }
        candidate = {
            "tenant_id": "TEST",
            "modules": {"attendance": {"enabled": True, "minimum_attendance": 80}},
            "feature_flags": {"online_payment": True},
        }
        resp = client.post("/api/drift", json={
            "baseline": baseline,
            "candidate": candidate,
            "baseline_version": "1.0",
            "candidate_version": "2.0",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["summary"]["changed"] >= 1
        assert len(data["findings"]) >= 1

    def test_compare_against_stored_baseline(self):
        candidate = {
            "tenant_id": "UNI-001",
            "modules": {
                "attendance": {"enabled": True, "minimum_attendance": 75, "exam_eligibility_attendance": 90},
            },
            "feature_flags": {"online_payment": True},
        }
        resp = client.post("/api/baselines/UNI-001/v1.0/compare", json={
            "candidate": candidate,
            "candidate_version": "proposed",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["tenant_id"] == "UNI-001"
        assert data["baseline_version"] == "v1.0"

    def test_compare_baseline_not_found(self):
        resp = client.post("/api/baselines/NONEXISTENT/v1.0/compare", json={
            "candidate": {"modules": {}},
            "candidate_version": "test",
        })
        assert resp.status_code == 404

    def test_version_comparison_endpoint(self):
        resp = client.get("/api/baselines/UNI-001/versions/compare?from_version=v1.0&to_version=v2.0")
        assert resp.status_code == 200
        data = resp.json()
        assert data["summary"]["total_findings"] > 0
        assert len(data["findings"]) > 0

    def test_version_comparison_from_not_found(self):
        resp = client.get("/api/baselines/UNI-001/versions/compare?from_version=v99.0&to_version=v2.0")
        assert resp.status_code == 404

    def test_catalog_endpoint(self):
        resp = client.get("/api/catalog")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] >= 12
        assert "categories" in data
        assert len(data["rules"]) >= 12

    def test_catalog_filter_category(self):
        resp = client.get("/api/catalog?category=ATTENDANCE")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["rules"]) >= 2
        assert all(r["category"] == "ATTENDANCE" for r in data["rules"])

    def test_catalog_filter_severity(self):
        resp = client.get("/api/catalog?severity=CRITICAL")
        assert resp.status_code == 200
        data = resp.json()
        assert all(r["severity"] == "CRITICAL" for r in data["rules"])

    def test_experiment_endpoint(self):
        resp = client.get("/api/experiment")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_scenarios"] == 4
        assert "SYNTHETIC" in data["data_note"]
        assert "definition_of_avoided" in data
