import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv

from vibeguard.app.llm.analyst import OpenAIAnalystProvider, SecurityAnalyst
from vibeguard.app.models.findings import ScannerFinding
from vibeguard.app.orchestration.agent import ToolCallingAgent
from vibeguard.app.tools.registry import ToolRegistry


class RecordingProvider:
    def __init__(self, provider):
        self.provider = provider
        self.tool_calls = []
        self.last_response = None

    def complete(self, messages, tools):
        response = self.provider.complete(messages, tools)
        self.last_response = response
        if response.get("kind") == "tool_call":
            self.tool_calls.append(response.get("tool_call"))
        return response


class RecordingRegistry:
    def __init__(self, registry):
        self.registry = registry
        self.executions = []

    def names(self):
        return self.registry.names()

    def definitions(self):
        return self.registry.definitions()

    def execute(self, name, arguments):
        result = self.registry.execute(name, arguments)
        self.executions.append({"name": name, "arguments": arguments, "result": result})
        return result


def main():
    started = time.perf_counter()
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    api_key = os.environ["VIBEGUARD_LLM_API_KEY"]
    configured_base_url = os.environ["VIBEGUARD_LLM_BASE_URL"]
    base_url = configured_base_url.rstrip("/")
    if base_url.endswith("/api"):
        base_url += "/v1"
    model = os.getenv("VIBEGUARD_LLM_MODEL", "openai/gpt-4o-mini")

    project_root = Path(__file__).parent / "fixtures" / "openrouter_project"
    provider = RecordingProvider(
        OpenAIAnalystProvider(api_key=api_key, model=model, base_url=base_url)
    )
    registry = RecordingRegistry(ToolRegistry(str(project_root)))
    finding = ScannerFinding(
        id="VG-TEST-001",
        type="rls_issue",
        severity="high",
        file="supabase/policies.sql",
        line=12,
        evidence="USING (true)",
        source="sast",
    )

    try:
        result = ToolCallingAgent(
            analyst=SecurityAnalyst(provider),
            registry=registry,
            max_iterations=5,
        ).analyze(
            [finding],
            {
                "project_structure": ["supabase/policies.sql"],
                "instruction": "Inspect the referenced file with read_file before producing the final analysis.",
            },
        )
        output = {
            "http_api_request_succeeded": True,
            "model_used": model,
            "read_file_requested": any(
                call and call.get("name") == "read_file" for call in provider.tool_calls
            ),
            "tool_calls": provider.tool_calls,
            "tool_results": registry.executions,
            "final_structured_json": result.model_dump(),
            "openrouter_error": None,
            "raw_final_response": None,
        }
    except Exception as exc:
        error = str(exc).replace(api_key, "[REDACTED]")
        output = {
            "http_api_request_succeeded": False,
            "model_used": model,
            "read_file_requested": any(
                call and call.get("name") == "read_file" for call in provider.tool_calls
            ),
            "tool_calls": provider.tool_calls,
            "tool_results": registry.executions,
            "final_structured_json": None,
            "openrouter_error": error,
            "raw_final_response": getattr(provider, "last_response", None),
        }
    output["total_execution_time_seconds"] = round(time.perf_counter() - started, 3)
    print(json.dumps(output, indent=2, default=str))


if __name__ == "__main__":
    main()


