import json

from vibeguard.app.llm.analyst import SecurityAnalyst
from vibeguard.app.models.evidence import SecurityEvidence
from vibeguard.app.models.findings import ScannerFinding
from vibeguard.app.orchestration.agent import ToolCallingAgent
from vibeguard.app.tools.registry import ToolRegistry


def test_sast_and_dast_evidence_correlate_to_one_verified_finding(tmp_path):
    sast = SecurityEvidence.model_validate({
        "id": "EVD-SAST-001",
        "category": "authorization",
        "source": "sast",
        "severity": "high",
        "confidence": 0.80,
        "target": {"type": "endpoint", "value": "GET /api/orders/[id]"},
        "evidence": {
            "type": "code",
            "content": "const order = await db.orders.findById(id)",
            "line": 42,
        },
        "metadata": {"rule_id": "SAST-AUTH-001"},
    })
    dast = SecurityEvidence.model_validate({
        "id": "EVD-DAST-001",
        "category": "authorization",
        "source": "dast",
        "severity": "high",
        "confidence": 0.95,
        "target": {"type": "endpoint", "value": "GET /api/orders/123"},
        "evidence": {
            "type": "http",
            "status_code": 200,
            "response_excerpt": "Order 123 belongs to User B",
        },
        "metadata": {"test_id": "DAST-AUTH-001"},
    })

    class CorrelationProvider:
        def __init__(self):
            self.messages = []

        def complete(self, messages, tools):
            self.messages = messages
            user_payload = json.loads(messages[1]["content"])
            serialized = json.dumps(user_payload)
            assert "EVD-SAST-001" in serialized
            assert "EVD-DAST-001" in serialized
            assert "SAST-AUTH-001" in serialized
            assert "DAST-AUTH-001" in serialized
            return {
                "kind": "final",
                "analysis": {
                    "id": "VG-CORR-001",
                    "title": "Broken object-level authorization",
                    "type": "broken_authorization",
                    "severity": "high",
                    "confidence": 0.98,
                    "status": "verified",
                    "explanation": (
                        "SAST identified an order lookup without an ownership check, "
                        "and DAST verified that User A received User B's order."
                    ),
                    "impact": "Users may access other users' orders.",
                    "evidence": [
                        "EVD-SAST-001 / SAST-AUTH-001: db.orders.findById(id) at line 42 lacks an ownership check.",
                        "EVD-DAST-001 / DAST-AUTH-001: verification result showed User A received User B's order.",
                    ],
                    "affected_components": ["/api/orders/[id]"],
                    "recommended_fix": "Enforce authenticated ownership or authorization before returning the order.",
                    "verification_status": "verified",
                },
            }

    provider = CorrelationProvider()
    result = ToolCallingAgent(
        analyst=SecurityAnalyst(provider),
        registry=ToolRegistry(str(tmp_path)),
        max_iterations=1,
    ).analyze(
        [
            ScannerFinding(
                id=sast.id,
                type=sast.category,
                severity=sast.severity,
                endpoint=sast.target.value,
                evidence=json.dumps(sast.model_dump()),
                source=sast.source,
                security_evidence=sast.model_dump(),
            ),
            ScannerFinding(
                id=dast.id,
                type=dast.category,
                severity=dast.severity,
                endpoint=dast.target.value,
                evidence=json.dumps(dast.model_dump()),
                source=dast.source,
                security_evidence=dast.model_dump(),
            ),
        ],
        {
            "security_evidence": [sast.model_dump(), dast.model_dump()],
            "correlation_expectation": "Correlate both records into one authorization finding.",
        },
    )

    assert result.type == "broken_authorization"
    assert result.severity == "high"
    assert result.status == "verified"
    assert result.verification_status == "verified"
    assert len([result]) == 1
    assert any("EVD-SAST-001" in item for item in result.evidence)
    assert any("EVD-DAST-001" in item for item in result.evidence)
    assert "/api/orders/[id]" in result.affected_components
