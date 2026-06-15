# ArchLab

ArchLab is a local engineering command center and AI brain that maps, scans, and analyzes your software architecture. Drop in any project folder to visualize its data flows on a live interactive canvas, run a 7-step diagnostic pipeline, and build a local knowledge base that grows smarter across every project you analyze.

Everything runs on `localhost`. No code or intelligence ever leaves your machine.

---

## Core Features

*   **Live Architecture Canvas** — Automatically maps scanned files to a React Flow graph split into swim lanes (Frontend on left, Backend on right) with right-angled (smoothstep) routing. Hovering a node highlights its entire data flow dependency chain.
*   **7-Step Diagnostic Pipeline** — Animates live to run heuristic checks for security leaks, performance hotspots, scale bottlenecks (N+1 queries, single points of failure, fragile WebSockets), and outputs a full diagnostic report.
*   **Code Intelligence & Impact Analysis** — Side-panel editor with context-aware actions (symbol navigation, N+1 query warning fixes). Edits trigger a 2-column impact analysis showing before/after diffs and affected files.
*   **Database Schema & Infrastructure Designer** — Two-way SQL editor that generates table diagrams with interactive foreign-key linking. Includes a System Design tab that auto-detects Edge, Application, and Data layers.
*   **Agent Team Integration** — Six specialized local AI agents (Security, Performance, Database, Code Quality, Architecture, and Orchestrator) loaded with project-specific brain context for inline audits.
*   **Interactive PTY Terminal** — Built-in pseudo-terminal (xterm.js) that persists shell sessions across browser reloads, supporting drag-and-drop file uploads.
*   **Local MCP Server** — Exposes your aggregated project brain to external MCP-aware AI code tools (like Claude Code) via a stdio server.

---

## Technical Architecture

ArchLab is organized as an `npm` workspaces monorepo:

| Package | Role |
| :--- | :--- |
| [`packages/shared`](file:///Users/kinclarkperez/Desktop/React/ArchLab/packages/shared) | Shared TypeScript contracts (canvas schemas, WebSocket protocol). |
| [`packages/backend`](file:///Users/kinclarkperez/Desktop/React/ArchLab/packages/backend) | Node + WebSocket server. Scans paths, runs pipelines, writes brain data. |
| [`packages/frontend`](file:///Users/kinclarkperez/Desktop/React/ArchLab/packages/frontend) | React + React Flow visual command center UI. |
| [`packages/mcp-server`](file:///Users/kinclarkperez/Desktop/React/ArchLab/packages/mcp-server) | Local stdio Model Context Protocol (MCP) server portal. |
| [`brain/`](file:///Users/kinclarkperez/Desktop/React/ArchLab/brain) | Local gitignored JSON and Markdown brain storage folder. |

---

## Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Start the Stack (Backend, Frontend, and MCP Server):**
    ```bash
    npm run dev
    ```
    *   Frontend runs at: [http://127.0.0.1:5317](http://127.0.0.1:5317)
    *   Backend runs at: [http://127.0.0.1:4317](http://127.0.0.1:4317)

3.  **Analyze a Project from the CLI:**
    ```bash
    # cd into your target project
    cd ~/Desktop/React/SomeApp
    # Run the analyzer and trigger pipeline checks
    npx archlab --check
    ```
