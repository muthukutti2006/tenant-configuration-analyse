"""
Baseline Store
==============
Loads and resolves approved baseline configurations from disk.

Baselines are stored as versioned JSON files:
  data/baselines/{tenant_id}/{version}.json

Each file is an approved, source-of-truth configuration snapshot.
The filename stem is used as the version key (e.g. v1.0.json → "v1.0").
"""
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from models.drift_model import BaselineRecord

BASELINE_DIR = Path(__file__).parent.parent / "data" / "baselines"


def list_tenants_with_baselines() -> List[str]:
    """Return all tenant IDs that have at least one baseline."""
    if not BASELINE_DIR.exists():
        return []
    return sorted([d.name for d in BASELINE_DIR.iterdir() if d.is_dir()])


def list_versions(tenant_id: str) -> List[str]:
    """Return all available baseline version stems for a tenant (sorted)."""
    tenant_dir = BASELINE_DIR / tenant_id
    if not tenant_dir.exists():
        return []
    return sorted([f.stem for f in tenant_dir.glob("*.json")])


def load_baseline(tenant_id: str, version: str) -> Optional[Dict[str, Any]]:
    """
    Load a specific baseline version for a tenant.
    The version must match the filename stem (e.g. "v1.0" for "v1.0.json").
    Returns None if not found.
    """
    path = BASELINE_DIR / tenant_id / f"{version}.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def load_latest_baseline(tenant_id: str) -> Optional[Dict[str, Any]]:
    """Load the latest available baseline for a tenant."""
    versions = list_versions(tenant_id)
    if not versions:
        return None
    return load_baseline(tenant_id, versions[-1])


def get_baseline_record(tenant_id: str, version: str) -> Optional[BaselineRecord]:
    """Return a BaselineRecord for the given tenant + version."""
    raw = load_baseline(tenant_id, version)
    if raw is None:
        return None
    return BaselineRecord(
        tenant_id=raw.get("tenant_id", tenant_id),
        tenant_name=raw.get("tenant_name", "Unknown"),
        version=raw.get("version", version),
        baseline_label=raw.get("baseline_label", "approved"),
        timestamp=raw.get("timestamp"),
        approved_by=raw.get("approved_by"),
        config=raw,
    )


def list_all_baselines() -> List[BaselineRecord]:
    """Return all baselines across all tenants."""
    records: List[BaselineRecord] = []
    for tenant_id in list_tenants_with_baselines():
        for version in list_versions(tenant_id):
            rec = get_baseline_record(tenant_id, version)
            if rec:
                records.append(rec)
    return records
