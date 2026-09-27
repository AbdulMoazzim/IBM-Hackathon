import httpx
import pytest

from vibeguard.dast.scanner import DASTTargetError, scan_url


URL = "https://example.com"


def mocked_client(handler):
    return httpx.Client(
        transport=httpx.MockTransport(handler),
        follow_redirects=False,
        timeout=1,
    )


def test_missing_security_header_is_detected(monkeypatch):
    monkeypatch.setattr("vibeguard.dast.scanner._reject_ip", lambda host: None)
    client = mocked_client(lambda request: httpx.Response(200, headers={}, content=b"ok"))
    findings = scan_url(URL, client)
    assert any(f.metadata.test_id == "DAST-HEADERS-001" and "content-security-policy" in f.id for f in findings)


def test_existing_security_header_is_not_reported(monkeypatch):
    monkeypatch.setattr("vibeguard.dast.scanner._reject_ip", lambda host: None)
    headers = {
        "Content-Security-Policy": "default-src 'self'",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=31536000",
        "Referrer-Policy": "no-referrer",
    }
    client = mocked_client(lambda request: httpx.Response(200, headers=headers, content=b"ok"))
    findings = scan_url(URL, client)
    assert not any(f.metadata.test_id == "DAST-HEADERS-001" for f in findings)


def test_wildcard_cors_is_detected(monkeypatch):
    monkeypatch.setattr("vibeguard.dast.scanner._reject_ip", lambda host: None)
    def handler(request):
        return httpx.Response(200, headers={"Access-Control-Allow-Origin": "*"}, content=b"ok")
    findings = scan_url(URL, mocked_client(handler))
    assert any(f.metadata.test_id == "DAST-CORS-001" for f in findings)


def test_arbitrary_origin_reflection_is_detected(monkeypatch):
    monkeypatch.setattr("vibeguard.dast.scanner._reject_ip", lambda host: None)
    def handler(request):
        headers = {"Access-Control-Allow-Origin": request.headers.get("origin", "")}
        return httpx.Response(200, headers=headers, content=b"ok")
    findings = scan_url(URL, mocked_client(handler))
    assert any(f.metadata.test_id == "DAST-CORS-001" for f in findings)


def test_normal_cors_is_not_reported(monkeypatch):
    monkeypatch.setattr("vibeguard.dast.scanner._reject_ip", lambda host: None)
    def handler(request):
        return httpx.Response(200, headers={"Access-Control-Allow-Origin": "https://trusted.example"}, content=b"ok")
    findings = scan_url(URL, mocked_client(handler))
    assert not any(f.metadata.test_id == "DAST-CORS-001" for f in findings)


def test_sensitive_data_heuristic_is_conservative(monkeypatch):
    monkeypatch.setattr("vibeguard.dast.scanner._reject_ip", lambda host: None)
    body = b'{"users":[{"email":"user@example.com","password":"redacted"}]}'
    findings = scan_url(URL, mocked_client(lambda request: httpx.Response(200, content=body)))
    assert any(f.metadata.test_id == "DAST-AUTH-001" for f in findings)


def test_http_200_without_sensitive_data_has_no_auth_finding(monkeypatch):
    monkeypatch.setattr("vibeguard.dast.scanner._reject_ip", lambda host: None)
    findings = scan_url(URL, mocked_client(lambda request: httpx.Response(200, content=b'{"message":"public"}')))
    assert not any(f.metadata.test_id == "DAST-AUTH-001" for f in findings)


def test_rate_limit_signal_is_detected(monkeypatch):
    monkeypatch.setattr("vibeguard.dast.scanner._reject_ip", lambda host: None)
    count = {"value": 0}
    def handler(request):
        count["value"] += 1
        status = 429 if count["value"] >= 3 else 200
        return httpx.Response(status, headers={"Retry-After": "1"} if status == 429 else {}, content=b"ok")
    findings = scan_url(URL, mocked_client(handler))
    assert any(f.metadata.test_id == "DAST-RATE-001" for f in findings)
    assert count["value"] == 5


def test_private_and_localhost_targets_are_rejected():
    with pytest.raises(DASTTargetError):
        scan_url("http://127.0.0.1:8080")
    with pytest.raises(DASTTargetError):
        scan_url("http://localhost")


def test_redirect_to_private_target_is_rejected(monkeypatch):
    monkeypatch.setattr("vibeguard.dast.scanner._reject_ip", lambda host: None)
    client = mocked_client(lambda request: httpx.Response(302, headers={"Location": "http://127.0.0.1/admin"}))
    assert scan_url(URL, client) == []


def test_response_size_limit_is_handled(monkeypatch):
    monkeypatch.setattr("vibeguard.dast.scanner._reject_ip", lambda host: None)
    body = b"x" * (1_000_001)
    client = mocked_client(lambda request: httpx.Response(200, content=body))
    assert scan_url(URL, client) == []


def test_network_timeout_is_handled(monkeypatch):
    monkeypatch.setattr("vibeguard.dast.scanner._reject_ip", lambda host: None)
    def handler(request):
        raise httpx.ReadTimeout("simulated timeout")
    assert scan_url(URL, mocked_client(handler)) == []
