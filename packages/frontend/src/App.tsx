/**
 * ArchLab root layout.
 *
 * Wires the WebSocket-backed state into the full command-center layout:
 * top bar, left sidebar, center canvas, right sidebar, bottom panel, and the
 * brain overlay. Everything is live and connected from the first render.
 */

import { useMemo, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useArchLab } from './state/useArchLab.js';
import { TopBar } from './components/TopBar.js';
import { LeftSidebar } from './components/LeftSidebar.js';
import { RightSidebar } from './components/RightSidebar.js';
import { BottomPanel } from './components/BottomPanel.js';
import { BrainPanel } from './components/BrainPanel.js';
import { Canvas } from './canvas/Canvas.js';
import { IdeasCanvas } from './ideas/IdeasCanvas.js';
import { DatabaseDesigner } from './database/DatabaseDesigner.js';

export type ArchTab = 'all' | 'frontend' | 'backend' | 'ideas' | 'database';

export function App() {
  const { state, analyzeProject, reanalyzeProject, runChecks, sendCommand } = useArchLab();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [brainOpen, setBrainOpen] = useState(false);
  const [bottomHeight, setBottomHeight] = useState(200);
  const [tab, setTab] = useState<ArchTab>('all');
  // The architecture canvas only understands the lane filters.
  const filter: 'all' | 'frontend' | 'backend' =
    tab === 'frontend' || tab === 'backend' ? tab : 'all';
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  const selectedNode = useMemo(
    () => state.canvas.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [state.canvas.nodes, selectedNodeId],
  );

  const isArchitecture = tab === 'all' || tab === 'frontend' || tab === 'backend';

  const gridColumns = useMemo(() => {
    // Ideas and Database tabs use the full width; the analysis sidebars are
    // specific to the architecture canvas.
    if (!isArchitecture) return '0px 1fr 0px';
    const left = showLeftSidebar ? '240px' : '0px';
    const right = showRightSidebar ? '340px' : '0px';
    return `${left} 1fr ${right}`;
  }, [isArchitecture, showLeftSidebar, showRightSidebar]);

  return (
    <div className="app-shell" style={{ gridTemplateRows: `52px 1fr ${bottomHeight}px` }}>
      <TopBar
        connected={state.connected}
        projectName={state.projectName}
        hasProject={Boolean(state.projectId)}
        brainProjectCount={state.brain.projectCount}
        findingsCount={state.diagnostics.length}
        bottleneckCount={state.diagnostics.filter((d) => d.severity === 'bottleneck').length}
        analyzedAt={state.analyzedAt}
        reanalyzing={state.reanalyzing}
        onAnalyze={analyzeProject}
        onReanalyze={reanalyzeProject}
        onRunChecks={runChecks}
        onOpenBrain={() => setBrainOpen(true)}
        tab={tab}
        onTabChange={setTab}
      />

      <div className="app-body" style={{ gridTemplateColumns: gridColumns }}>
        {isArchitecture && showLeftSidebar && (
          <LeftSidebar graph={state.canvas} onSelectNode={setSelectedNodeId} />
        )}

        <main className="app-center">
          {isArchitecture && (
            <>
              {/* Sidebars Hide/Show triggers */}
              <button
                className="sidebar-toggle-btn toggle-left"
                onClick={() => setShowLeftSidebar((p) => !p)}
                title={showLeftSidebar ? 'Hide Left Sidebar' : 'Show Left Sidebar'}
              >
                {showLeftSidebar ? '◀' : '▶'}
              </button>

              <button
                className="sidebar-toggle-btn toggle-right"
                onClick={() => setShowRightSidebar((p) => !p)}
                title={showRightSidebar ? 'Hide Right Sidebar' : 'Show Right Sidebar'}
              >
                {showRightSidebar ? '▶' : '◀'}
              </button>
            </>
          )}

          {tab === 'ideas' ? (
            <IdeasCanvas />
          ) : tab === 'database' ? (
            <DatabaseDesigner inferredSql={state.inferredSql} />
          ) : (
            <ReactFlowProvider>
              <Canvas
                graph={state.canvas}
                diagnostics={state.diagnostics}
                onSelectNode={setSelectedNodeId}
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
          />
        )}
      </div>

      <BottomPanel
        steps={state.steps}
        logs={state.logs}
        terminal={state.terminal}
        onCommand={sendCommand}
        height={bottomHeight}
        onResize={setBottomHeight}
      />

      {brainOpen && <BrainPanel brain={state.brain} onClose={() => setBrainOpen(false)} />}
    </div>
  );
}
