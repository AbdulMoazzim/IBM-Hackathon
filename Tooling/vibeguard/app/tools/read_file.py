from pathlib import Path
from typing import Any
from vibeguard.app.tools.redaction import redact_secrets


class ToolSecurityError(ValueError):
    """Raised when a tool request attempts to leave the authorized workspace."""


class FileReader:
    def __init__(self, workspace_root: str | Path, max_bytes: int = 200_000) -> None:
        self.workspace_root = Path(workspace_root).resolve()
        self.max_bytes = max_bytes

    def _authorized_path(self, path: str) -> Path:
        if not path or Path(path).is_absolute():
            raise ToolSecurityError("path must be a non-empty relative workspace path")

        candidate = (self.workspace_root / Path(path)).resolve()
        try:
            candidate.relative_to(self.workspace_root)
        except ValueError as exc:
            raise ToolSecurityError("path escapes the authorized project workspace") from exc
        return candidate

    def read_file(self, path: str) -> dict[str, Any]:
        candidate = self._authorized_path(path)

        if not candidate.exists():
            return {"ok": False, "path": path, "error": "file not found"}
        if candidate.is_dir():
            return {"ok": False, "path": path, "error": "path is a directory"}
        if candidate.stat().st_size > self.max_bytes:
            return {
                "ok": False,
                "path": path,
                "error": "file exceeds the configured size limit",
                "max_bytes": self.max_bytes,
            }

        try:
            content = candidate.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            return {"ok": False, "path": path, "error": "file is binary or not valid UTF-8"}

        numbered_content = "\n".join(
            f"{number}: {line}"
            for number, line in enumerate(content.splitlines(), start=1)
        )
        return {
            "ok": True,
            "path": path,
            "content": redact_secrets(numbered_content),
            "line_count": len(content.splitlines()),
        }

