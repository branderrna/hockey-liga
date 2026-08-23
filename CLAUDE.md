# Claude Code instructions

Follow `AGENTS.md` for shared project rules.

Claude Code has a project-local code-review-graph MCP configured in `.mcp.json`. When it is available, start repository exploration with `get_minimal_context_tool`, pass the repository root explicitly, and use graph queries before broad file scanning. The graph is structural context, not a substitute for reading source before edits.
