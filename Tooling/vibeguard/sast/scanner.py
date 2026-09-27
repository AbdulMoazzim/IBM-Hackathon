import re
from pathlib import Path
from typing import Iterable

from vibeguard.app.models.evidence import SecurityEvidence


IGNORED_DIRECTORIES = frozenset({
    ".git",
    "node_modules",
    ".venv",
    "venv",
    "env",
    ".env",
    "build",
    "dist",
    "__pycache__",
})
MAX_FILE_BYTES = 1_000_000

_SECRET_RE = re.compile(
    r"""(?ix)
    \b(?:api[_-]?key|secret|access[_-]?token|auth[_-]?token|password)\b
    \s*[:=]\s*
    ["'](?P<value>[^"'\r\n]+)["']
    """
)
_SQL_RE = re.compile(r"(?i)\b(?:select|insert|update|delete)\b")
_SQL_CONCAT_RE = re.compile(r"""(?i)\b(?:select|insert|update|delete)\b.*["']\s*\+\s*[A-Za-z_]\w*""")
_SQL_INTERPOLATION_RE = re.compile(r"""(?i)(?:f|rf|fr)["'].*\b(?:select|insert|update|delete)\b.*\{[^}]+\}""")
_RLS_RE = re.compile(r"(?i)\bUSING\s*\(\s*true\s*\)")
_CORS_HEADER_RE = re.compile(r"""(?i)Access-Control-Allow-Origin\s*:\s*["']?\*["']?""")
_CORS_CONFIG_RE = re.compile(r"""(?i)(?:["']?)?(?:allow_origins|allowed_origins|cors_origin|cors_origins)["']?\s*[:=]\s*[\[\(]?\s*["']\*["']""")


def _is_within(root: Path, candidate: Path) -> bool:
    try:
        candidate.relative_to(root)
        return True
    except ValueError:
        return False


def _iter_text_files(root: Path) -> Iterable[tuple[Path, list[str]]]:
    for candidate in root.rglob("*"):
        try:
            resolved = candidate.resolve()
            relative_parts = resolved.relative_to(root).parts
        except (OSError, ValueError):
            continue
        if any(part in IGNORED_DIRECTORIES for part in relative_parts):
            continue
        if not resolved.is_file() or not _is_within(root, resolved):
            continue
        try:
            if resolved.stat().st_size > MAX_FILE_BYTES:
                continue
            raw = resolved.read_bytes()
            if b"\x00" in raw:
                continue
            text = raw.decode("utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        yield resolved, text.splitlines()


def _evidence(
    rule_id: str,
    category: str,
    severity: str,
    confidence: float,
    relative_file: str,
    line_number: int,
    content: str,
) -> SecurityEvidence:
    return SecurityEvidence(
        id=f"{rule_id}:{relative_file}:{line_number}",
        category=category,
        source="sast",
        severity=severity,
        confidence=confidence,
        target={"type": "file", "value": relative_file},
        evidence={"type": "code", "content": content, "line": line_number},
        metadata={"rule_id": rule_id},
    )


def _scan_line(relative_file: str, line_number: int, line: str) -> list[SecurityEvidence]:
    findings: list[SecurityEvidence] = []

    secret_match = _SECRET_RE.search(line)
    if secret_match:
        value = secret_match.group("value")
        lowered = value.casefold()
        placeholders = ("example", "your-key", "changeme", "placeholder")
        if not any(item in lowered for item in placeholders):
            redacted = line[:secret_match.start("value")] + "[REDACTED]" + line[secret_match.end("value"):]
            findings.append(_evidence("SAST-SECRET-001", "secrets", "high", 0.98, relative_file, line_number, redacted))

    if _SQL_RE.search(line) and (
        _SQL_CONCAT_RE.search(line) or _SQL_INTERPOLATION_RE.search(line)
    ):
        findings.append(_evidence("SAST-INJECT-001", "injection", "high", 0.9, relative_file, line_number, line))

    if _RLS_RE.search(line):
        findings.append(_evidence("SAST-RLS-001", "rls", "high", 0.95, relative_file, line_number, line))

    if _CORS_HEADER_RE.search(line) or _CORS_CONFIG_RE.search(line):
        findings.append(_evidence("SAST-CORS-001", "cors", "medium", 0.9, relative_file, line_number, line))

    return findings


def scan_project(project_root: str) -> list[SecurityEvidence]:
    """Run the four deterministic SAST rules over a text project tree."""
    root = Path(project_root).resolve()
    if not root.exists() or not root.is_dir():
        return []

    results: list[SecurityEvidence] = []
    seen: set[tuple[str, str, int]] = set()
    for path, lines in _iter_text_files(root):
        relative_file = path.relative_to(root).as_posix()
        for line_number, line in enumerate(lines, start=1):
            for finding in _scan_line(relative_file, line_number, line):
                key = (finding.metadata.rule_id or "", relative_file, line_number)
                if key not in seen:
                    seen.add(key)
                    results.append(finding)
    return results

