from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

AnalysisStatus = Literal["potential", "likely", "verified", "false_positive"]
VerificationStatus = Literal["not_tested", "unverified", "verified"]
Severity = Literal["info", "low", "medium", "high", "critical"]


class ToolRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=100)
    arguments: dict[str, Any] = Field(default_factory=dict)


class SecurityAnalysis(BaseModel):
    """The only accepted terminal output from the LLM analyst."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=500)
    type: str = Field(min_length=1, max_length=200)
    severity: Severity
    confidence: float = Field(ge=0, le=1)
    status: AnalysisStatus
    explanation: str = Field(min_length=1)
    impact: str = Field(min_length=1)
    evidence: list[str] = Field(default_factory=list)
    affected_components: list[str] = Field(default_factory=list)
    recommended_fix: str = Field(min_length=1)
    verification_status: VerificationStatus
