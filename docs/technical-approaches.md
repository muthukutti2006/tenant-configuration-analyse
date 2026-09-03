# Technical Approaches: Rule-Based vs ML/Anomaly Detection

## Summary

Two candidate approaches were evaluated for the Tenant-Configuration Analyser conflict detection engine.

---

## Approach 1: Rule-Based Conflict Detection ✓ SELECTED

### How It Works

1. The configuration is parsed and validated against a Pydantic schema.
2. The normalizer flattens all settings into canonical `(path → value)` pairs.
3. Five named detector functions run explicit logical checks:
   - `detect_direct_rule_conflicts()` — same concept, different values
   - `detect_feature_flag_conflicts()` — flag disables a required feature
   - `detect_dependency_conflicts()` — module A needs module B which is disabled
   - `detect_duplicate_contradictory_rules()` — redundant or contradictory settings
   - `detect_invalid_configurations()` — schema/type/range violations
4. The classifier assigns severity per a documented policy table.
5. The evidence generator produces field-level structured justification.

### Advantages

- **Fully deterministic** — same input always produces the same output.
- **Explainable** — every conflict maps to a named rule, specific fields, and documented severity rationale.
- **No training data required** — pure logic; works from day one.
- **Auditable** — rule ID, field path, value pair, and evidence are always returned.
- **Fast** — sub-millisecond detection for typical tenant configurations.
- **Tunable** — false positives reduced by refining rule conditions.
- **Transparent severity policy** — CRITICAL/HIGH/MEDIUM/LOW defined in code with documented rationale.

### Disadvantages

- Cannot detect novel conflict patterns not anticipated by rule authors.
- Rule set must be maintained as the configuration schema evolves.
- Scales linearly with the number of rules written; does not generalise.

### Evaluation

| Criterion | Score | Notes |
|-----------|-------|-------|
| Explainability | ★★★★★ | Every conflict has a named rule, field evidence, and recommendation |
| Auditability | ★★★★★ | Full trace: rule ID → fields → values → severity rationale |
| Data requirements | ★★★★★ | None — no historical data needed |
| False positive risk | ★★★★☆ | LOW; conditions are precise and tunable |
| False negative risk | ★★★☆☆ | MEDIUM; new patterns not covered until rules are added |
| Implementation speed | ★★★★★ | Can start immediately; no training pipeline |

---

## Approach 2: ML / Anomaly Detection

### How It Works

1. Historical tenant configurations are collected and labelled (normal / conflict).
2. Feature engineering converts configuration fields into numeric vectors.
3. An anomaly detection model (Isolation Forest, Autoencoder, or similar) is trained.
4. At inference, each new configuration is scored against the learned distribution.
5. Configurations with anomaly score above threshold trigger conflict alerts.
6. Optionally, SHAP values or LIME are used to produce post-hoc explanations.

### Advantages

- Can detect novel, unanticipated conflict patterns from data.
- Generalises across configurations; no need to write explicit rules for every case.
- Potentially captures subtle cross-field correlations missed by rule authors.

### Disadvantages

- **No labelled data available** at project start — training is infeasible.
- **Black-box decisions** are difficult to explain to university administrators without additional tooling.
- **Higher false-positive risk** — anomaly detectors flag novel-but-valid configurations.
- Model retraining required when the configuration schema changes.
- Threshold tuning requires domain expertise and is tenant-specific.
- Cannot guarantee CRITICAL severity assignments map to actual business impact.

### Evaluation

| Criterion | Score | Notes |
|-----------|-------|-------|
| Explainability | ★★☆☆☆ | Anomaly scores don't map to business rules without SHAP/LIME |
| Auditability | ★★☆☆☆ | Model internals opaque; hard to audit a specific decision |
| Data requirements | ★☆☆☆☆ | Needs significant labelled historical data — unavailable at Review-1 |
| False positive risk | ★★★☆☆ | HIGH; valid but unusual configs flagged as anomalies |
| False negative risk | ★★★★☆ | LOW-MEDIUM once trained on representative data |
| Implementation speed | ★★☆☆☆ | Requires data collection, feature engineering, training pipeline |

---

## Head-to-Head Comparison

| Criterion | Rule-Based | ML/Anomaly |
|-----------|-----------|-----------|
| Explainability | Excellent | Poor–Moderate |
| Auditability | High | Low |
| Data requirements | None | High (labelled history) |
| False positive risk | Low | High |
| False negative risk | Medium | Medium (when trained) |
| Determinism | Yes | No (stochastic) |
| Implementation speed | Immediate | Weeks–months |
| University trust | High | Lower without explainability |
| Regulatory compliance | Easy | Harder |

---

## Selection Justification

**Rule-Based Conflict Detection was selected** for the following reasons:

1. **Explainability requirement:** University administrators need to understand exactly why a configuration was flagged. Rule-based evidence provides field-level, human-readable justification without additional tooling.

2. **Deterministic policies:** Configuration constraints (fee clearance requires fees module) are formally defined business rules, not statistical patterns. They are better modelled as explicit logic.

3. **No historical data available:** The project begins without labelled conflict datasets. ML training is infeasible and would produce an unreliable model at this stage.

4. **Auditability:** Each conflict maps to a rule ID, conflict type, field paths, and severity rationale — essential for academic evaluation and stakeholder trust.

5. **Regulatory alignment:** Universities may be subject to governance requirements that demand traceable, auditable decision paths. A black-box model would be difficult to justify.

---

## Future Integration Path

The architecture deliberately decouples the detection engine via a clean function interface:

```python
# Current: rule-based
raw_conflicts = run_all_detectors(raw, validation_errors)

# Future: ML channel runs in parallel
ml_conflicts = run_anomaly_detector(raw)  # added later, same interface

# Both results merged and de-duplicated
all_conflicts = merge_and_deduplicate(raw_conflicts, ml_conflicts)
```

The ML module can be added as an **opt-in experimental channel** per tenant, producing supplementary signals alongside rule-based evidence — once sufficient labelled data is collected.
