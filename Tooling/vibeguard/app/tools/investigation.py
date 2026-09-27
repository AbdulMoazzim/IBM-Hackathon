import fnmatch
import json
import re
import tomllib
from pathlib import Path
from typing import Any

from vibeguard.app.tools.redaction import redact_secrets
from vibeguard.app.tools.read_file import ToolSecurityError

IGNORED_DIRECTORIES = frozenset({".git", "node_modules", ".venv", "venv", "__pycache__", ".next", "dist", "build"})
MAX_RESULTS = 1000
MAX_CONFIG_FILE_BYTES = 50_000
MAX_CONFIG_TOTAL_BYTES = 200_000
SUPPORTED_MANIFESTS = {"package.json", "requirements.txt", "pyproject.toml"}
CONFIG_FILENAMES = {"next.config.js", "next.config.mjs", "next.config.ts", "vite.config.js", "vite.config.ts", "middleware.ts", "middleware.js", "vercel.json", ".env.example", ".env.sample"}
_CONNECTION_SECRET_RE = re.compile(r"""(?ix)(?P<label>\b(?:api[_-]?key|secret|token|password|authorization|database_url|connection_string|private_key)\b)\s*[:=]\s*(?P<quote>["']?)(?P<value>[^\s"']+)(?P=quote)""")

class InvestigationTools:
    def __init__(self, workspace_root: str | Path) -> None:
        self.root = Path(workspace_root).resolve()

    def _path(self, path: str) -> Path:
        if not path or Path(path).is_absolute():
            raise ToolSecurityError("path must be a relative workspace path")
        candidate = (self.root / Path(path)).resolve()
        try:
            candidate.relative_to(self.root)
        except ValueError as exc:
            raise ToolSecurityError("path escapes the authorized workspace") from exc
        return candidate

    def _files(self, base: Path):
        if base.is_file():
            yield base
            return
        if not base.exists() or not base.is_dir():
            return
        for candidate in base.rglob("*"):
            try:
                resolved = candidate.resolve()
                relative = resolved.relative_to(self.root)
            except (OSError, ValueError):
                continue
            if any(part in IGNORED_DIRECTORIES for part in relative.parts):
                continue
            if resolved.is_file():
                yield resolved

    def list_files(self, path: str = ".") -> dict[str, Any]:
        base = self._path(path)
        results = []
        for candidate in self._files(base):
            results.append(candidate.relative_to(self.root).as_posix())
            if len(results) >= MAX_RESULTS:
                break
        results.sort()
        return {"path": path, "files": results, "truncated": len(results) >= MAX_RESULTS}

    def find_files(self, pattern: str, path: str = ".") -> dict[str, Any]:
        if not pattern or len(pattern) > 200 or Path(pattern).is_absolute() or ".." in Path(pattern).parts:
            raise ToolSecurityError("pattern must be a safe relative filename pattern")
        base = self._path(path)
        results = []
        for candidate in self._files(base):
            relative = candidate.relative_to(self.root).as_posix()
            if fnmatch.fnmatch(candidate.name, pattern) or fnmatch.fnmatch(relative, pattern):
                results.append(relative)
                if len(results) >= MAX_RESULTS:
                    break
        results.sort()
        return {"pattern": pattern, "path": path, "files": results, "truncated": len(results) >= MAX_RESULTS}

    def get_package_dependencies(self, path: str = ".") -> dict[str, Any]:
        base = self._path(path)
        manifests = []
        for candidate in self._files(base):
            if candidate.name not in SUPPORTED_MANIFESTS:
                continue
            relative = candidate.relative_to(self.root).as_posix()
            try:
                if candidate.stat().st_size > MAX_CONFIG_FILE_BYTES:
                    continue
                text = candidate.read_text(encoding="utf-8")
                dependencies = self._parse_manifest(candidate.name, text)
            except (OSError, UnicodeDecodeError, ValueError, json.JSONDecodeError, tomllib.TOMLDecodeError):
                continue
            manifests.append({"file": relative, "ecosystem": self._ecosystem(candidate.name), "dependencies": sorted(dependencies, key=lambda item: item["name"])})
        manifests.sort(key=lambda item: item["file"])
        return {"manifests": manifests}

    @staticmethod
    def _ecosystem(filename: str) -> str:
        return {"package.json": "npm", "requirements.txt": "python", "pyproject.toml": "python"}[filename]

    @staticmethod
    def _parse_manifest(filename: str, text: str) -> list[dict[str, str]]:
        output: dict[str, str] = {}
        if filename == "package.json":
            data = json.loads(text)
            for section in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
                for name, version in (data.get(section) or {}).items():
                    output[str(name)] = str(version)
        elif filename == "requirements.txt":
            for raw in text.splitlines():
                line = raw.split("#", 1)[0].strip()
                if not line or line.startswith(("-", "git+", "http:")):
                    continue
                match = re.match(r"^([A-Za-z0-9_.-]+(?:\[[^\]]+\])?)\s*(.*)$", line)
                if match:
                    output[match.group(1)] = match.group(2).strip() or "*"
        else:
            data = tomllib.loads(text)
            project = data.get("project") or {}
            for item in project.get("dependencies") or []:
                match = re.match(r"^([A-Za-z0-9_.-]+)(.*)$", str(item))
                if match:
                    output[match.group(1)] = match.group(2).strip() or "*"
            for section in (project.get("optional-dependencies") or {}).values():
                for item in section:
                    match = re.match(r"^([A-Za-z0-9_.-]+)(.*)$", str(item))
                    if match:
                        output[match.group(1)] = match.group(2).strip() or "*"
            for name, version in (data.get("tool", {}).get("poetry", {}).get("dependencies") or {}).items():
                if name.lower() != "python":
                    output[str(name)] = str(version)
        return [{"name": name, "version": version} for name, version in output.items()]

    def get_security_config(self, path: str = ".") -> dict[str, Any]:
        base = self._path(path)
        files = []
        total = 0
        for candidate in self._files(base):
            relative = candidate.relative_to(self.root).as_posix()
            if candidate.name not in CONFIG_FILENAMES and relative != "supabase/config.toml":
                continue
            if candidate.name in {".env", ".env.local", ".env.production"}:
                continue
            try:
                size = candidate.stat().st_size
                if size > MAX_CONFIG_FILE_BYTES or total + size > MAX_CONFIG_TOTAL_BYTES:
                    continue
                content = candidate.read_text(encoding="utf-8")
            except (OSError, UnicodeDecodeError):
                continue
            safe_content, redactions = self._redact_config(content)
            files.append({"file": relative, "content": safe_content, "redactions": redactions})
            total += size
        files.sort(key=lambda item: item["file"])
        return {"files": files, "truncated": total >= MAX_CONFIG_TOTAL_BYTES}

    @staticmethod
    def _redact_config(content: str) -> tuple[str, int]:
        safe = redact_secrets(content)
        redactions = safe.count("[REDACTED]") - content.count("[REDACTED]")
        safe, count = _CONNECTION_SECRET_RE.subn(
            lambda match: f"{match.group('label')}={match.group('quote')}[REDACTED]{match.group('quote')}",
            safe,
        )
        return safe, max(0, redactions + count)
