# Conflict Detection Rules Reference

## Overview

All conflict detection rules are implemented in `backend/engine/detector.py`.  
Severity is assigned in `backend/engine/classifier.py` using a documented policy table.

---

## Conflict Categories

### 1. DIRECT_RULE_CONFLICT

Two configuration rules governing the same decision specify contradictory values.

#### Rule R001 — Attendance Threshold Mismatch

| Property | Value |
|----------|-------|
| ID | R001 |
| Detector | `detect_direct_rule_conflicts()` |
| Default Severity | HIGH |
| Module | attendance |

**Condition:**  
`attendance.minimum_attendance < attendance.exam_eligibility_attendance`

**Example:**
```json
"attendance": {
  "minimum_attendance": 75,
  "exam_eligibility_attendance": 80
}
```

**Why it conflicts:** Students who meet the minimum attendance cannot sit exams. The minimum_attendance rule is rendered meaningless.

**Evidence:** YES (HIGH severity)

---

#### Rule R002 — Cross-Module Exam Eligibility Attendance Mismatch

| Property | Value |
|----------|-------|
| ID | R002 |
| Detector | `detect_direct_rule_conflicts()` |
| Default Severity | HIGH |
| Modules | admissions, attendance |

**Condition:**  
`admissions.exam_eligibility_attendance ≠ attendance.exam_eligibility_attendance`

**Why it conflicts:** Two modules define the same concept with different values. The system cannot choose authoritatively.

**Evidence:** YES

---

### 2. FEATURE_FLAG_CONFLICT

A feature flag disables functionality that another rule in the configuration depends upon.

#### Rule R003 — Online Payment Disabled but Payment Required

| Property | Value |
|----------|-------|
| ID | R003 |
| Detector | `detect_feature_flag_conflicts()` |
| Default Severity | HIGH |
| Modules | feature_flags, fees |

**Condition:**  
`feature_flags.online_payment = false` AND `fees.payment_required_before_admission = true`

**Example:**
```json
"feature_flags": { "online_payment": false },
"modules": { "fees": { "payment_required_before_admission": true } }
```

**Why it conflicts:** The only payment mechanism is disabled while payment is mandatory. Students cannot complete admission.

**Evidence:** YES

---

#### Rule R004 — Digital Certificate Disabled but Digital Signature Required

| Property | Value |
|----------|-------|
| ID | R004 |
| Detector | `detect_feature_flag_conflicts()` |
| Default Severity | MEDIUM |
| Modules | feature_flags, certificates |

**Condition:**  
`feature_flags.digital_certificate = false` AND `certificates.digital_signature_required = true`

**Why it conflicts:** The digital certificate pipeline is disabled; digital signing cannot proceed.

**Evidence:** NO (MEDIUM)

---

### 3. DEPENDENCY_CONFLICT

Module A requires Module B to be operational, but Module B is disabled.

#### Rule R005 — Certificate Fee Clearance Without Fees Module

| Property | Value |
|----------|-------|
| ID | R005 |
| Detector | `detect_dependency_conflicts()` |
| Default Severity | CRITICAL |
| Modules | certificates, fees |

**Condition:**  
`certificates.enabled = true` AND `certificates.fee_clearance_required = true` AND `fees.enabled = false`

**Why it conflicts:** Fee clearance data cannot be obtained from a disabled module. Certificate issuance becomes unreliable.

**Evidence:** YES (CRITICAL)

---

#### Rule R006 — Certificate Attendance Clearance Without Attendance Module

| Property | Value |
|----------|-------|
| ID | R006 |
| Detector | `detect_dependency_conflicts()` |
| Default Severity | CRITICAL |
| Modules | certificates, attendance |

**Condition:**  
`certificates.attendance_clearance_required = true` AND `attendance.enabled = false`

**Evidence:** YES (CRITICAL)

---

#### Rule R007 — Fee Payment Before Admission Without Admissions Module

| Property | Value |
|----------|-------|
| ID | R007 |
| Detector | `detect_dependency_conflicts()` |
| Default Severity | HIGH |
| Modules | fees, admissions |

**Condition:**  
`fees.payment_required_before_admission = true` AND `admissions.enabled = false`

**Evidence:** YES

---

### 4. DUPLICATE_OR_CONTRADICTORY_RULE

The same concept is defined redundantly or with internally contradictory intent.

#### Rule R008 — Duplicate Attendance Threshold

| Property | Value |
|----------|-------|
| ID | R008 |
| Detector | `detect_duplicate_contradictory_rules()` |
| Default Severity | LOW |
| Module | attendance |

**Condition:**  
`attendance.minimum_attendance == attendance.exam_eligibility_attendance` (same non-null value)

**Why it conflicts:** Redundant fields create maintenance risk — a future edit to one may miss the other.

**Evidence:** NO (LOW)

---

#### Rule R009 — Grace Period Without Late Fee

| Property | Value |
|----------|-------|
| ID | R009 |
| Detector | `detect_duplicate_contradictory_rules()` |
| Default Severity | MEDIUM |
| Module | fees |

**Condition:**  
`fees.late_fee_applicable = false` AND `fees.grace_period_days > 0`

**Why it conflicts:** A grace period only has meaning if late fees can be applied. The combination implies contradictory intent.

**Evidence:** NO (MEDIUM)

---

### 5. INVALID_CONFIGURATION

A configuration value violates schema constraints (type, range, required field).

#### Rule R010 — Percentage Out of Range

| Property | Value |
|----------|-------|
| ID | R010 |
| Detector | `detect_invalid_configurations()` via `validator.py` |
| Default Severity | CRITICAL |
| Modules | admissions, attendance |

**Condition:**  
Any percentage field (`minimum_eligibility_percentage`, `minimum_attendance`, `exam_eligibility_attendance`) is outside `[0, 100]`.

**Examples:**
- `minimum_attendance = -10` → INVALID
- `minimum_eligibility_percentage = 110` → INVALID

**Evidence:** YES (CRITICAL)

Additional validation checks (not named rules but propagated as INVALID_CONFIGURATION):
- Non-boolean `enabled` field (e.g., `"yes"`)
- Missing `enabled` field on a present module
- Empty or non-string `tenant_id` or `version`

---

## Severity Policy Quick Reference

| Severity | Condition | Evidence Required |
|----------|-----------|------------------|
| CRITICAL | Deployment failure or major incorrect business behavior | YES |
| HIGH | Important student-service decision affected | YES |
| MEDIUM | Limited impact inconsistency | NO |
| LOW | Minor redundancy or advisory | NO |

## Adding New Rules

To add a new conflict rule:

1. Add the detector logic to the appropriate function in `engine/detector.py`  
   (or create a new function and register it in `run_all_detectors()`)
2. Add a title-level severity override to `_TITLE_OVERRIDES` in `engine/classifier.py`
3. Add a rule entry to the `GET /api/rules` endpoint in `main.py`
4. Write a pytest test in `tests/test_engine.py`
