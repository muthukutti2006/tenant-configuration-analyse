"""
Pytest test suite for the Tenant-Configuration Analyser backend.
Review-1 test coverage: parser, validator, normalizer, detector, classifier, evidence.

Run from backend/ directory:
    pytest tests/ -v
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from engine.parser import parse_config
from engine.validator import validate_config
from engine.normalizer import normalize_rules
from engine.detector import (
    run_all_detectors,
    detect_direct_rule_conflicts,
    detect_feature_flag_conflicts,
    detect_dependency_conflicts,
    detect_duplicate_contradictory_rules,
)
from engine.classifier import build_conflicts
from engine.evidence import generate_evidence_report
from models.conflict_model import ConflictType, Severity


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures – canonical test configurations
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def normal_config():
    return {
        "tenant_id": "TEST-NORMAL",
        "tenant_name": "Test University",
        "version": "1.0.0",
        "modules": {
            "admissions": {"enabled": True, "minimum_eligibility_percentage": 60},
            "fees": {"enabled": True, "payment_required_before_admission": False, "late_fee_applicable": True, "grace_period_days": 7},
            "attendance": {"enabled": True, "minimum_attendance": 75, "exam_eligibility_attendance": 75},
            "certificates": {"enabled": True, "fee_clearance_required": True, "attendance_clearance_required": False, "digital_signature_required": False},
        },
        "feature_flags": {"online_payment": True, "digital_certificate": False},
    }


@pytest.fixture
def attendance_conflict_config():
    return {
        "tenant_id": "TEST-ATT",
        "tenant_name": "Attendance Conflict University",
        "version": "1.0.0",
        "modules": {
            "admissions": {"enabled": True, "minimum_eligibility_percentage": 60},
            "fees": {"enabled": True, "payment_required_before_admission": False},
            "attendance": {"enabled": True, "minimum_attendance": 75, "exam_eligibility_attendance": 80},
            "certificates": {"enabled": True, "fee_clearance_required": False},
        },
        "feature_flags": {"online_payment": True, "digital_certificate": False},
    }


@pytest.fixture
def feature_flag_conflict_config():
    return {
        "tenant_id": "TEST-FF",
        "tenant_name": "Feature Flag Conflict University",
        "version": "1.0.0",
        "modules": {
            "admissions": {"enabled": True, "minimum_eligibility_percentage": 60},
            "fees": {"enabled": True, "payment_required_before_admission": True},
            "attendance": {"enabled": True, "minimum_attendance": 75},
            "certificates": {"enabled": True, "fee_clearance_required": True},
        },
        "feature_flags": {"online_payment": False, "digital_certificate": False},
    }


@pytest.fixture
def dependency_conflict_config():
    return {
        "tenant_id": "TEST-DEP",
        "tenant_name": "Dependency Conflict University",
        "version": "1.0.0",
        "modules": {
            "admissions": {"enabled": True, "minimum_eligibility_percentage": 60},
            "fees": {"enabled": False, "payment_required_before_admission": False},
            "attendance": {"enabled": True, "minimum_attendance": 75},
            "certificates": {"enabled": True, "fee_clearance_required": True},
        },
        "feature_flags": {"online_payment": False, "digital_certificate": False},
    }


@pytest.fixture
def duplicate_rule_config():
    return {
        "tenant_id": "TEST-DUP",
        "tenant_name": "Duplicate Rule University",
        "version": "1.0.0",
        "modules": {
            "admissions": {"enabled": True, "minimum_eligibility_percentage": 60},
            "fees": {"enabled": True, "payment_required_before_admission": False, "grace_period_days": 14, "late_fee_applicable": False},
            "attendance": {"enabled": True, "minimum_attendance": 75, "exam_eligibility_attendance": 75},
            "certificates": {"enabled": True, "fee_clearance_required": True},
        },
        "feature_flags": {"online_payment": True, "digital_certificate": False},
    }


@pytest.fixture
def invalid_config():
    return {
        "tenant_id": "TEST-INVALID",
        "tenant_name": "Invalid University",
        "version": "1.0.0",
        "modules": {
            "admissions": {"enabled": True, "minimum_eligibility_percentage": 110},
            "fees": {"enabled": True},
            "attendance": {"enabled": True, "minimum_attendance": -10},
            "certificates": {"enabled": True},
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# 1. Parser Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestParser:
    def test_parse_valid_config(self, normal_config):
        result = parse_config(normal_config)
        assert result.success is True
        assert result.config is not None
        assert result.config.tenant_id == "TEST-NORMAL"

    def test_parse_empty_config(self):
        """EDGE CASE 5: Empty configuration."""
        result = parse_config({})
        assert result.success is False
        assert any("Empty" in e for e in result.parse_errors)

    def test_parse_missing_required_field(self):
        """EDGE CASE 1: Missing required field."""
        result = parse_config({
            "tenant_name": "Missing ID University",
            "version": "1.0.0",
            "modules": {}
        })
        assert result.success is False
        assert any("tenant_id" in e for e in result.parse_errors)

    def test_parse_missing_modules(self):
        result = parse_config({
            "tenant_id": "T1",
            "tenant_name": "Test",
            "version": "1.0.0"
        })
        assert result.success is False
        assert any("modules" in e for e in result.parse_errors)

    def test_parse_unknown_module(self):
        """EDGE CASE 6: Unknown module."""
        result = parse_config({
            "tenant_id": "T2",
            "tenant_name": "Test",
            "version": "1.0.0",
            "modules": {
                "admissions": {"enabled": True},
                "alien_module": {"enabled": True}
            }
        })
        # Should produce a parse error about unknown module
        assert any("alien_module" in e for e in result.parse_errors)

    def test_parse_invalid_json_string(self):
        from engine.parser import parse_config_from_json
        result = parse_config_from_json("{invalid json}")
        assert result.success is False
        assert any("Invalid JSON" in e for e in result.parse_errors)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Validator Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestValidator:
    def test_valid_config_no_errors(self, normal_config):
        errors = validate_config(normal_config)
        assert len(errors) == 0

    def test_percentage_above_100(self, invalid_config):
        """EDGE CASE 4: attendance > 100%."""
        errors = validate_config(invalid_config)
        fields = [e.field for e in errors]
        assert any("minimum_eligibility_percentage" in f for f in fields)

    def test_percentage_below_0(self, invalid_config):
        errors = validate_config(invalid_config)
        fields = [e.field for e in errors]
        assert any("minimum_attendance" in f for f in fields)

    def test_invalid_boolean_type(self):
        config = {
            "tenant_id": "T3",
            "tenant_name": "Test",
            "version": "1.0.0",
            "modules": {
                "fees": {"enabled": "yes", "payment_required_before_admission": True}
            }
        }
        errors = validate_config(config)
        fields = [e.field for e in errors]
        assert any("fees.enabled" in f for f in fields)

    def test_missing_enabled_field(self):
        config = {
            "tenant_id": "T4",
            "tenant_name": "Test",
            "version": "1.0.0",
            "modules": {
                "admissions": {"minimum_eligibility_percentage": 60}  # missing 'enabled'
            }
        }
        errors = validate_config(config)
        assert any("enabled" in e.field for e in errors)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Normalizer Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestNormalizer:
    def test_normalize_produces_rules(self, normal_config):
        result = parse_config(normal_config)
        assert result.success
        rules = normalize_rules(result.config)
        assert len(rules) > 0

    def test_normalize_includes_all_modules(self, normal_config):
        result = parse_config(normal_config)
        rules = normalize_rules(result.config)
        modules = {r["module"] for r in rules}
        assert "admissions" in modules
        assert "fees" in modules
        assert "attendance" in modules
        assert "certificates" in modules

    def test_normalize_includes_feature_flags(self, normal_config):
        result = parse_config(normal_config)
        rules = normalize_rules(result.config)
        modules = {r["module"] for r in rules}
        assert "feature_flags" in modules

    def test_normalize_rule_paths_are_unique(self, normal_config):
        result = parse_config(normal_config)
        rules = normalize_rules(result.config)
        paths = [r["path"] for r in rules]
        assert len(paths) == len(set(paths)), "Duplicate rule paths found"


# ─────────────────────────────────────────────────────────────────────────────
# 4. Conflict Detection Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestDetector:
    def test_no_conflicts_on_normal_config(self, normal_config):
        conflicts = run_all_detectors(normal_config)
        # Normal config should have only the duplicate attendance rule (LOW)
        types = [c["conflict_type"] for c in conflicts]
        assert ConflictType.DEPENDENCY_CONFLICT not in types
        assert ConflictType.FEATURE_FLAG_CONFLICT not in types

    def test_direct_rule_conflict_detected(self, attendance_conflict_config):
        conflicts = detect_direct_rule_conflicts(attendance_conflict_config)
        assert len(conflicts) >= 1
        types = [c["conflict_type"] for c in conflicts]
        assert ConflictType.DIRECT_RULE_CONFLICT in types

    def test_feature_flag_conflict_detected(self, feature_flag_conflict_config):
        """EDGE CASE 2: Conflicting feature flags."""
        conflicts = detect_feature_flag_conflicts(feature_flag_conflict_config)
        assert len(conflicts) >= 1
        assert conflicts[0]["conflict_type"] == ConflictType.FEATURE_FLAG_CONFLICT

    def test_dependency_conflict_detected(self, dependency_conflict_config):
        """EDGE CASE 3: Module dependency conflict."""
        conflicts = detect_dependency_conflicts(dependency_conflict_config)
        assert len(conflicts) >= 1
        assert conflicts[0]["conflict_type"] == ConflictType.DEPENDENCY_CONFLICT

    def test_duplicate_rule_detected(self, duplicate_rule_config):
        conflicts = detect_duplicate_contradictory_rules(duplicate_rule_config)
        assert len(conflicts) >= 1

    def test_multiple_conflicts_detected(self):
        """All conflict types in one config."""
        multi = {
            "tenant_id": "TEST-MULTI",
            "tenant_name": "Multi Conflict University",
            "version": "1.0.0",
            "modules": {
                "admissions": {"enabled": True, "minimum_eligibility_percentage": 60},
                "fees": {"enabled": False, "payment_required_before_admission": True},
                "attendance": {"enabled": False, "minimum_attendance": 75, "exam_eligibility_attendance": 90},
                "certificates": {"enabled": True, "fee_clearance_required": True, "attendance_clearance_required": True, "digital_signature_required": True},
            },
            "feature_flags": {"online_payment": False, "digital_certificate": False},
        }
        conflicts = run_all_detectors(multi)
        types = {c["conflict_type"] for c in conflicts}
        assert ConflictType.DIRECT_RULE_CONFLICT in types
        assert ConflictType.FEATURE_FLAG_CONFLICT in types
        assert ConflictType.DEPENDENCY_CONFLICT in types

    def test_no_false_positive_on_valid_thresholds(self):
        """No direct conflict when min_attendance < exam_eligibility_attendance is inverted."""
        config = {
            "tenant_id": "T5",
            "tenant_name": "Valid",
            "version": "1.0.0",
            "modules": {
                "attendance": {"enabled": True, "minimum_attendance": 80, "exam_eligibility_attendance": 75}
            },
            "feature_flags": {}
        }
        # exam threshold < min attendance → student may miss exam even when attending enough
        # This is not a conflict by our rule definition (only exam > min triggers it)
        conflicts = detect_direct_rule_conflicts(config)
        attendance_mismatch = [c for c in conflicts if "Mismatch" in c["title"] and c["module"] == "attendance"]
        assert len(attendance_mismatch) == 0


# ─────────────────────────────────────────────────────────────────────────────
# 5. Severity Classification Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestClassifier:
    def test_dependency_conflict_is_critical(self, dependency_conflict_config):
        raw_conflicts = run_all_detectors(dependency_conflict_config)
        conflicts = build_conflicts(raw_conflicts, "TEST-DEP")
        dep_conflicts = [c for c in conflicts if c.conflict_type == ConflictType.DEPENDENCY_CONFLICT]
        assert all(c.severity == Severity.CRITICAL for c in dep_conflicts)

    def test_direct_rule_conflict_is_high(self, attendance_conflict_config):
        raw_conflicts = run_all_detectors(attendance_conflict_config)
        conflicts = build_conflicts(raw_conflicts, "TEST-ATT")
        direct = [c for c in conflicts if c.conflict_type == ConflictType.DIRECT_RULE_CONFLICT]
        assert all(c.severity == Severity.HIGH for c in direct)

    def test_duplicate_rule_is_low_or_medium(self, normal_config):
        raw_conflicts = run_all_detectors(normal_config)
        conflicts = build_conflicts(raw_conflicts, "TEST-NORMAL")
        dup = [c for c in conflicts if c.conflict_type == ConflictType.DUPLICATE_OR_CONTRADICTORY_RULE]
        for c in dup:
            assert c.severity in (Severity.LOW, Severity.MEDIUM)

    def test_invalid_config_is_critical(self, invalid_config):
        validation_errors = validate_config(invalid_config)
        raw_conflicts = run_all_detectors(invalid_config, validation_errors)
        conflicts = build_conflicts(raw_conflicts, "TEST-INVALID")
        invalid_cf = [c for c in conflicts if c.conflict_type == ConflictType.INVALID_CONFIGURATION]
        assert len(invalid_cf) > 0


# ─────────────────────────────────────────────────────────────────────────────
# 6. Evidence Generation Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestEvidence:
    def test_high_conflicts_have_evidence(self, attendance_conflict_config):
        raw_conflicts = run_all_detectors(attendance_conflict_config)
        conflicts = build_conflicts(raw_conflicts, "TEST-ATT")
        high = [c for c in conflicts if c.severity == Severity.HIGH]
        assert len(high) > 0
        for c in high:
            assert c.evidence is not None
            assert c.evidence.tenant_id == "TEST-ATT"
            assert c.evidence.why_conflict != ""
            assert c.evidence.recommendation != ""

    def test_critical_conflicts_have_evidence(self, dependency_conflict_config):
        raw_conflicts = run_all_detectors(dependency_conflict_config)
        conflicts = build_conflicts(raw_conflicts, "TEST-DEP")
        critical = [c for c in conflicts if c.severity == Severity.CRITICAL]
        for c in critical:
            assert c.evidence is not None

    def test_low_medium_conflicts_have_no_evidence(self, normal_config):
        raw_conflicts = run_all_detectors(normal_config)
        conflicts = build_conflicts(raw_conflicts, "TEST-NORMAL")
        low_med = [c for c in conflicts if c.severity in (Severity.LOW, Severity.MEDIUM)]
        for c in low_med:
            assert c.evidence is None

    def test_evidence_report_structure(self, dependency_conflict_config):
        raw_conflicts = run_all_detectors(dependency_conflict_config)
        conflicts = build_conflicts(raw_conflicts, "TEST-DEP")
        report = generate_evidence_report(conflicts)
        assert len(report) > 0
        for r in report:
            assert "conflict_id" in r
            assert "evidence" in r
            assert "rule_a" in r["evidence"]
            assert "recommendation" in r["evidence"]
            assert "why_this_is_a_conflict" in r["evidence"]


# ─────────────────────────────────────────────────────────────────────────────
# 7. Edge Cases
# ─────────────────────────────────────────────────────────────────────────────

class TestEdgeCases:
    def test_edge_missing_required_field(self):
        """EDGE CASE 1: Missing required configuration field."""
        result = parse_config({"tenant_name": "Test", "version": "1.0.0", "modules": {}})
        assert result.success is False
        assert len(result.parse_errors) > 0

    def test_edge_conflicting_feature_flags(self, feature_flag_conflict_config):
        """EDGE CASE 2: Conflicting feature flags."""
        raw = run_all_detectors(feature_flag_conflict_config)
        conflicts = build_conflicts(raw, "TEST-FF")
        ff_conflicts = [c for c in conflicts if c.conflict_type == ConflictType.FEATURE_FLAG_CONFLICT]
        assert len(ff_conflicts) >= 1

    def test_edge_module_dependency_conflict(self, dependency_conflict_config):
        """EDGE CASE 3: Module dependency conflict."""
        raw = run_all_detectors(dependency_conflict_config)
        conflicts = build_conflicts(raw, "TEST-DEP")
        dep = [c for c in conflicts if c.conflict_type == ConflictType.DEPENDENCY_CONFLICT]
        assert len(dep) >= 1
        assert dep[0].severity == Severity.CRITICAL

    def test_edge_attendance_above_100(self):
        """EDGE CASE 4: Attendance percentage > 100."""
        config = {
            "tenant_id": "T6", "tenant_name": "T", "version": "1.0.0",
            "modules": {"attendance": {"enabled": True, "minimum_attendance": 105}}
        }
        errors = validate_config(config)
        assert any("105" in e.message for e in errors)

    def test_edge_empty_configuration(self):
        """EDGE CASE 5: Empty configuration."""
        result = parse_config({})
        assert result.success is False

    def test_edge_unknown_module(self):
        """EDGE CASE 6: Unknown module."""
        result = parse_config({
            "tenant_id": "T7", "tenant_name": "T", "version": "1.0.0",
            "modules": {"unknown_module_xyz": {"enabled": True}}
        })
        assert any("unknown_module_xyz" in e for e in result.parse_errors)


# ─────────────────────────────────────────────────────────────────────────────
# 8. API Integration Tests (using TestClient)
# ─────────────────────────────────────────────────────────────────────────────

class TestAPI:
    @pytest.fixture(autouse=True)
    def setup_client(self):
        from fastapi.testclient import TestClient
        from main import app
        self.client = TestClient(app)

    def test_health_endpoint(self):
        resp = self.client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_analyze_valid_config(self, normal_config):
        resp = self.client.post("/api/analyze", json={"config": normal_config})
        assert resp.status_code == 200
        data = resp.json()
        assert data["tenant_id"] == "TEST-NORMAL"
        assert "summary" in data
        assert "conflicts" in data

    def test_analyze_returns_real_conflicts(self, attendance_conflict_config):
        resp = self.client.post("/api/analyze", json={"config": attendance_conflict_config})
        assert resp.status_code == 200
        data = resp.json()
        assert data["summary"]["total_conflicts"] > 0

    def test_list_configurations(self):
        resp = self.client.get("/api/configurations")
        assert resp.status_code == 200
        data = resp.json()
        assert "configurations" in data
        assert data["count"] >= 8

    def test_analyze_all(self):
        resp = self.client.get("/api/analyze-all")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_tenants" in data
        assert data["total_tenants"] >= 8

    def test_list_all_conflicts(self):
        resp = self.client.get("/api/conflicts")
        assert resp.status_code == 200
        data = resp.json()
        assert "conflicts" in data

    def test_list_rules(self):
        resp = self.client.get("/api/rules")
        assert resp.status_code == 200
        data = resp.json()
        assert "rules" in data
        assert len(data["rules"]) >= 10
