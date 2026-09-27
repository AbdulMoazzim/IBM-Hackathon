from vibeguard.app.llm.analyst import SecurityAnalyst
from vibeguard.app.models.findings import ScannerFinding
from vibeguard.app.orchestration.agent import ToolCallingAgent
from vibeguard.app.tools.registry import ToolRegistry


def test_dast_cors_finding_is_contextually_validated_without_verification(tmp_path):
    (tmp_path / "next.config.ts").write_text(
        "export default { poweredByHeader: false };\n",
        encoding="utf-8",
    )

    class ContextualProvider:
        def __init__(self):
            self.calls = 0
            self.scanner_evidence_seen = False
            self.tool_result_seen = False

        def complete(self, messages, tools):
            self.calls += 1
            if self.calls == 1:
                self.scanner_evidence_seen = (
                    "Access-Control-Allow-Origin: *" in messages[1]["content"]
                )
                return {
                    "kind": "tool_call",
                    "tool_call": {
                        "name": "search_code",
                        "arguments": {"query": "Access-Control-Allow-Origin"},
                    },
                }

            self.tool_result_seen = '"matches": []' in messages[-1]["content"]
            return {
                "kind": "final",
                "analysis": {
                    "id": "DAST-CORS-001:https://find-your-tutor.vercel.app/:permissive",
                    "title": "Potentially permissive CORS configuration",
                    "type": "cors",
                    "severity": "medium",
                    "confidence": 0.75,
                    "status": "potential",
                    "explanation": (
                        "The deployment returned Access-Control-Allow-Origin: *, "
                        "but permissive CORS alone does not demonstrate exploitable "
                        "cross-origin access to sensitive data."
                    ),
                    "impact": "Cross-origin access may be possible if sensitive endpoints also allow credentials or expose data.",
                    "evidence": [
                        "DAST observed Access-Control-Allow-Origin: *.",
                        "Local project search found no matching application header configuration.",
                    ],
                    "affected_components": [
                        "https://find-your-tutor.vercel.app/"
                    ],
                    "recommended_fix": "Review intended public CORS behavior and restrict origins where sensitive responses are exposed.",
                    "verification_status": "unverified",
                },
            }

    provider = ContextualProvider()
    result = ToolCallingAgent(
        analyst=SecurityAnalyst(provider),
        registry=ToolRegistry(str(tmp_path)),
        max_iterations=3,
    ).analyze(
        [
            ScannerFinding(
                id="DAST-CORS-001:https://find-your-tutor.vercel.app/:permissive",
                type="cors",
                severity="medium",
                endpoint="https://find-your-tutor.vercel.app/",
                evidence="Access-Control-Allow-Origin: *",
                source="dast",
            )
        ],
        {"project_name": "TutorFinder", "source": "authorized DAST scan"},
    )

    assert provider.calls == 2
    assert provider.scanner_evidence_seen is True
    assert provider.tool_result_seen is True
    assert result.severity == "medium"
    assert result.status == "potential"
    assert result.verification_status == "unverified"
