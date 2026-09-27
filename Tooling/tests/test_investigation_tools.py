import json

import pytest
from pydantic import ValidationError

from vibeguard.app.llm.analyst import SecurityAnalyst
from vibeguard.app.models.findings import ScannerFinding
from vibeguard.app.orchestration.agent import ToolCallingAgent
from vibeguard.app.tools.investigation import InvestigationTools
from vibeguard.app.tools.read_file import ToolSecurityError
from vibeguard.app.tools.registry import ToolRegistry


def test_list_files_finds_nested_files_and_ignores_noise(tmp_path):
    (tmp_path / "src" / "app").mkdir(parents=True)
    (tmp_path / "src" / "app" / "route.ts").write_text("export {}", encoding="utf-8")
    for directory in (".git", "node_modules"):
        (tmp_path / directory).mkdir()
        (tmp_path / directory / "hidden.txt").write_text("ignored", encoding="utf-8")
    result = InvestigationTools(tmp_path).list_files()
    assert result["files"] == ["src/app/route.ts"]


def test_list_files_rejects_traversal(tmp_path):
    with pytest.raises(ToolSecurityError):
        InvestigationTools(tmp_path).list_files("../../")


def test_find_files_matches_and_returns_relative_paths(tmp_path):
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "auth.ts").write_text("", encoding="utf-8")
    (tmp_path / "package.json").write_text("{}", encoding="utf-8")
    result = InvestigationTools(tmp_path).find_files("*auth*")
    assert result["files"] == ["src/auth.ts"]
    assert all(not path.startswith(("/", "\\")) for path in result["files"])
    with pytest.raises(ToolSecurityError):
        InvestigationTools(tmp_path).find_files("../*", ".")


def test_package_dependencies_parse_supported_manifests(tmp_path):
    (tmp_path / "package.json").write_text(
        json.dumps({"dependencies": {"next": "15.0.0", "react": "^19.0.0"}}),
        encoding="utf-8",
    )
    (tmp_path / "requirements.txt").write_text("fastapi>=0.115\nhttpx==0.28.1\n", encoding="utf-8")
    (tmp_path / "pyproject.toml").write_text(
        '[project]\nname = "demo"\ndependencies = ["pydantic>=2.7"]\n',
        encoding="utf-8",
    )
    manifests = InvestigationTools(tmp_path).get_package_dependencies()["manifests"]
    assert [item["file"] for item in manifests] == ["package.json", "pyproject.toml", "requirements.txt"]
    npm = next(item for item in manifests if item["file"] == "package.json")
    assert {"name": "next", "version": "15.0.0"} in npm["dependencies"]


def test_package_dependencies_handles_missing_and_malformed_manifests(tmp_path):
    (tmp_path / "package.json").write_text("{not-json", encoding="utf-8")
    (tmp_path / "pyproject.toml").write_text("[broken", encoding="utf-8")
    assert InvestigationTools(tmp_path).get_package_dependencies()["manifests"] == []


def test_security_config_redacts_and_excludes_env_files(tmp_path):
    (tmp_path / "middleware.ts").write_text(
        "const API_KEY = 'super-secret-value';\nconst DATABASE_URL = 'postgres://user:password@host/db';\n",
        encoding="utf-8",
    )
    (tmp_path / ".env").write_text("API_KEY=do-not-read\n", encoding="utf-8")
    (tmp_path / ".env.example").write_text("API_KEY=example\n", encoding="utf-8")
    result = InvestigationTools(tmp_path).get_security_config()
    files = {item["file"]: item for item in result["files"]}
    assert "middleware.ts" in files
    assert ".env" not in files
    assert ".env.example" in files
    assert "super-secret-value" not in files["middleware.ts"]["content"]
    assert "postgres://user:password@host/db" not in files["middleware.ts"]["content"]
    assert files["middleware.ts"]["redactions"] >= 2


def test_security_config_rejects_traversal(tmp_path):
    with pytest.raises(ToolSecurityError):
        InvestigationTools(tmp_path).get_security_config("../")


def test_registry_exposes_all_four_tools(tmp_path):
    names = set(ToolRegistry(str(tmp_path)).names())
    assert {"list_files", "find_files", "get_package_dependencies", "get_security_config"} <= names


def test_existing_llm_flow_can_invoke_list_files(tmp_path):
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "auth.ts").write_text("export const auth = true", encoding="utf-8")

    class FakeProvider:
        def __init__(self):
            self.messages = []

        def complete(self, messages, tools):
            self.messages = messages
            if len(messages) == 2:
                return {"kind": "tool_call", "tool_call": {"name": "list_files", "arguments": {"path": "."}}}
            assert "src/auth.ts" in messages[-1]["content"]
            return {
                "kind": "final",
                "analysis": {
                    "id": "VG-TOOL-001",
                    "title": "Auth review",
                    "type": "authorization",
                    "severity": "low",
                    "confidence": 0.8,
                    "status": "potential",
                    "explanation": "Project structure was inspected.",
                    "impact": "No confirmed impact.",
                    "evidence": ["list_files returned src/auth.ts"],
                    "affected_components": ["src/auth.ts"],
                    "recommended_fix": "Review authorization boundaries.",
                    "verification_status": "not_tested",
                },
            }

    provider = FakeProvider()
    result = ToolCallingAgent(
        analyst=SecurityAnalyst(provider),
        registry=ToolRegistry(str(tmp_path)),
        max_iterations=3,
    ).analyze([ScannerFinding(id="VG-TOOL-001", type="authorization")], {})
    assert result.id == "VG-TOOL-001"
