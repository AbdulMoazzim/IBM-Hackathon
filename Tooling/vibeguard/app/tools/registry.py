from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel, Field

from vibeguard.app.tools.read_file import FileReader
from vibeguard.app.tools.search_code import CodeSearcher
from vibeguard.app.tools.investigation import InvestigationTools


class ReadFileArguments(BaseModel):
    path: str = Field(min_length=1, max_length=1000)


class SearchCodeArguments(BaseModel):
    query: str = Field(min_length=1, max_length=500)


class ProjectPathArguments(BaseModel):
    path: str = Field(default=".", min_length=1, max_length=1000)


class FindFilesArguments(ProjectPathArguments):
    pattern: str = Field(min_length=1, max_length=200)


@dataclass(frozen=True)
class ToolSpec:
    arguments_model: type[BaseModel]
    handler: Callable[..., dict[str, Any]]
    description: str


FUTURE_TOOL_NAMES = (
    "get_database_schema",
    "get_rls_policies",
    "get_route",
    "get_auth_config",
    "get_dast_result",
    "request_verification",
)


class ToolRegistry:
    """Allow-list and dispatcher for safe analyst tools.

    Future tools are extension points only. They are deliberately not
    registered until their handlers and argument models are implemented.
    """

    def __init__(self, workspace_root: str, max_file_bytes: int = 200_000) -> None:
        self._tools: dict[str, ToolSpec] = {}
        reader = FileReader(workspace_root, max_file_bytes)
        searcher = CodeSearcher(workspace_root, max_file_bytes)
        self.register(
            "read_file",
            ReadFileArguments,
            reader.read_file,
            "Read a UTF-8 text file inside the authorized project workspace.",
        )
        self.register(
            "search_code",
            SearchCodeArguments,
            searcher.search_code,
            "Search authorized project files for a case-insensitive string.",
        )
        investigation = InvestigationTools(workspace_root)
        self.register(
            "list_files",
            ProjectPathArguments,
            investigation.list_files,
            "List relative files under the authorized project workspace.",
        )
        self.register(
            "find_files",
            FindFilesArguments,
            investigation.find_files,
            "Find relative files by filename pattern in the authorized workspace.",
        )
        self.register(
            "get_package_dependencies",
            ProjectPathArguments,
            investigation.get_package_dependencies,
            "Read supported dependency manifests without installing or executing anything.",
        )
        self.register(
            "get_security_config",
            ProjectPathArguments,
            investigation.get_security_config,
            "Inspect supported security configuration files with secret redaction.",
        )

    def register(
        self,
        name: str,
        arguments_model: type[BaseModel],
        handler: Callable[..., dict[str, Any]],
        description: str,
    ) -> None:
        """Register a validated, explicitly allow-listed tool handler."""
        if not name or not name.replace("_", "").isalnum():
            raise ValueError("tool names must contain only letters, numbers, and underscores")
        if name in self._tools:
            raise ValueError(f"tool is already registered: {name}")
        self._tools[name] = ToolSpec(arguments_model, handler, description)

    def execute(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        spec = self._tools.get(name)
        if spec is None:
            raise ValueError(f"tool is not registered: {name}")
        validated = spec.arguments_model.model_validate(arguments)
        return spec.handler(**validated.model_dump())

    def names(self) -> list[str]:
        return list(self._tools)

    def definitions(self) -> list[dict[str, Any]]:
        return [
            {
                "type": "function",
                "function": {
                    "name": name,
                    "description": spec.description,
                    "parameters": spec.arguments_model.model_json_schema(),
                },
            }
            for name, spec in self._tools.items()
        ]

    @staticmethod
    def future_tool_names() -> tuple[str, ...]:
        """Names reserved for later database, DAST, and verification tools."""
        return FUTURE_TOOL_NAMES

