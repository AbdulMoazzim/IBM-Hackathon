import re
from typing import Any

_SECRET_ASSIGNMENT = re.compile(r"(?i)(\b(?:api[_-]?key|secret|token|password|authorization)\b\s*[:=]\s*['\"]?)([A-Za-z0-9_./+=:-]{8,})")
_BEARER = re.compile(r"(?i)(\bBearer\s+)([A-Za-z0-9._~+/=-]{8,})")
_AWS_KEY = re.compile(r"\bAKIA[0-9A-Z]{16}\b")

def redact_secrets(value: Any) -> Any:
    if isinstance(value, str):
        value = _SECRET_ASSIGNMENT.sub(r"\1[REDACTED]", value)
        value = _BEARER.sub(r"\1[REDACTED]", value)
        return _AWS_KEY.sub("[REDACTED]", value)
    if isinstance(value, dict):
        return {key: redact_secrets(item) for key, item in value.items()}
    if isinstance(value, list):
        return [redact_secrets(item) for item in value]
    return value
