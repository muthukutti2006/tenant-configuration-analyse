"""
Configuration Parser
--------------------
Parses raw JSON/dict input into a structured TenantConfig.
Handles malformed, empty, or unknown-module configurations gracefully.
"""
import json
from typing import Any, Dict, List, Tuple, Optional
from models.config_model import TenantConfig


class ParseResult:
    def __init__(
        self,
        success: bool,
        config: Optional[TenantConfig],
        raw: Dict[str, Any],
        parse_errors: List[str],
    ):
        self.success = success
        self.config = config
        self.raw = raw
        self.parse_errors = parse_errors


def parse_config(raw: Dict[str, Any]) -> ParseResult:
    """
    Attempt to parse a raw dict into a TenantConfig.
    Returns a ParseResult with success flag and any parse errors.
    """
    errors: List[str] = []

    # EDGE CASE 5: Empty configuration
    if not raw:
        return ParseResult(
            success=False,
            config=None,
            raw=raw,
            parse_errors=["Empty configuration provided."],
        )

    # Check required top-level fields
    required_fields = ["tenant_id", "tenant_name", "version", "modules"]
    for field in required_fields:
        if field not in raw:
            errors.append(f"Missing required top-level field: '{field}'")

    if errors:
        return ParseResult(success=False, config=None, raw=raw, parse_errors=errors)

    # EDGE CASE 6: Unknown/unsupported module names
    known_modules = {"admissions", "fees", "attendance", "certificates"}
    modules_raw = raw.get("modules", {})
    if isinstance(modules_raw, dict):
        for mod_name in modules_raw.keys():
            if mod_name not in known_modules:
                errors.append(
                    f"Unknown module '{mod_name}' in configuration. "
                    f"Supported modules: {sorted(known_modules)}"
                )
    else:
        errors.append("'modules' must be an object/dict.")
        return ParseResult(success=False, config=None, raw=raw, parse_errors=errors)

    if errors:
        # Return partial result — unknown modules are parse warnings not fatal
        pass

    try:
        config = TenantConfig(**raw)
        return ParseResult(
            success=True, config=config, raw=raw, parse_errors=errors
        )
    except Exception as exc:
        errors.append(f"Schema validation error: {exc}")
        return ParseResult(success=False, config=None, raw=raw, parse_errors=errors)


def parse_config_from_json(json_str: str) -> ParseResult:
    """Parse from a JSON string."""
    try:
        raw = json.loads(json_str)
    except json.JSONDecodeError as exc:
        return ParseResult(
            success=False,
            config=None,
            raw={},
            parse_errors=[f"Invalid JSON: {exc}"],
        )
    return parse_config(raw)
