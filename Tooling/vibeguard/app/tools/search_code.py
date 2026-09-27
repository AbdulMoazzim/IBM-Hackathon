from pathlib import Path
from typing import Any
from vibeguard.app.tools.redaction import redact_secrets


class CodeSearcher:
    def __init__(
        self,
        workspace_root: str | Path,
        max_bytes: int = 200_000,
        max_matches: int = 100,
        context_lines: int = 1,
    ) -> None:
        self.workspace_root = Path(workspace_root).resolve()
        self.max_bytes = max_bytes
        self.max_matches = max_matches
        self.context_lines = context_lines

    def search_code(self, query: str) -> dict[str, Any]:
        if not query or len(query) > 500:
            raise ValueError("query must contain 1 to 500 characters")

        matches: list[dict[str, Any]] = []
        for candidate in self.workspace_root.rglob("*"):
            if len(matches) >= self.max_matches:
                break
            candidate = candidate.resolve()
            if not candidate.is_file():
                continue
            try:
                candidate.relative_to(self.workspace_root)
            except ValueError:
                continue
            if ".git" in candidate.parts or candidate.stat().st_size > self.max_bytes:
                continue

            try:
                lines = candidate.read_text(encoding="utf-8").splitlines()
            except (OSError, UnicodeDecodeError):
                continue

            for number, line in enumerate(lines, start=1):
                if query.casefold() not in line.casefold():
                    continue
                start = max(1, number - self.context_lines)
                end = min(len(lines), number + self.context_lines)
                matches.append(
                    {
                        "file": str(candidate.relative_to(self.workspace_root)),
                        "line": number,
                        "content": redact_secrets(line),
                        "context": "\n".join(
                            f"{index}: {redact_secrets(lines[index - 1])}"
                            for index in range(start, end + 1)
                        ),
                    }
                )
                if len(matches) >= self.max_matches:
                    break

        return {
            "ok": True,
            "query": redact_secrets(query),
            "matches": matches,
            "truncated": len(matches) >= self.max_matches,
        }


