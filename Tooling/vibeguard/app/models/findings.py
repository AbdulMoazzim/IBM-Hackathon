"""Input contracts shared by scanner integrations and the analysis layer."""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field
from vibeguard.app.llm.schemas import SecurityAnalysis


Severity = Literal["info", "low", "medium", "high", "critical"]


class ScannerFinding(BaseModel):
    """Flexible finding emitted by a SAST, DAST, or future scanner.

    Extra scanner-specific fields are preserved so this contract can evolve
    without requiring changes to the analysis service first.
    """

    model_config = ConfigDict(extra="allow")

    id: str = Field(min_length=1, description="Stable scanner finding identifier")
    type: str = Field(min_length=1, description="Scanner/category type")
    severity: Severity = "medium"
    file: str | None = None
    line: int | None = Field(default=None, ge=1)
    evidence: str | None = None
    endpoint: str | None = None
    source: str | None = None


class ScannerFindings(BaseModel):
    """Optional envelope for integrations that submit batches."""

    model_config = ConfigDict(extra="allow")

    findings: list[ScannerFinding] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class AnalysisRequest(BaseModel):
    findings: list[ScannerFinding]
    project_context: dict[str, Any] = Field(default_factory=dict)


class AnalysisResponse(BaseModel):
    summary: str
    risk_level: Severity
    findings: list[SecurityAnalysis] = Field(default_factory=list)




