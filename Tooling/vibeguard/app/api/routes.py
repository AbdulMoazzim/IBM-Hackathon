from collections.abc import Callable

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl

from vibeguard.app.models.findings import AnalysisRequest, AnalysisResponse, ScannerFinding
from vibeguard.app.models.evidence import SecurityEvidence
from vibeguard.app.orchestration.agent import AnalysisAgent
from vibeguard.app.llm.schemas import SecurityAnalysis

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


class ScanRequest(BaseModel):
    input_type: str = "url"
    url: HttpUrl


def _evidence_to_finding(ev: SecurityEvidence) -> ScannerFinding:
    """Convert a SecurityEvidence produced by a scanner into a ScannerFinding
    that AnalysisAgent expects.  No new logic — just field remapping."""
    evidence_text = ev.evidence.model_dump().get("content") or ev.evidence.model_dump().get(
        "response_excerpt"
    ) or ev.evidence.type
    return ScannerFinding(
        id=ev.id,
        type=ev.category,
        severity=ev.severity,
        file=ev.target.value if ev.target.type == "file" else None,
        endpoint=ev.target.value if ev.target.type == "endpoint" else None,
        evidence=str(evidence_text),
        source=ev.source,
    )


def _evidence_to_raw_finding(ev: SecurityEvidence) -> SecurityAnalysis:
    """Wrap a raw SecurityEvidence as a minimal SecurityAnalysis so the frontend
    can display every scanner item individually, not just the LLM synthesis."""
    ev_dump = ev.evidence.model_dump()
    evidence_text = (
        ev_dump.get("content")
        or ev_dump.get("response_excerpt")
        or ev.evidence.type
    )
    # Produce a human-readable title from the category and evidence type
    category_labels = {
        "security_headers": "Missing Security Header",
        "cors": "Permissive CORS Policy",
        "authentication": "Authentication Issue",
        "rate_limiting": "Rate Limiting Issue",
        "injection": "Injection Risk",
        "secrets": "Exposed Secret",
        "rls": "Row-Level Security Issue",
        "authorization": "Authorization Issue",
        "configuration": "Configuration Issue",
        "dependency": "Vulnerable Dependency",
    }
    base_title = category_labels.get(ev.category, ev.category.replace("_", " ").title())
    # Use the evidence text to refine the title when it's short enough
    if evidence_text and len(str(evidence_text)) < 80:
        title = f"{base_title}: {evidence_text}"
    else:
        title = base_title

    target_label = ev.target.value if ev.target.type in ("endpoint", "file") else ev.target.value
    return SecurityAnalysis(
        id=ev.id,
        title=title,
        type=ev.category,
        severity=ev.severity,
        confidence=ev.confidence,
        status="potential",
        explanation=f"Scanner detected: {evidence_text}",
        impact=f"Scanner evidence from {ev.source.upper()} at {target_label}.",
        evidence=[str(evidence_text)],
        affected_components=[target_label],
        recommended_fix=f"Review and remediate the {ev.category.replace('_', ' ')} issue at {target_label}.",
        verification_status="not_tested",
    )


@router.post("/scan", response_model=AnalysisResponse)
def scan(request: ScanRequest, agent_factory: AgentFactory = Depends(get_agent)) -> AnalysisResponse:
    """Run DAST against the supplied URL and return LLM-analysed findings."""
    from vibeguard.dast.scanner import scan_url, DASTTargetError

    url_str = str(request.url)

    try:
        evidence_list: list[SecurityEvidence] = scan_url(url_str)
    except DASTTargetError as exc:
        raise HTTPException(status_code=422, detail=f"invalid scan target: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="DAST scanner failed") from exc

    if not evidence_list:
        raise HTTPException(
            status_code=422,
            detail="DAST scanner produced no findings — the target may be unreachable or blocked.",
        )

    scanner_findings = [_evidence_to_finding(ev) for ev in evidence_list]
    project_context = {"target_url": url_str, "scan_type": "dast"}

    try:
        llm_result = agent_factory().analyze(scanner_findings, project_context)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="security analysis provider failed") from exc

    # Build one Finding per raw evidence item so the UI shows all scanner results.
    # The LLM synthesis is prepended as the primary finding.
    raw_findings = [_evidence_to_raw_finding(ev) for ev in evidence_list]

    # Deduplicate: skip any raw finding whose evidence text is already covered
    # by the LLM finding (avoids showing an identical entry twice).
    llm_evidence_texts = {e.lower() for e in llm_result.evidence}
    deduplicated_raw = [
        f for f in raw_findings
        if not any(e.lower() in llm_evidence_texts for e in f.evidence)
    ]

    all_findings = [llm_result] + deduplicated_raw

    return AnalysisResponse(
        summary=f"Scanned {url_str}: {len(evidence_list)} scanner item(s), {len(all_findings)} finding(s).",
        risk_level=llm_result.severity,
        findings=all_findings,
    )
