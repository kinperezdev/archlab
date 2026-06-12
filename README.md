# ArchLab

Local engineering command center and AI brain. Drop in any project folder and
ArchLab maps the whole system onto a live canvas, runs a structured 7-step check
pipeline (animated step by step), produces a full intelligence report, and grows
a **global brain** that gets smarter across every project you analyze.

Everything runs on localhost. Nothing ever leaves your machine.

## Features

- **Live architecture canvas.** Real parsed code is laid out as a React Flow graph: frontend, backend, routes, middleware, auth, databases, external services, and the edges between them. The canvas is always generated from what is actually in the folder, never from a template.
- **Readable swim lanes.** Nodes are grouped into tinted background lanes (Frontend on the left, Backend on the right) with generous horizontal and vertical spacing, and edges use clean right-angled (smoothstep) routing so the architecture reads at a glance without zooming.
- **Trace any connection.** Hover a node to instantly brighten it and everything it connects to while the rest fades back, with the linking edges lit so you can follow the data flow. Click a node to lock that view; clicking another node switches the lock, and a background click or Escape releases it. This works on every canvas, auto-generated or hand-drawn.
- **Labeled backend connector ports.** Every backend node shows operation-labeled ports on its edges (CREATE, READ, UPDATE, DELETE, AUTHENTICATE, EMIT, SUBSCRIBE, MIDDLEWARE, and more) color-coded by operation, in the form `OPERATION → destination`. Hover a port to expand it into the source file, destination, and an impact estimate of what breaks if that connection fails.
- **Bottleneck detector.** Runs inside the pipeline and standalone. Flags scale bottlenecks in amber (distinct from red security findings): single points of failure, database hotspots, middleware choke points, fragile WebSocket connections, heavy re-render components, blocking operations, and unbounded queries. Each carries a concrete user-threshold estimate and an architectural fix.
- **Copy Prompt everywhere.** Next to every finding, diagnostic, suggestion, bottleneck, and brain insight is a Copy Prompt button that copies a fully formed, context-rich prompt (issue, file path, fix, code references) ready to paste straight into Claude Code or any AI tool.
- **Ideas canvas.** A free, blank design canvas. Drag node types (Page, Component, API Route, Database Table, External Service, Auth Layer, Note) from the left palette onto the canvas, rename inline, connect by dragging handles, label connections, and use the right-click menu to add, delete, or duplicate. Saves to `brain/ideas.json` and reloads automatically. Never touched by an analysis.
- **Database schema designer.** A SQL editor beside a live table-node canvas. Type or paste `CREATE TABLE` statements and the canvas generates table nodes with columns and types, drawing foreign-key relationships between them. Edits sync both ways, and tables can be pushed into the Ideas canvas to sketch a full database-to-backend-to-frontend system.
- **Automatic stack detection.** Recognizes React, Vue, Svelte, Next, Express, Fastify, WebSockets, Prisma, PostgreSQL, MongoDB, plus Python, Go, Rust, Ruby, Scala, and more, and classifies each file by its role.
- **Re-analyze and freshness.** A Re-analyze button forces a fresh full scan, rebuilds the canvas in place without losing your viewport, and updates the brain, with a timestamp showing when the data was last refreshed.
- **In-app terminal.** Type real commands (`ls`, `pwd`, `git status`, ...). `cd` into any folder and ArchLab immediately maps that directory onto the canvas. Per-connection working directory, command history, localhost-bound.
- **Animated 7-step check pipeline.** Each step lights up live on the canvas as it runs and raises teaching diagnostics: what was found, why it matters, how to fix it, and how to optimize further.
- **Full intelligence report.** A structured diagnostic summary of the project's architecture, data flow, security posture, performance, and scale readiness.
- **Global brain.** Patterns and findings are stored locally and accumulate across every project you analyze, so the analysis gets sharper the more you use it. Open **Brain** in the top bar to browse cross-project learning.
- **Local MCP server.** Exposes the global brain to any MCP-aware AI tool over stdio. Read-only, never opens a network connection.
- **100% local.** WebSockets over localhost, local JSON + Markdown storage. Nothing leaves your machine.

## Architecture

A npm-workspaces monorepo:

| Package | Role |
|---|---|
| `packages/shared` | TypeScript contract types shared by every package (canvas, pipeline, brain, WebSocket protocol). |
| `packages/backend` | Node + WebSocket server. Scans folders, builds the canvas, runs the animated pipeline, writes the brain. |
| `packages/frontend` | React + React Flow command center UI (top bar, sidebars, canvas, bottom pipeline panel, brain modal). |
| `packages/mcp-server` | Local stdio MCP server exposing the global brain to any AI tool. |
| `brain/` | Local JSON + Markdown brain storage (gitignored). |

All real-time communication is over WebSockets using the typed protocol in
`@archlab/shared`. The canvas is always generated from real parsed code.

## Getting started

```bash
npm install
npm run build:shared   # build the shared contract once (or use npm run dev which does it)
npm run dev            # starts backend (4317), frontend (5317), and the MCP server
```

Then open http://127.0.0.1:5317. You can load a project two ways:

**From the CLI (recommended).** `cd` into any project folder and run the `archlab` CLI to immediately map it onto the live browser canvas:

**From the in-app terminal.** Use the terminal in the bottom panel to `cd` into any project folder, which will automatically trigger a canvas re-map of that directory.

To load a project from the CLI:

```bash
cd ~/Desktop/React/SomeApp
archlab            # analyze the current directory
archlab --check    # analyze + run the full 7-step pipeline
archlab ./packages/api   # analyze a specific path
```

During development, run the CLI without installing the bin:

```bash
node --import tsx packages/backend/src/cli.ts --check
```

Open **Brain** in the top bar to see cross-project learning.

## The 7-step pipeline

1. Project Intelligence
2. Architecture Mapping
3. Data Flow Tracing
4. Security Checks
5. Performance & Optimization Checks
6. Scale Analysis
7. Final Diagnostic Report

Each step animates live on the canvas and raises teaching diagnostics
(what / why / how to fix / how to optimize further).

## Canvas tabs

The top tab bar switches between five views:

| Tab | What it shows |
|---|---|
| Full Flow | The complete auto-generated architecture canvas. |
| Frontend | The architecture canvas filtered to the frontend lane. |
| Backend | The architecture canvas filtered to the backend lane. |
| Ideas | A free design canvas for sketching from scratch, saved to `brain/ideas.json`. |
| Database | A SQL editor plus a live schema-diagram canvas with two-way sync. |

## Bottleneck detection

Bottlenecks are detected during the Scale Analysis step and can also run on their
own. They are shown in amber, kept visually separate from red critical security
findings, and appear on the canvas, in the findings panel (ordered between high
and medium), and as a count badge in the top bar. Detected types:

1. Single point of failure (3 or more nodes depend on it directly)
2. Database hotspot (a table read or written by 5 or more backend nodes)
3. Middleware choke point (on every request path, no caching detected)
4. Fragile WebSocket connection (no queue, retry, or error handling)
5. Render bottleneck (component reads global state with no memoization)
6. Blocking operation (backend I/O with no async handling)
7. Unbounded query (endpoint returns a table with no pagination or limit)

Each bottleneck includes a concrete scale-threshold estimate, an architectural
fix, and a Copy Prompt button. The global brain tracks bottleneck types across
projects and surfaces a recurring-pattern insight once a type appears in 3 or
more projects.

## MCP server

The MCP server (`packages/mcp-server`) serves the brain over stdio. Point any
MCP-aware tool at `node packages/mcp-server/dist/index.js` (after a build) to give
it `brain_overview`, `list_projects`, `get_project`, and `search_patterns` tools.
It only ever reads local files and never opens a network connection.
