/**
 * ArchLab root layout.
 *
 * Wires the WebSocket-backed state into the full command-center layout:
 * top bar, left sidebar, center canvas, right sidebar, bottom panel, and the
 * brain overlay. Everything is live and connected from the first render.
 */

import { useEffect, useMemo, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useArchLab } from './state/useArchLab.js';
import { usePersistentBoolean } from './lib/usePersistentBoolean.js';
import { usePersistentNumber } from './lib/usePersistentNumber.js';

/**
 * Drag-to-resize for a right-anchored panel: dragging its left edge leftward
 * widens it. Updates are clamped by the setter. Direct document listeners keep
 * the drag smooth and let the cursor leave the thin handle without dropping it.
 */
function makeResizeHandler(current: number, set: (n: number) => void) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = current;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => set(startW - (ev.clientX - startX));
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
}
import { TopBar } from './components/TopBar.js';
import { LeftSidebar } from './components/LeftSidebar.js';
import { RightSidebar } from './components/RightSidebar.js';
import { BottomPanel } from './components/BottomPanel.js';
import { BrainPanel } from './components/BrainPanel.js';
import { Canvas } from './canvas/Canvas.js';
import { CodeIntelPanel } from './components/CodeIntelPanel.js';
import { IdeasCanvas } from './ideas/IdeasCanvas.js';
import { DatabaseDesigner } from './database/DatabaseDesigner.js';

export type ArchTab =
  | 'all'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'api'
  | 'security'
  | 'scratch';

/** Tabs that render the architecture canvas (vs. the Database/Scratch surfaces). */
export type CanvasFilter = 'all' | 'frontend' | 'backend' | 'api' | 'security';

export function App() {
  const { state, reanalyzeProject, runChecks, sendCommand } = useArchLab();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [brainOpen, setBrainOpen] = useState(false);
  const [bottomHeight, setBottomHeight] = useState(200);
  const [tab, setTab] = useState<ArchTab>('all');
  // Architecture canvas tabs map straight to a canvas filter; others fall to all.
  const filter: CanvasFilter =
    tab === 'frontend' || tab === 'backend' || tab === 'api' || tab === 'security' ? tab : 'all';
  // Collapsible panels. Left sidebar and bottom panel persist across refreshes.
  const [showLeftSidebar, , toggleLeftSidebar] = usePersistentBoolean('archlab:leftSidebar', true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [bottomCollapsed, , toggleBottom] = usePersistentBoolean('archlab:bottomCollapsed', false);
  // The Code Intelligence Panel: which locked node (with a source file) it shows.
  const [codeNodeId, setCodeNodeId] = useState<string | null>(null);
  // Resizable panel widths, persisted between sessions.
  const [codeWidth, setCodeWidth] = usePersistentNumber('archlab:codeWidth', 480, 300, 800);
  const [rightWidth, setRightWidth] = usePersistentNumber('archlab:rightWidth', 340, 200, 500);

  // Keyboard shortcuts: B toggles the left sidebar, M toggles the bottom panel.
  // Ignored while typing into the terminal or any text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return;
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleLeftSidebar();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleBottom();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleLeftSidebar, toggleBottom]);

  const selectedNode = useMemo(
    () => state.canvas.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [state.canvas.nodes, selectedNodeId],
  );

  const isArchitecture =
    tab === 'all' || tab === 'frontend' || tab === 'backend' || tab === 'api' || tab === 'security';

  // Count nodes with no edges at all — the project's disconnected parts.
  const isolatedCount = useMemo(() => {
    const degree = new Set<string>();
    for (const e of state.canvas.edges) {
      degree.add(e.source);
      degree.add(e.target);
    }
    return state.canvas.nodes.filter((n) => !degree.has(n.id)).length;
  }, [state.canvas.nodes, state.canvas.edges]);

  // Open the code panel whenever a node with a source file is locked.
  const codeNode = useMemo(
    () => state.canvas.nodes.find((n) => n.id === codeNodeId) ?? null,
    [state.canvas.nodes, codeNodeId],
  );
  const showCodePanel = isArchitecture && Boolean(codeNode?.filePath);

  const handleSelectNode = (id: string | null) => {
    setSelectedNodeId(id);
    const node = id ? state.canvas.nodes.find((n) => n.id === id) ?? null : null;
    setCodeNodeId(node?.filePath ? id : null);
  };

  // True whenever a full-screen overlay is showing. The bottom-panel toggle is
  // hidden while this is true so it never floats on top of a modal.
  const isAnyModalOpen = brainOpen;

  return (
    <div
      className="app-shell"
      style={{ gridTemplateRows: `52px 1fr ${bottomCollapsed ? 0 : bottomHeight}px` }}
    >
      <TopBar
        connected={state.connected}
        projectName={state.projectName}
        hasProject={Boolean(state.projectId)}
        brainProjectCount={state.brain.projectCount}
        findingsCount={state.diagnostics.length}
        bottleneckCount={state.diagnostics.filter((d) => d.severity === 'bottleneck').length}
        isolatedCount={isolatedCount}
        analyzedAt={state.analyzedAt}
        onOpenBrain={() => setBrainOpen(true)}
        tab={tab}
        onTabChange={setTab}
      />

      <div className="app-body">
        {isArchitecture && showLeftSidebar && (
          <LeftSidebar
            graph={state.canvas}
            onSelectNode={handleSelectNode}
            onCollapse={toggleLeftSidebar}
          />
        )}

        <main className="app-center">
          {/* When a sidebar is collapsed, a slim reveal tab sits on the screen
              edge so the user can bring it back. These belong to the edges, not
              the canvas surface. */}
          {isArchitecture && !showLeftSidebar && (
            <button
              className="panel-reveal-tab on-left"
              onClick={toggleLeftSidebar}
              title="Show left sidebar (B)"
            >
              ▶
            </button>
          )}
          {isArchitecture && !showRightSidebar && (
            <button
              className="panel-reveal-tab on-right"
              onClick={() => setShowRightSidebar((p) => !p)}
              title="Show right sidebar"
            >
              ◀
            </button>
          )}

          {/* Security tab owns the pipeline controls — that is where findings
              are reviewed and fresh scans are triggered. */}
          {tab === 'security' && (
            <div className="pipeline-controls">
              <span className="pipeline-controls-label">Pipeline Controls</span>
              <div className="pipeline-controls-row">
                <button
                  className="btn"
                  disabled={!state.projectId || !state.connected || state.reanalyzing}
                  onClick={reanalyzeProject}
                  title="Force a fresh full scan of the current project"
                >
                  {state.reanalyzing ? (
                    <>
                      <span className="btn-spinner" aria-hidden="true" /> Re-analyzing…
                    </>
                  ) : (
                    'Re-analyze'
                  )}
                </button>
                <button
                  className="btn"
                  disabled={!state.projectId || !state.connected}
                  onClick={runChecks}
                >
                  Run Checks
                </button>
              </div>
            </div>
          )}

          {tab === 'scratch' ? (
            <IdeasCanvas />
          ) : tab === 'database' ? (
            <DatabaseDesigner inferredSql={state.inferredSql} />
          ) : (
            <ReactFlowProvider>
              <Canvas
                graph={state.canvas}
                diagnostics={state.diagnostics}
                onSelectNode={handleSelectNode}
                selectedNodeId={selectedNodeId}
                filter={filter}
              />
            </ReactFlowProvider>
          )}
        </main>

        {isArchitecture && showRightSidebar && (
          <RightSidebar
            projectId={state.projectId}
            projectName={state.projectName}
            projectPath={state.projectPath}
            graph={state.canvas}
            diagnostics={state.diagnostics}
            selectedNode={selectedNode}
            intelligence={state.intelligence}
            onCollapse={() => setShowRightSidebar((p) => !p)}
            width={rightWidth}
            onResizeStart={makeResizeHandler(rightWidth, setRightWidth)}
          />
        )}

        {showCodePanel && codeNode && (
          <CodeIntelPanel
            projectId={state.projectId}
            node={codeNode}
            diagnostics={state.diagnostics}
            onClose={() => setCodeNodeId(null)}
            width={codeWidth}
            onResizeStart={makeResizeHandler(codeWidth, setCodeWidth)}
          />
        )}
      </div>

      {bottomCollapsed ? (
        <button
          className="bottom-reveal-btn"
          onClick={toggleBottom}
          title="Show bottom panel (M)"
          style={isAnyModalOpen ? { display: 'none' } : undefined}
        >
          ▲ Pipeline &amp; Terminal
        </button>
      ) : (
        <BottomPanel
          steps={state.steps}
          logs={state.logs}
          terminal={state.terminal}
          onCommand={sendCommand}
          height={bottomHeight}
          onResize={setBottomHeight}
          onCollapse={toggleBottom}
          toggleHidden={isAnyModalOpen}
        />
      )}

      {brainOpen && <BrainPanel brain={state.brain} onClose={() => setBrainOpen(false)} />}
    </div>
  );
}
