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
- **Code Intelligence Panel.** Lock any node and a syntax-highlighted code panel (VS Code dark theme) slides in as a third column, reading the file straight from disk. A symbol navigator jumps to any function, class, route, or method. Every line has a dropdown explaining what it does in plain English plus context-aware actions (add auth, add validation, fix SQL injection, convert to async, add JSDoc, and more) that are prioritized by what the check pipeline already found. Lines referenced elsewhere show a "used in N files" badge whose popover lists every call site. The panel is fully editable — click a line and type — and Save runs a project-wide **Impact Analysis** (before/after diffs across every affected file) before writing to disk; each write is backed up to `brain/backups/<timestamp>/` and triggers a re-analysis.
- **Connected vs Isolated containers.** Every architecture view splits nodes into a blue-tinted *Connected* container and an amber *Isolated* container for nodes with zero connections. Each isolated node carries a warning badge explaining the risk (Unused component, Unreachable route, Orphaned model, Disconnected service), and the top bar shows a live isolated-node count.
- **Entry-point hierarchy.** Each lane's entry point (`main`/`index`/`App` on the frontend, `index`/`app`/`server` on the backend, with an import-degree fallback) is detected automatically and rendered larger with a glow and an ENTRY badge. Every reachable node shows an `L{n}` depth badge (BFS distance from the entry) so you can trace flow outward and see how deep a file lives.
- **Collapsible, resizable panels.** The left sidebar, right findings panel, and bottom pipeline/terminal panel each collapse independently (keyboard: **B** or **⌘+B**/**Ctrl+B** for the left sidebar, **R** for the right findings panel, and **M** or **⌘+J**/**Ctrl+J** for the bottom panel/terminal). The right findings panel and Code Intelligence Panel are drag-resizable from their left edge. All layout preferences persist to `localStorage`. A **Keyboard Shortcuts** guide is accessible via the top bar button.
- **Bottleneck detector.** Runs inside the pipeline and standalone. Flags scale bottlenecks in amber (distinct from red security findings): single points of failure, database hotspots, middleware choke points, fragile WebSocket connections, heavy re-render components, blocking operations, and unbounded queries. Each carries a concrete user-threshold estimate and an architectural fix.
- **Copy Prompt everywhere.** Next to every finding, diagnostic, suggestion, bottleneck, and brain insight is a Copy Prompt button that copies a fully formed, context-rich prompt (issue, file path, fix, code references) ready to paste straight into Claude Code or any AI tool.
- **Scratch canvas.** A free, blank design canvas. Drag node types (Page, Component, API Route, Database Table, External Service, Auth Layer, Note) from the left palette onto the canvas, rename inline, connect by dragging handles, label connections, and use the right-click menu to add, delete, or duplicate. Saves to `brain/ideas.json` and reloads automatically. Never touched by an analysis.
- **Database schema designer.** A SQL editor beside a live table-node canvas. Type or paste `CREATE TABLE` statements and the canvas generates table nodes with columns and types, drawing foreign-key relationships between them. Features confirmed vs inferred table grouping (color-coded containers), collapsed views (summarizing column counts to keep layouts clean while expanding to full list on selection), graphical PK/FK indicators (🔑/🔗), unresolved reference warnings, and styled relationship edge labels with tooltip diagnostics. Edits sync both ways, and tables can be pushed into the Ideas canvas to sketch a full database-to-backend-to-frontend system.
- **Brain Access Control & Security Gating.** Full-screen launch lock powered by local scrypt password verification. Fine-grained read permissions and locked-project lists are enforced directly on the local MCP server, keeping all workspace and analysis metadata secure. A dedicated Brain Security panel allows managing passwords and permissions.
- **Automatic stack detection.** Recognizes React, Vue, Svelte, Next, Express, Fastify, WebSockets, Prisma, PostgreSQL, MongoDB, plus Python, Go, Rust, Ruby, Scala, and more, and classifies each file by its role.
- **Re-analyze and freshness.** The Security tab's Pipeline Controls hold the Re-analyze and Run Checks buttons. Re-analyze forces a fresh full scan, rebuilds the canvas in place without losing your viewport, and updates the brain, with a timestamp showing when the data was last refreshed. The top bar stays minimal: logo and project name on the left, findings / bottleneck / isolated counts and the Brain indicator on the right.
- **In-app terminal.** Type real commands (`ls`, `pwd`, `git status`, ...). `cd` into any folder and ArchLab immediately maps that directory onto the canvas. Supports drag-and-drop file and folder uploads (or file-picker selection), automatically base64-uploading assets to a temporary working directory on the backend and returning the path for shell integration. Per-connection working directory, command history, localhost-bound. Tabs can be created, duplicated, renamed, and closed freely; default tab names automatically sequence themselves dynamically when tabs are removed, preserving manually named tabs.
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

The centered top tab bar (each tab has an icon) switches between eight views (keyboard: numbers **1** to **8** switch views sequentially):

| Tab | What it shows |
|---|---|
| Full Flow | The complete auto-generated architecture canvas. |
| Frontend | The architecture canvas filtered to the frontend lane. |
| Backend | The architecture canvas filtered to the backend lane. |
| Database | A SQL editor plus a live schema-diagram canvas with two-way sync. |
| API | The canvas filtered to route and endpoint nodes plus their direct connections. |
| Security | Auth, middleware, and security-flagged nodes (plus connections), with the **Pipeline Controls** toolbar (Re-analyze, Run Checks). |
| Scratch | A free design canvas for sketching from scratch, saved to `brain/ideas.json`. |

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
