# ArchLab

ArchLab is a local engineering command center and AI brain that maps, scans, and analyzes your software architecture. Drop in any project folder to visualize its data flows on a live interactive canvas, run a 7-step diagnostic pipeline, and build a local knowledge base that grows smarter across every project you analyze.

Everything runs on `localhost`. No code or intelligence ever leaves your machine.

---

## Core Features

*   **Live Architecture Canvas** — Automatically maps scanned files to a React Flow graph split into swim lanes (Frontend on left, Backend on right) with right-angled (smoothstep) routing. Hovering a node highlights its entire data flow dependency chain.
*   **7-Step Diagnostic Pipeline** — Animates live to run heuristic checks for security leaks, performance hotspots, scale bottlenecks (N+1 queries, single points of failure, fragile WebSockets), and outputs a full diagnostic report.
*   **Code Intelligence & Impact Analysis** — Side-panel editor with context-aware actions (symbol navigation, N+1 query warning fixes). Edits trigger a 2-column impact analysis showing before/after diffs and affected files.
*   **Database Schema & Infrastructure Designer** — Two-way SQL editor that generates table diagrams with interactive foreign-key linking. Includes a System Design tab that auto-detects Edge, Application, and Data layers. The SQL Schema panel features a full-height edge-collapse button pinned to the right boundary.
*   **Agent Team Integration** — Six specialized local AI agents (Security, Performance, Database, Code Quality, Architecture, and Orchestrator) loaded with project-specific brain context for inline audits. Configure your AI API keys directly from the **🔑 API Keys** button in the TopBar.
*   **Interactive PTY Terminal** — Built-in pseudo-terminal (xterm.js) that persists shell sessions across browser reloads, supporting drag-and-drop file uploads. Terminal sessions automatically start inside the current active project directory displayed on the canvas.
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

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure AI API Keys
Click the **🔑 API Keys** button in the top navigation bar of the web app to paste and save your **Anthropic (Claude)**, **OpenAI**, or **Gemini** keys. Keys are saved locally inside `brain/api_keys.json` and loaded into the backend immediately without server restarts.

### 3. Start the Stack

Depending on your use case, start the stack in one of two modes:

#### Option A: Stable Mode (Recommended for general use)
Runs the backend and MCP server compiled without file watchers. This prevents the server from restarting and interrupting active terminal sessions or running AI agents when files are modified in the workspace.
```bash
# Build the packages first
npm run build

# Start the stack
npm start
```

#### Option B: Development Watch Mode
Runs the backend and MCP server with `tsx watch` for auto-restarting when backend files change.
```bash
npm run dev
```

*   Frontend runs at: [http://127.0.0.1:5317](http://127.0.0.1:5317)
*   Backend runs at: [http://127.0.0.1:4317](http://127.0.0.1:4317)

### 4. Analyze a Project from the CLI
```bash
# cd into your target project
cd ~/Desktop/React/SomeApp
# Run the analyzer and trigger pipeline checks
npx archlab --check
```
