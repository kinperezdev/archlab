# ArchLab Global Brain

This directory is the local, persistent home of the **global brain**. It is your
intellectual property and never leaves your machine.

- `brain.json` — canonical brain state (projects, learned patterns, insights).
  Written by the backend after every scan. Read-only for the MCP server.
- `projects/*.md` — a living architecture document per analyzed project.

Both `brain.json` and `projects/` are gitignored by default. Delete `brain.json`
to reset the brain from scratch.

Override the location with the `ARCHLAB_BRAIN_DIR` environment variable.
