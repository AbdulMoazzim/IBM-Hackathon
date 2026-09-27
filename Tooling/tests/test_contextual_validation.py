from vibeguard.app.llm.analyst import SecurityAnalyst
from vibeguard.app.models.findings import ScannerFinding
from vibeguard.app.orchestration.agent import ToolCallingAgent
from vibeguard.app.tools.registry import ToolRegistry


def test_sast_injection_finding_is_investigated_before_finalization(tmp_path):
    affected = tmp_path / "src" / "features" / "FindTutors" / "FindTutorsView.tsx"
    affected.parent.mkdir(parents=True)
    affected.write_text(
        "const query = new URLSearchParams(window.location.search);\n"
        "return <select value={vm.sortBy} onChange={event => vm.setSortBy(event.target.value)} />;\n",
        encoding="utf-8",
    )

    class InvestigatingProvider:
        def __init__(self):
            self.calls = 0
            self.tool_result_seen = False

        def complete(self, messages, tools):
            self.calls += 1
            if self.calls == 1:
                return {
                    "kind": "tool_call",
                    "tool_call": {
                        "name": "read_file",
                        "arguments": {
                            "path": "src/features/FindTutors/FindTutorsView.tsx"
                        },
                    },
                }

            self.tool_result_seen = "1: const query" in messages[-1]["content"]
            return {
                "kind": "final",
                "analysis": {
                    "id": "SAST-INJECT-001:src/features/FindTutors/FindTutorsView.tsx:31",
                    "title": "Potential SQL injection false positive",
                    "type": "injection",
                    "severity": "low",
                    "confidence": 0.91,
                    "status": "false_positive",
                    "explanation": "The inspected code is client-side JSX and contains no SQL construction or execution.",
                    "impact": "No SQL injection impact is supported by the inspected evidence.",
                    "evidence": [
                        "Scanner reported SQL-like tokens and interpolation syntax.",
                        "read_file showed client-side JSX without SQL construction.",
                    ],
                    "affected_components": [
                        "src/features/FindTutors/FindTutorsView.tsx"
                    ],
                    "recommended_fix": "Review the scanner pattern; no SQL remediation is indicated by this code.",
                    "verification_status": "unverified",
                },
            }

    provider = InvestigatingProvider()
    result = ToolCallingAgent(
        analyst=SecurityAnalyst(provider),
        registry=ToolRegistry(str(tmp_path)),
        max_iterations=3,
    ).analyze(
        [
            ScannerFinding(
                id="SAST-INJECT-001:src/features/FindTutors/FindTutorsView.tsx:31",
                type="injection",
                severity="high",
                file="src/features/FindTutors/FindTutorsView.tsx",
                line=31,
                evidence="Scanner detected SQL-like tokens and interpolation syntax.",
                source="sast",
            )
        ],
        {"project_name": "TutorFinder"},
    )

    assert provider.calls == 2
    assert provider.tool_result_seen is True
    assert result.status == "false_positive"
    assert result.verification_status != "verified"
