#!/usr/bin/env python3
"""One-shot, read-only Antigravity SDK worker. Invoked only by an explicit CLI command.

Protocol: one bounded JSON request on stdin, one JSON response on stdout.
No persistent listener, no automatic permission changes, no extra dependencies
inside the existing Xyeena npm installation.
"""
import asyncio
import json
import os
from pathlib import Path
import sys

MAX_INPUT = 65536
MAX_OUTPUT = 32768


def fail(message):
    sys.stdout.write(json.dumps({"ok": False, "error": message}) + "\n")
    return 1


async def execute(request):
    task = request.get("task")
    if not isinstance(task, dict) or not isinstance(task.get("id"), str):
        raise ValueError("Missing task id")
    scope = task.get("scope")
    if not isinstance(scope, dict) or scope.get("readOnly") is not True:
        raise ValueError("SDK bridge only supports explicitly read-only tasks")
    if scope.get("operationClass", "safe") != "safe":
        raise ValueError("SDK bridge will not run external or destructive tasks")
    title = task.get("title")
    if not isinstance(title, str) or not title.strip() or len(title) > 4000:
        raise ValueError("A bounded task title is required")
    cwd = request.get("cwd")
    if not isinstance(cwd, str) or not Path(cwd).is_dir():
        raise ValueError("An existing workspace is required")
    paths = request.get("skillPaths", [])
    if not isinstance(paths, list) or len(paths) > 8:
        raise ValueError("Invalid skill path selection")
    skill_paths = []
    for entry in paths:
        if not isinstance(entry, str) or not Path(entry).is_dir() or not Path(entry, "SKILL.md").is_file():
            raise ValueError("Invalid skill path")
        skill_paths.append(str(Path(entry).resolve()))
    if not os.environ.get("GEMINI_API_KEY") and not os.environ.get("GOOGLE_GENAI_USE_VERTEXAI"):
        raise RuntimeError("GEMINI_API_KEY or configured Vertex credentials required")

    try:
        from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig
        from google.antigravity.types import BuiltinTools
    except ImportError as exc:
        raise RuntimeError("Optional Antigravity SDK missing; install google-antigravity separately") from exc

    config = LocalAgentConfig(
        skills_paths=skill_paths,
        capabilities=CapabilitiesConfig(enabled_tools=BuiltinTools.read_only()),
        system_instructions=(
            "Complete only the assigned read-only task. Do not edit files, execute commands, "
            "send communications, or deploy. Consult relevant supplied Agent Skills on demand. "
            "Distinguish observed evidence from inference. Return a concise report with references."
        ),
    )
    prompt = "Workspace: " + str(Path(cwd).resolve()) + "\nRead-only task: " + title
    async with Agent(config) as agent:
        response = await agent.chat(prompt)
        body = str(await response.text())[:MAX_OUTPUT]
        usage = getattr(response, "usage_metadata", None)
        tokens = getattr(usage, "total_token_count", None) if usage is not None else None
    return {"ok": True, "executed": True, "verified": False,
            "report": body, "usageTokens": tokens if isinstance(tokens, int) else None,
            "note": "Model output is not independent verification; task remains REVIEW_REQUIRED."}


def main():
    raw = sys.stdin.buffer.readline(MAX_INPUT + 1)
    if len(raw) > MAX_INPUT or not raw:
        return fail("Invalid or oversized input")
    try:
        request = json.loads(raw)
        if not isinstance(request, dict):
            return fail("Request must be a JSON object")
        result = asyncio.run(execute(request))
        sys.stdout.write(json.dumps(result, ensure_ascii=True) + "\n")
        return 0
    except Exception as exc:
        # Never echo task text, credentials, SDK tracebacks, or absolute paths.
        if isinstance(exc, (ValueError, RuntimeError)):
            message = str(exc)[:256]
        else:
            message = "Antigravity SDK invocation failed; check local SDK configuration"
        return fail(message)


if __name__ == "__main__":
    raise SystemExit(main())
