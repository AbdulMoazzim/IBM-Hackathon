import pytest
from pydantic import ValidationError

from vibeguard.app.models.evidence import SecurityEvidence


def test_sast_evidence_is_valid():
    item = SecurityEvidence.model_validate({
        "id": "SAST-001",
        "category": "authorization",
        "source": "sast",
        "severity": "high",
        "confidence": 0.92,
        "target": {"type": "file", "value": "src/orders.ts"},
        "evidence": {"type": "code", "content": "return db.get(id)", "line": 42},
        "metadata": {"rule_id": "SAST-AUTH-001"},
    })
    assert item.source == "sast"
    assert item.evidence.line == 42
    assert item.metadata.rule_id == "SAST-AUTH-001"


def test_dast_evidence_is_valid():
    item = SecurityEvidence.model_validate({
        "id": "DAST-001",
        "category": "authentication",
        "source": "dast",
        "severity": "critical",
        "confidence": 0.8,
        "target": {"type": "endpoint", "value": "/api/orders"},
        "evidence": {
            "type": "http",
            "status_code": 200,
            "response_excerpt": "orders returned",
        },
        "metadata": {"test_id": "DAST-AUTH-001"},
    })
    assert item.source == "dast"
    assert item.evidence.status_code == 200
    assert item.metadata.test_id == "DAST-AUTH-001"


@pytest.mark.parametrize("field,value", [
    ("source", "scanner"),
    ("severity", "info"),
    ("category", "xss"),
])
def test_controlled_values_are_rejected(field, value):
    payload = {
        "id": "E-1",
        "category": "configuration",
        "source": "sast",
        "severity": "low",
        "confidence": 0.5,
        "target": {"type": "project", "value": "demo"},
        "evidence": {"type": "generic"},
    }
    payload[field] = value
    with pytest.raises(ValidationError):
        SecurityEvidence.model_validate(payload)


@pytest.mark.parametrize("confidence", [-0.01, 1.01])
def test_confidence_must_be_between_zero_and_one(confidence):
    with pytest.raises(ValidationError):
        SecurityEvidence.model_validate({
            "id": "E-2",
            "category": "secrets",
            "source": "combined",
            "severity": "medium",
            "confidence": confidence,
            "target": {"type": "project", "value": "demo"},
            "evidence": {"type": "generic"},
        })
