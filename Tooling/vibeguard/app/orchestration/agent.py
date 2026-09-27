import os
from typing import Any
from vibeguard.app.llm.analyst import OpenAIAnalystProvider, SecurityAnalyst
from vibeguard.app.llm.schemas import SecurityAnalysis, ToolRequest
from vibeguard.app.models.findings import ScannerFinding
from vibeguard.app.tools.registry import ToolRegistry
from vibeguard.app.tools.redaction import redact_secrets

class ToolCallingAgent:
    """Runs the bounded analyst/tool conversation.

    The LLM can only cause effects through ToolRegistry.execute. It never
    receives a Python callable, shell, HTTP client, or filesystem handle.
    """
    def __init__(self, analyst: SecurityAnalyst | None = None, registry: ToolRegistry | None = None, max_iterations: int | None = None) -> None:
        workspace_root = os.getenv("VIBEGUARD_PROJECT_ROOT", ".")
        max_file_bytes = int(os.getenv("VIBEGUARD_MAX_FILE_BYTES", "200000"))
        self.registry = registry or ToolRegistry(workspace_root, max_file_bytes)
        self.analyst = analyst or SecurityAnalyst(OpenAIAnalystProvider())
        self.max_iterations = max_iterations or int(os.getenv("VIBEGUARD_MAX_TOOL_ITERATIONS", "8"))

    def analyze(self, findings: list[ScannerFinding], project_context: dict[str, Any]) -> SecurityAnalysis:
        if self.max_iterations < 1:
            raise ValueError("max_iterations must be at least 1")
        return self.analyst.analyze_security(
            findings=findings,
            project_context=project_context,
            tool_executor=self._execute_requested_tool,
            tool_definitions=self.registry.definitions(),
            max_iterations=self.max_iterations,
        )

    def _execute_requested_tool(self, request: ToolRequest) -> dict[str, Any]:
        if request.name not in self.registry.names():
            return {"ok": False, "error": f"tool is not registered: {request.name}"}
        try:
            return self.registry.execute(request.name, request.arguments)
        except Exception as exc:
            return {"ok": False, "error": "tool execution failed"}

AnalysisAgent = ToolCallingAgent


