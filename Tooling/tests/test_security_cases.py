from pathlib import Path

import pytest

from vibeguard.app.llm.analyst import SecurityAnalyst
from vibeguard.app.models.findings import ScannerFinding
from vibeguard.app.orchestration.agent import ToolCallingAgent
from vibeguard.app.tools.read_file import FileReader, ToolSecurityError
from vibeguard.app.tools.registry import ToolRegistry


def final(payload):
    return {"kind": "final", "analysis": payload}


class StaticProvider:
    def __init__(self, payload):
        self.payload = payload
        self.messages = []

    def complete(self, messages, tools):
        self.messages = messages
        return final(self.payload)


def test_case_1_exposed_api_key_recommends_secret_management():
    provider = StaticProvider({
        "id": "VG-001",
        "title": "Potential exposed API key",
        "type": "secret_exposure",
        "severity": "high",
        "confidence": 0.9,
        "status": "likely",
        "explanation": "A credential-like value may be exposed.",
        "impact": "An attacker could access the associated service.",
        "evidence": ["Scanner reported a potential API key."],
        "affected_components": ["config.py"],
        "recommended_fix": "Move the key to environment variables or a managed secret store and rotate it.",
        "verification_status": "unverified",
    })
    result = SecurityAnalyst(provider).analyze_security(
        [ScannerFinding(id="VG-001", type="secret_exposure", evidence="API key")],
        {},
    )
    assert "environment" in result.recommended_fix.lower()
    assert result.status in {"potential", "likely"}


def test_case_2_read_file_is_called_and_content_reaches_final_analysis(tmp_path):
    target = tmp_path / "orders.py"
    target.write_text("def get_order(order_id):\n    return db.get(order_id)\n", encoding="utf-8")

    class ToolProvider:
        def __init__(self):
            self.calls = 0
            self.messages = []

        def complete(self, messages, tools):
            self.calls += 1
            self.messages = messages
            if self.calls == 1:
                return {"kind": "tool_call", "tool_call": {"name": "read_file", "arguments": {"path": "orders.py"}}}
            assert "1: def get_order" in messages[-1]["content"]
            return final({
                "id": "VG-002",
                "title": "Potential authorization issue",
                "type": "broken_authorization",
                "severity": "high",
                "confidence": 0.88,
                "status": "likely",
                "explanation": "The referenced function retrieves an object without visible authorization checks.",
                "impact": "Unauthorized users may access another user's order.",
                "evidence": ["read_file returned orders.py line 1"],
                "affected_components": ["orders.py"],
                "recommended_fix": "Enforce ownership or authorization before retrieval.",
                "verification_status": "unverified",
            })

    provider = ToolProvider()
    result = ToolCallingAgent(
        analyst=SecurityAnalyst(provider),
        registry=ToolRegistry(str(tmp_path)),
        max_iterations=3,
    ).analyze(
        [ScannerFinding(id="VG-002", type="authorization", file="orders.py")],
        {},
    )
    assert provider.calls == 2
    assert result.id == "VG-002"


def test_case_3_intentionally_public_cors_is_not_critical():
    provider = StaticProvider({
        "id": "VG-003",
        "title": "Intentional public CORS endpoint",
        "type": "cors_configuration",
        "severity": "low",
        "confidence": 0.91,
        "status": "false_positive",
        "explanation": "Project context states this endpoint is intentionally public.",
        "impact": "No material impact identified for the intended public endpoint.",
        "evidence": ["Project context marks the endpoint as public."],
        "affected_components": ["/public/health"],
        "recommended_fix": "Document the public endpoint policy and keep authenticated routes restricted.",
        "verification_status": "not_tested",
    })
    result = SecurityAnalyst(provider).analyze_security(
        [ScannerFinding(id="VG-003", type="cors", endpoint="/public/health")],
        {"public_endpoints": ["/public/health"]},
    )
    assert result.severity != "critical"
    assert result.status == "false_positive"


def test_case_4_unverified_finding_cannot_be_verified():
    provider = StaticProvider({
        "id": "VG-004",
        "title": "Potential injection",
        "type": "injection",
        "severity": "high",
        "confidence": 0.8,
        "status": "verified",
        "explanation": "The scanner reported a suspicious input.",
        "impact": "Potential attacker-controlled input processing.",
        "evidence": ["Scanner report only; no test result."],
        "affected_components": ["app.py"],
        "recommended_fix": "Use parameterized queries and validate input.",
        "verification_status": "verified",
    })
    result = SecurityAnalyst(provider).analyze_security(
        [ScannerFinding(id="VG-004", type="injection", evidence="suspicious input")],
        {},
    )
    assert result.status != "verified"
    assert result.verification_status != "verified"


def test_case_5_path_traversal_is_rejected(tmp_path):
    with pytest.raises(ToolSecurityError):
        FileReader(tmp_path).read_file("../../../../etc/passwd")

