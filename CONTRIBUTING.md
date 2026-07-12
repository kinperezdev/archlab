# Contributing to ArchLab

Welcome. This guide gets you from clone to a confident first change. Read it once; it covers how the system fits together, how to run it, and the conventions the codebase expects.

## The one-paragraph mental model

ArchLab is a local-only engineering command center. A Node backend (`packages/backend`) scans any project folder on your machine, turns it into an architecture graph, runs diagnostic pipelines over it, and persists what it learns into a local "brain" folder. A React frontend (`packages/frontend`) renders that graph on a live canvas and streams pipeline progress over a WebSocket. A small stdio MCP server (`packages/mcp-server`) exposes the brain to AI tools like Claude Code. Nothing leaves localhost: the only internet calls are keyless version/vulnerability lookups in `backend/src/services/liveData.ts` and `docsLive.ts`, and both fail soft when offline.

## Repository layout

| Path | What lives there |
| :--- | :--- |
| `packages/shared` | TypeScript contracts shared by everything: canvas node/edge types, the WebSocket message protocol (`ws.ts`), fixed ports. Change protocol here first, then both sides. |
| `packages/backend` | Express + WebSocket server on port 4317. Subfolders: `analyzer/` (scanning, classification, edges, schema parsing/inference), `pipeline/` (the 7-step checks, `bottleneck.ts`), `brain/` (persistence + access lock), `terminal/` (node-pty sessions), `services/` (live internet data), `security/` (path containment), `agents/`, `doctor/`. |
| `packages/frontend` | React + Vite on port 5317. Subfolders: `canvas/`, `database/`, `docs/`, `systemdesign/`, `team/archco/`, `components/`, `state/` (the `useArchLab` hook owns the WebSocket and all app state), `lib/` (session auth, storage). |
| `packages/mcp-server` | Stdio MCP server. No network socket. |
| `brain/` | Runtime data: analyses, insights, API keys, session token. Gitignored except its README. Never commit its contents. |

## Running it

```bash
npm install          # Node >= 20 required (node-pty builds natively)
npm run dev          # backend + frontend + mcp with watchers
# or for stable sessions that survive file edits:
npm run build && npm start
```

Frontend: http://127.0.0.1:5317 · Backend health: http://127.0.0.1:4317/health

Kill a stuck stack by process tree, not by port. Watchers respawn children:

```bash
pkill -f "tsx watch"; pkill -f "concurrently"; kill -9 $(lsof -t -i:4317) 2>/dev/null
```

## How the pieces talk

1. On boot the backend generates a per-run session token, binds the port, then writes the token to `brain/.session-token` (order matters: a second launch that loses the port race must not clobber the running instance's token).
2. The frontend fetches the token from `/session/token` at startup (`lib/session.ts` patches `window.fetch` so every backend call carries it), then opens the WebSocket with `?token=`.
3. All live data (analysis results, pipeline ticks, terminal output, brain updates) streams over that one WebSocket as typed `ServerMessage`s defined in `packages/shared/src/ws.ts`. `useArchLab.ts` reduces them into immutable state. Terminal output bypasses React state and goes straight to xterm subscribers, with buffering for output that arrives before a subscriber attaches.

## Rules the code enforces (do not weaken these)

- **Path containment.** Any filesystem path that originates from a request must pass `security/paths.ts#resolveWithin` before touching disk. It resolves symlinks and rejects traversal.
- **Writes are allowlisted.** Code modification goes through the ArchCo apply endpoint only: allowlisted directories, automatic backups, audit log.
- **Keys are write-only.** The backend never returns stored API key values, only presence booleans. The in-app terminal's environment has the provider keys stripped.
- **Honest labeling.** Inferred data (guessed DB tables, heuristic findings) is always presented as inferred/unverified in the UI, never mixed with confirmed facts. This is a product principle, not a style choice.

## Conventions

- Every source file opens with a `/** ... */` header saying what the file is and how it fits. Match the existing tone: explain the why, not the obvious what.
- Many small files over few large ones. New surface area gets its own module.
- Findings and user-facing copy are direct and literal. No claims the product cannot enforce.
- Vendored files (`frontend/src/components/ui/*-icon.tsx`) are from the shadcn registry; regenerate rather than hand-edit.
- TypeScript strict; `npm run typecheck` and `npm run build` must both pass before any commit.

## Making a change

1. `npm run dev`, reproduce or build against the live app.
2. Change the shared contract first if the WebSocket protocol or canvas types are involved.
3. `npm run typecheck && npm run build`.
4. Exercise the affected flow in the browser (the canvas, terminal, and pipeline are the critical paths).
5. Conventional commit messages: `feat|fix|refactor|docs|chore(scope): description`.

## Licensing and sign-off

ArchLab is GPL-3.0. By contributing, you agree your work ships under the same license.

Every commit needs a Developer Certificate of Origin sign-off. It is one flag:

```bash
git commit -s -m "feat(scope): description"
```

The `-s` adds a `Signed-off-by: Your Name <email>` line to the commit. That line certifies you wrote the change, or have the right to submit it, under GPL-3.0 (full text at [developercertificate.org](https://developercertificate.org)). Pull requests with unsigned commits will be asked to amend before merge. No separate CLA, no paperwork beyond the flag.

## Where to look when something breaks

| Symptom | First place to look |
| :--- | :--- |
| 401s from the backend | Token mismatch: is a stale backend holding the port? Check `brain/.session-token` vs the running process. |
| Blank terminal | `useArchLab.ts` send queue / term-data buffering, then `backend/terminal/shell.ts`. |
| Canvas empty after analyze | Backend log for scan errors; the analyzer needs at least one recognizable source file. |
| Port already in use | A previous stack survived. Kill the process tree (command above). |
