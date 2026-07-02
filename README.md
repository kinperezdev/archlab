# ArchLab

ArchLab is a local engineering command center and AI brain that maps, scans, and analyzes your software architecture. Drop in any project folder to visualize its data flows on a live interactive canvas, run a 7-step diagnostic pipeline, and build a local knowledge base that grows smarter across every project you analyze.

Everything runs on `localhost`. No code or intelligence ever leaves your machine.

---

## Core Features

*   **Live Architecture Canvas** — Automatically maps scanned files to a React Flow graph split into swim lanes (Frontend on left, Backend on right) with right-angled (smoothstep) routing. Hovering a node highlights its entire data flow dependency chain.
*   **7-Step Diagnostic Pipeline** — Animates live to run heuristic checks for security leaks, performance hotspots, scale bottlenecks (N+1 queries, single points of failure, fragile WebSockets), and outputs a full diagnostic report.
*   **Code Intelligence & Impact Analysis** — Side-panel editor with context-aware actions (symbol navigation, N+1 query warning fixes). Edits trigger a 2-column impact analysis showing before/after diffs and affected files.
*   **Database Schema & Infrastructure Designer** — Two-way SQL editor that generates table diagrams with interactive foreign-key linking. The SQL Schema panel features a full-height edge-collapse button pinned to the right boundary.
*   **System Design Tab** — Auto-detects Edge, Application, and Data layers from real code, with three sub-modes:
    *   **Visual Mode** — a live React Flow canvas of detected infrastructure nodes with a security overlay, gap-analysis suggestions, and a horizontal request journey.
    *   **Guide Mode** — a narrative architecture document with a scroll-spy table of contents and PDF export.
    *   **Enterprise Audit** — a glowing capability grid across 8 categories (Infrastructure, System Design Principles, API Security, Observability, Resilience, Data Architecture, Security Hardening, Deployment & Scale). Every card lights up live from detected infrastructure and pipeline findings (Detected / Partial / Missing / Critical Gap), with hover tooltips, an aggregated Enterprise Score ring, per-section breakdown bars, and a one-click PDF report.
*   **Command Center Shell** — A clean enterprise-dark layout with a permanent left navigation sidebar grouped into **Canvas** (Full Flow, Frontend, Backend, API, Security), **Workspace** (Database, System Design, Blueprint, Docs), **Tools** (Agent Team, ArchCo, Brain), and **Settings** (Shortcuts, API Keys). A top-bar **Open Folder** button opens a native folder picker and points both the canvas analysis and the built-in terminal (it `cd`s into the chosen path) at one project. ArchCo opens as its own dedicated full-screen tab; Agent Team and Brain open as side panels. Nav items use hover-animated icons, and a Flicker-style pixel loader appears during long-running work (re-analysis, agent runs). A 48px top bar shows the project name, a live breadcrumb of the active surface, an animated backend connection indicator, a findings count, and the API-key status dot.
*   **Agent Team Integration** — Six specialized local AI agents (Security, Performance, Database, Code Quality, Architecture, and Orchestrator) loaded with project-specific brain context for inline audits. After a run, the panel emits a consolidated **Master Fix Prompt** that bundles every finding plus the orchestrator report into one paste-ready prompt for a coding agent. Configure your AI API keys from the **API Keys** item in the sidebar's **Settings** group.
*   **ArchCo Virtual Company** — A living, pixel-art engineering company of 25+ employees across five floors (Leadership, Engineering, Product & Design, Security & QA, Executive Suite) with a real-time day/night cycle that controls lighting and who is present. It runs on its own dedicated full-screen tab, opened from the **ArchCo** item in the sidebar's **Tools** group: review-queue items are assigned to employees by specialization, a token monitor (Fran on Floor 1) tracks the session burn rate, the Security floor reflects live threat level, clickable employee profiles show XP/level/specializations, and a Company Wiki on Floor 5 holds institutional memory of past decisions. Each employee has their own workstation (desk, computer, and chair) in a corporate office complete with ceiling lighting, a wall clock, framed art, a water cooler, and a lounge coffee table. Employees roam the floors as pixel sprites, hold spaced-out conversations, ride the elevator to **visit other floors and ask a colleague** (both gain XP), react to **Pay Payroll** and **AI Update** events, and the review queue can emit its own **Master Fix Prompt** with each item delegated to the owning employee.
*   **Engineering Docs Knowledge Base** — A fully offline, searchable reference under the **Docs** tab covering System Design, API Design, Security, Databases, Infrastructure, Observability, Architecture Patterns, Mobile, DevOps, and Code Quality. Every article is written at senior-interview depth with prose sections, real-world company examples, runnable code in multiple languages, and hand-authored SVG diagrams. The article library is fully offline; a **Live Tech Radar** at the top pulls current version and end-of-life data for the covered technologies from endoflife.date (cached locally, refreshed daily).
*   **Interactive PTY Terminal** — Built-in pseudo-terminal (xterm.js) that persists shell sessions across browser reloads, supporting drag-and-drop file uploads. Terminal sessions automatically start inside the current active project directory displayed on the canvas.
*   **Local MCP Server** — Exposes your aggregated project brain to external MCP-aware AI code tools (like Claude Code) via a stdio server. Open **Tools → Brain** in the sidebar to inspect it, organized into tabbed categories (Insights, Patterns, Connect & Import, Security) so you can jump straight to what you need.

---

## Technical Architecture

ArchLab is organized as an `npm` workspaces monorepo:

| Package | Role |
| :--- | :--- |
| [`packages/shared`](packages/shared) | Shared TypeScript contracts (canvas schemas, WebSocket protocol). |
| [`packages/backend`](packages/backend) | Node + WebSocket server. Scans paths, runs pipelines, writes brain data. |
| [`packages/frontend`](packages/frontend) | React + React Flow visual command center UI. |
| [`packages/mcp-server`](packages/mcp-server) | Local stdio Model Context Protocol (MCP) server portal. |
| [`brain/`](brain) | Local gitignored JSON and Markdown brain storage folder. |

---

## Getting Started

> Contributing or onboarding as an engineer? Start with [CONTRIBUTING.md](CONTRIBUTING.md): the mental model, how the packages talk, and the rules the code enforces.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure AI API Keys
Open **Settings → API Keys** in the left sidebar of the web app to paste and save your **Anthropic (Claude)**, **OpenAI**, or **Gemini** keys. Keys are saved locally inside `brain/api_keys.json` and loaded into the backend immediately without server restarts.

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

---

## Credits

*   Hover-animated UI icons from [itshover.com](https://www.itshover.com/icons) (installed via the shadcn registry).
*   Pixel loader inspired by [Flicker](https://flicker.laurie.fyi) by Laura.
