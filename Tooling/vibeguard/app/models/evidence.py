from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


EvidenceSource = Literal["sast", "dast", "combined"]
EvidenceSeverity = Literal["low", "medium", "high", "critical"]
EvidenceCategory = Literal[
    "authentication",
    "authorization",
    "injection",
    "secrets",
    "cors",
    "rate_limiting",
    "rls",
    "security_headers",
    "configuration",
    "dependency",
]
TargetType = Literal["file", "endpoint", "project"]


class EvidenceTarget(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: TargetType
    value: str = Field(min_length=1)


class ScannerEvidence(BaseModel):
    """Flexible evidence payload shared by SAST and DAST integrations."""

    model_config = ConfigDict(extra="allow")

    type: str = Field(min_length=1)


class EvidenceMetadata(BaseModel):
    """Shared metadata with room for scanner-specific fields."""

    model_config = ConfigDict(extra="allow")

    rule_id: str | None = None
    test_id: str | None = None


class SecurityEvidence(BaseModel):
    """Normalized evidence contract emitted by SAST/DAST integrations."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    category: EvidenceCategory
    source: EvidenceSource
    severity: EvidenceSeverity
    confidence: float = Field(ge=0.0, le=1.0)
    target: EvidenceTarget
    evidence: ScannerEvidence
    metadata: EvidenceMetadata = Field(default_factory=EvidenceMetadata)
