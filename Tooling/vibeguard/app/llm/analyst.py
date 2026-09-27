import json
import os
from uuid import uuid4
from typing import Any, Callable, Protocol

from pydantic import ValidationError

from vibeguard.app.llm.prompts import SYSTEM_PROMPT
from vibeguard.app.llm.schemas import SecurityAnalysis, ToolRequest
from vibeguard.app.models.findings import ScannerFinding
from vibeguard.app.tools.redaction import redact_secrets


class AnalystProvider(Protocol):
    def complete(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Return a provider response with either tool_call or final JSON."""


class OpenAIAnalystProvider:
    """OpenAI-compatible provider adapter.

    The provider only returns model decisions. It never executes tools.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
    ) -> None:
        from openai import OpenAI

        key = api_key or os.getenv("VIBEGUARD_LLM_API_KEY")
        if not key:
            raise RuntimeError("VIBEGUARD_LLM_API_KEY is not configured")
        self.model = model or os.getenv("VIBEGUARD_LLM_MODEL", "gpt-4o-mini")
        self.client = OpenAI(
            api_key=key,
            base_url=base_url or os.getenv("VIBEGUARD_LLM_BASE_URL") or None,
        )

    def complete(self, messages, tools):
        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0,
            response_format={"type": "json_object"},
            messages=messages,
            tools=tools or None,
        )
        message = response.choices[0].message
        if message.tool_calls:
            call = message.tool_calls[0]
            tool_call_id = call.id or f"call_{uuid4().hex}"
            assistant_message = message.model_dump(exclude_none=True)
            assistant_message["tool_calls"][0]["id"] = tool_call_id
            return {
                "kind": "tool_call",
                "tool_call": {
                    "name": call.function.name,
                    "arguments": json.loads(call.function.arguments or "{}"),
                },
                "tool_call_id": tool_call_id,
                "assistant_message": assistant_message,
            }
        if not message.content:
            raise RuntimeError("LLM returned no content")
        return {"kind": "final", "analysis": json.loads(message.content)}


class SecurityAnalyst:
    """Coordinates analyst reasoning while keeping tool execution external."""

    def __init__(self, provider: AnalystProvider) -> None:
        self.provider = provider

    def analyze_security(
        self,
        findings: list[ScannerFinding],
        project_context: dict[str, Any],
        tool_executor: Callable[[ToolRequest], dict[str, Any]] | None = None,
        tool_definitions: list[dict[str, Any]] | None = None,
        max_iterations: int = 8,
    ) -> SecurityAnalysis:
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "scanner_findings": [item.model_dump() for item in findings],
                        "project_context": project_context,
                    },
                    default=str,
                ),
            },
        ]
        tools = tool_definitions or []

        for _ in range(max_iterations):
            response = self.provider.complete(messages, tools)
            if not isinstance(response, dict):
                raise RuntimeError("malformed LLM response")
            if response.get("kind") == "final":
                try:
                    return self._validate_final(response.get("analysis"))
                except RuntimeError:
                    messages.append({"role": "assistant", "content": json.dumps(response, default=str)})
                    messages.append(
                        {
                            "role": "user",
                            "content": (
                                "Your previous JSON did not match the required SecurityAnalysis schema. "
                                "Return a complete JSON object with exactly these fields: id, title, type, "
                                "severity, confidence, status, explanation, impact, evidence, "
                                "affected_components, recommended_fix, verification_status. "
                                "Do not use recommendation; use recommended_fix. Do not omit fields."
                            ),
                        }
                    )
                    continue

            if response.get("kind") != "tool_call" or not response.get("tool_call"):
                raise RuntimeError("malformed analyst response")

            request = ToolRequest.model_validate(response["tool_call"])
            if tool_executor is None:
                raise RuntimeError(f"analyst requested tool {request.name}, but no executor was supplied")

            try:
                result = tool_executor(request)
            except Exception as exc:
                result = {"ok": False, "error": str(exc)}

            assistant_message = response.get("assistant_message")
            if assistant_message:
                messages.append(assistant_message)
            else:
                messages.append({"role": "assistant", "content": json.dumps(response, default=str)})
            tool_message = {
                "role": "tool",
                "name": request.name,
                "content": json.dumps(result, default=str),
            }
            if response.get("tool_call_id"):
                tool_message["tool_call_id"] = response["tool_call_id"]
            messages.append(tool_message)

        raise RuntimeError("maximum analyst iterations exceeded")

    @staticmethod
    def _validate_final(payload: Any) -> SecurityAnalysis:
        if isinstance(payload, dict):
            payload = dict(payload)
            for field in ("evidence", "affected_components"):
                if isinstance(payload.get(field), str):
                    payload[field] = [payload[field]]
        try:
            result = SecurityAnalysis.model_validate(payload)
        except (ValidationError, TypeError) as exc:
            raise RuntimeError("LLM final output did not match SecurityAnalysis") from exc

        # A model cannot upgrade an unverified scanner suspicion to verified.
        negative_markers = ("no test", "not tested", "without verification", "scanner report only", "unverified")
        supplied_verification = any(
            not any(marker in item.lower() for marker in negative_markers)
            and ("verification result" in item.lower() or "verified by" in item.lower() or "reproduc" in item.lower() or "test result" in item.lower())
            for item in result.evidence
        )
        if not supplied_verification and (
            result.status == "verified" or result.verification_status == "verified"
        ):
            result.status = "likely" if result.confidence >= 0.7 else "potential"
            result.verification_status = "unverified"
        return SecurityAnalysis.model_validate(redact_secrets(result.model_dump()))










