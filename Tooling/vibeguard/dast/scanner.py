import ipaddress
import socket
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse

import httpx

from vibeguard.app.models.evidence import SecurityEvidence
from vibeguard.app.tools.redaction import redact_secrets


MAX_RESPONSE_BYTES = 1_000_000
MAX_RATE_REQUESTS = 3
RATE_DELAY_SECONDS = 0.05
REQUEST_TIMEOUT = httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=5.0)
TEST_ORIGIN = "https://vibeguard-test.invalid"

HEADER_TEST_ID = "DAST-HEADERS-001"
CORS_TEST_ID = "DAST-CORS-001"
AUTH_TEST_ID = "DAST-AUTH-001"
RATE_TEST_ID = "DAST-RATE-001"


class DASTTargetError(ValueError):
    """The supplied URL is not a permitted public HTTP(S) target."""


class ResponseTooLarge(ValueError):
    pass


@dataclass(frozen=True)
class ProbeResponse:
    status_code: int
    headers: httpx.Headers
    body: bytes


def _reject_ip(hostname: str) -> None:
    lowered = hostname.casefold().rstrip(".")
    if lowered == "localhost" or lowered.endswith(".localhost"):
        raise DASTTargetError("localhost targets are not permitted")
    try:
        addresses = {
            item[4][0]
            for item in socket.getaddrinfo(
                hostname,
                None,
                type=socket.SOCK_STREAM,
            )
        }
    except socket.gaierror as exc:
        raise DASTTargetError("target hostname could not be resolved") from exc

    for address in addresses:
        parsed = ipaddress.ip_address(address)
        if (
            parsed.is_private
            or parsed.is_loopback
            or parsed.is_link_local
            or parsed.is_reserved
            or parsed.is_multicast
            or parsed.is_unspecified
        ):
            raise DASTTargetError("private or reserved targets are not permitted")


def _validate_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise DASTTargetError("only absolute http:// and https:// URLs are permitted")
    if parsed.username or parsed.password:
        raise DASTTargetError("URLs containing credentials are not permitted")
    _reject_ip(parsed.hostname)


def _request(
    client: httpx.Client,
    url: str,
    headers: dict[str, str] | None = None,
) -> ProbeResponse:
    _validate_url(url)
    with client.stream("GET", url, headers=headers or {}) as response:
        location = response.headers.get("location")
        if 300 <= response.status_code < 400 and location:
            redirect_url = urljoin(url, location)
            _validate_url(redirect_url)
            raise DASTTargetError("redirects are not followed by the DAST scanner")

        body = bytearray()
        for chunk in response.iter_bytes():
            body.extend(chunk)
            if len(body) > MAX_RESPONSE_BYTES:
                raise ResponseTooLarge("response exceeded the 1 MB limit")
        return ProbeResponse(response.status_code, response.headers, bytes(body))


def _excerpt(body: bytes, limit: int = 500) -> str:
    return redact_secrets(body[:limit].decode("utf-8", errors="replace"))


def _finding(
    test_id: str,
    url: str,
    category: str,
    severity: str,
    confidence: float,
    excerpt: str,
    suffix: str,
    status_code: int = 200,
) -> SecurityEvidence:
    return SecurityEvidence(
        id=f"{test_id}:{url}:{suffix}",
        category=category,
        source="dast",
        severity=severity,
        confidence=confidence,
        target={"type": "endpoint", "value": url},
        evidence={"type": "http", "status_code": status_code, "response_excerpt": excerpt},
        metadata={"test_id": test_id},
    )


def _header_findings(url: str, response: ProbeResponse) -> list[SecurityEvidence]:
    required = [
        ("content-security-policy", "content-security-policy"),
        ("x-content-type-options", "x-content-type-options"),
        ("referrer-policy", "referrer-policy"),
    ]
    if urlparse(url).scheme == "https":
        required.append(("strict-transport-security", "strict-transport-security"))

    findings = []
    for header, suffix in required:
        if header not in response.headers:
            findings.append(
                _finding(
                    HEADER_TEST_ID,
                    url,
                    "security_headers",
                    "medium",
                    0.95,
                    f"{header} header missing",
                    suffix,
                )
            )
    return findings


def _cors_findings(url: str, response: ProbeResponse) -> list[SecurityEvidence]:
    allow_origin = response.headers.get("access-control-allow-origin", "").strip()
    if allow_origin == "*" or allow_origin.casefold() == TEST_ORIGIN.casefold():
        behavior = (
            "Access-Control-Allow-Origin: *"
            if allow_origin == "*"
            else "Access-Control-Allow-Origin reflects the supplied arbitrary origin"
        )
        return [_finding(CORS_TEST_ID, url, "cors", "medium", 0.9, behavior, "permissive", response.status_code)]
    return []


def _auth_findings(url: str, response: ProbeResponse) -> list[SecurityEvidence]:
    if response.status_code != 200:
        return []
    text = response.body.decode("utf-8", errors="replace").casefold()
    indicators = {
        "password",
        "email",
        "token",
        "api_key",
        "ssn",
        "credit_card",
        "orders",
        "users",
    }
    present = {item for item in indicators if item in text}
    if len(present) < 2:
        return []
    return [
        _finding(
            AUTH_TEST_ID,
            url,
            "authentication",
            "high",
            0.7,
            "HTTP 200 response contains multiple sensitive-data indicators; manual verification required",
            "sensitive-response",
        )
    ]


def _has_rate_signal(response: ProbeResponse) -> bool:
    if response.status_code == 429 or "retry-after" in response.headers:
        return True
    return any(name.casefold().startswith("x-ratelimit-") for name in response.headers)


def _rate_findings(url: str, client: httpx.Client) -> list[SecurityEvidence]:
    responses: list[ProbeResponse] = []
    for index in range(MAX_RATE_REQUESTS):
        if index:
            time.sleep(RATE_DELAY_SECONDS)
        responses.append(_request(client, url))

    signal = next((response for response in responses if _has_rate_signal(response)), None)
    if signal:
        return [
            _finding(
                RATE_TEST_ID,
                url,
                "rate_limiting",
                "medium",
                0.95,
                f"Observable rate-limit signal: HTTP {signal.status_code}"
                if signal.status_code == 429
                else "Observable rate-limit response header present",
                "signal",
            )
        ]

    return [
        _finding(
            RATE_TEST_ID,
            url,
            "rate_limiting",
            "medium",
            0.5,
            "Potential missing rate limiting; no observable signal in three harmless requests",
            "no-observable-signal",
        )
    ]


def scan_url(url: str, _client: httpx.Client | None = None) -> list[SecurityEvidence]:
    """Run the four conservative DAST checks against only the supplied URL."""
    _validate_url(url)
    owns_client = _client is None
    client = _client or httpx.Client(
        follow_redirects=False,
        timeout=REQUEST_TIMEOUT,
        headers={"User-Agent": "VibeGuard-DAST-MVP"},
    )
    try:
        initial = _request(client, url)
        findings = _header_findings(url, initial)
        cors_response = _request(client, url, headers={"Origin": TEST_ORIGIN})
        findings.extend(_cors_findings(url, cors_response))
        findings.extend(_auth_findings(url, initial))
        findings.extend(_rate_findings(url, client))
        return findings
    except (DASTTargetError, ResponseTooLarge, httpx.HTTPError, TimeoutError, OSError):
        return []
    finally:
        if owns_client:
            client.close()


