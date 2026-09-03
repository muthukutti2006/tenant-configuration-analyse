"""
Pydantic data models for tenant configurations.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AdmissionsModule(BaseModel):
    enabled: bool
    minimum_eligibility_percentage: Optional[float] = None
    exam_eligibility_attendance: Optional[float] = None
    merit_based_selection: Optional[bool] = None


class FeesModule(BaseModel):
    enabled: bool
    payment_required_before_admission: Optional[bool] = None
    grace_period_days: Optional[int] = None
    late_fee_applicable: Optional[bool] = None


class AttendanceModule(BaseModel):
    enabled: bool
    minimum_attendance: Optional[float] = None
    exam_eligibility_attendance: Optional[float] = None
    attendance_grace_period: Optional[int] = None


class CertificatesModule(BaseModel):
    enabled: bool
    fee_clearance_required: Optional[bool] = None
    attendance_clearance_required: Optional[bool] = None
    digital_signature_required: Optional[bool] = None


class FeatureFlags(BaseModel):
    online_payment: Optional[bool] = None
    digital_certificate: Optional[bool] = None
    self_registration: Optional[bool] = None
    bulk_upload: Optional[bool] = None
    api_integration: Optional[bool] = None


class TenantModules(BaseModel):
    admissions: Optional[AdmissionsModule] = None
    fees: Optional[FeesModule] = None
    attendance: Optional[AttendanceModule] = None
    certificates: Optional[CertificatesModule] = None


class TenantConfig(BaseModel):
    tenant_id: str
    tenant_name: str
    version: str
    modules: TenantModules
    feature_flags: Optional[FeatureFlags] = None
    metadata: Optional[Dict[str, Any]] = None


class AnalyzeRequest(BaseModel):
    config: Dict[str, Any]
