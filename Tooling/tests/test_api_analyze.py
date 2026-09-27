from fastapi.testclient import TestClient

from vibeguard.app.api.routes import get_agent
from vibeguard.app.llm.schemas import SecurityAnalysis
from vibeguard.app.main import app


class StubAgent:
    def __init__(self):
        self.received = None

    def analyze(self, findings, project_context):
        self.received = (findings, project_context)
        return SecurityAnalysis.model_validate({
            "id": "VG-TEST-001",
            "title": "Excessive Permissions in Policy",
            "type": "rls_issue",
            "severity": "high",
            "confidence": 0.8,
            "status": "likely",
            "explanation": "The policy allows unrestricted access.",
            "impact": "Unauthorized data access may occur.",
            "evidence": ["USING (true)"],
            "affected_components": ["supabase/policies.sql"],
            "recommended_fix": "Restrict access to authorized roles.",
            "verification_status": "unverified",
        })


class FailingAgent:
    def analyze(self, findings, project_context):
        raise RuntimeError("provider failure")


def test_analyze_valid_request_delegates_and_returns_structured_finding():
    agent = StubAgent()
    app.dependency_overrides[get_agent] = lambda: (lambda: agent)
    try:
        response = TestClient(app).post(
            "/analyze",
            json={
                "findings": [{
                    "id": "VG-TEST-001",
                    "type": "rls_issue",
                    "severity": "high",
                    "file": "supabase/policies.sql",
                    "line": 12,
                    "evidence": "USING (true)",
                    "source": "sast",
                }],
                "project_context": {
                    "project_name": "test-project",
                    "root_path": "test-project",
                },
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["findings"][0]["id"] == "VG-TEST-001"
    assert body["findings"][0]["verification_status"] == "unverified"
    assert agent.received[0][0].file == "supabase/policies.sql"
    assert agent.received[1]["project_name"] == "test-project"


def test_analyze_rejects_missing_or_malformed_findings():
    client = TestClient(app)
    missing = client.post("/analyze", json={"project_context": {}})
    malformed = client.post(
        "/analyze",
        json={"findings": [{"id": "VG-1", "type": "x", "severity": "unknown"}]},
    )
    assert missing.status_code == 422
    assert malformed.status_code == 422


def test_analyze_returns_generic_error_when_agent_fails():
    app.dependency_overrides[get_agent] = lambda: (lambda: FailingAgent())
    try:
        response = TestClient(app).post("/analyze", json={"findings": [{"id": "VG-1", "type": "x"}]})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 502
    assert response.json()["detail"] == "security analysis provider failed"
    assert "provider failure" not in response.text

