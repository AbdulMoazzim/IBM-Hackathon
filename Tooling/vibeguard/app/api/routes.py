from collections.abc import Callable

from fastapi import APIRouter, Depends, HTTPException

from vibeguard.app.models.findings import AnalysisRequest, AnalysisResponse
from vibeguard.app.orchestration.agent import AnalysisAgent

router = APIRouter()
AgentFactory = Callable[[], AnalysisAgent]


def get_agent() -> AgentFactory:
    """Provide a lazy factory so request validation precedes provider setup."""
    return AnalysisAgent


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/analyze", response_model=AnalysisResponse)
def analyze(
    request: AnalysisRequest,
    agent_factory: AgentFactory = Depends(get_agent),
) -> AnalysisResponse:
    try:
        result = agent_factory().analyze(request.findings, request.project_context)
        return AnalysisResponse(
            summary=f"Analyzed {len(request.findings)} scanner finding(s).",
            risk_level=result.severity,
            findings=[result],
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail="security analysis provider failed") from exc
