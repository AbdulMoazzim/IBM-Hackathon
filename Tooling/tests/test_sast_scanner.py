from pathlib import Path

import pytest

from vibeguard.sast.scanner import scan_project


def test_all_four_rules_return_security_evidence(tmp_path):
    source = tmp_path / "app.py"
    source.write_text(
        "API_KEY = 'sk-live-1234567890'\n"
        "query = \"SELECT * FROM users WHERE id = \" + user_input\n"
        "cors = {'allow_origins': ['*']}\n",
        encoding="utf-8",
    )
    (tmp_path / "supabase.sql").write_text(
        "CREATE POLICY public_read ON orders FOR SELECT USING (true);\n",
        encoding="utf-8",
    )

    findings = scan_project(str(tmp_path))
    rules = {item.metadata.rule_id for item in findings}
    assert rules == {
        "SAST-SECRET-001",
        "SAST-INJECT-001",
        "SAST-RLS-001",
        "SAST-CORS-001",
    }
    assert all(item.source == "sast" for item in findings)
    assert all(item.target.type == "file" for item in findings)
    assert all(item.evidence.line >= 1 for item in findings)
    assert all(item.target.value in {"app.py", "supabase.sql"} for item in findings)


def test_secret_is_redacted_and_placeholders_are_ignored(tmp_path):
    (tmp_path / "config.py").write_text(
        "API_KEY = 'sk-real-secret-123456'\n"
        "EXAMPLE_KEY = 'your-key'\n"
        "SECRET = 'changeme'\n"
        "TOKEN = 'placeholder'\n",
        encoding="utf-8",
    )
    findings = scan_project(str(tmp_path))
    secrets = [item for item in findings if item.metadata.rule_id == "SAST-SECRET-001"]
    assert len(secrets) == 1
    assert "[REDACTED]" in secrets[0].evidence.content
    assert "sk-real-secret-123456" not in secrets[0].evidence.content


def test_clean_project_has_no_findings(tmp_path):
    (tmp_path / "clean.py").write_text("value = 1\n", encoding="utf-8")
    assert scan_project(str(tmp_path)) == []


def test_ignored_directories_are_not_scanned(tmp_path):
    for directory in (".git", "node_modules", ".venv", "build", "dist"):
        target = tmp_path / directory
        target.mkdir()
        (target / "bad.py").write_text("API_KEY = 'secret-value-123'\n", encoding="utf-8")
    assert scan_project(str(tmp_path)) == []


def test_binary_files_are_skipped(tmp_path):
    (tmp_path / "image.bin").write_bytes(b"\x00API_KEY = 'secret-value-123'")
    assert scan_project(str(tmp_path)) == []


def test_symlink_outside_project_is_not_scanned(tmp_path):
    outside = tmp_path.parent / "outside-vibeguard-sast"
    outside.mkdir(exist_ok=True)
    (outside / "secret.py").write_text("API_KEY = 'secret-value-123'\n", encoding="utf-8")
    link = tmp_path / "linked"
    try:
        link.symlink_to(outside, target_is_directory=True)
    except (OSError, NotImplementedError):
        pytest.skip("symlink creation is unavailable")
    assert scan_project(str(tmp_path)) == []
