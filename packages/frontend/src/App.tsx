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
import type { CanvasGraph, CanvasNode, Diagnostic, PipelineStepId } from '@archlab/shared';
import { PORTS } from '@archlab/shared';
import { TopBar } from './components/TopBar.js';
import { Sidebar } from './components/Sidebar.js';
import { RightSidebar } from './components/RightSidebar.js';
import { BottomPanel } from './components/BottomPanel.js';
import { PipelineTags } from './components/PipelineTags.js';
import { LockScreen } from './components/LockScreen.js';
import { fetchAccessStatus } from './lib/brainAccess.js';
import type { BrainAccessStatus } from '@archlab/shared';
import { BrainPanel } from './components/BrainPanel.js';
import { Canvas } from './canvas/Canvas.js';
import { CodeIntelPanel } from './components/CodeIntelPanel.js';
import { SystemDesign, type TabMode } from './systemdesign/SystemDesign.js';
import { AgentTeam } from './agents/AgentTeam.js';
import { TeamReview } from './team/TeamReview.js';
import { DatabaseDesigner } from './database/DatabaseDesigner.js';
import { Docs } from './docs/Docs.js';
import { SimulationPanel } from './simulation/SimulationPanel.js';
import { SimulationReport } from './simulation/SimulationReport.js';
import { runSimulation, type SimulationResult, type SimulationScenario } from './simulation/simulationEngine.js';
import { ShortcutsPanel } from './components/ShortcutsPanel.js';
import { ApiKeysModal } from './components/ApiKeysModal.js';
import { ApiKeyContext } from './state/apiKeyContext.js';
import { NudgeText } from './components/ConfidenceNudge.js';
import { FlickerLoader } from './components/FlickerLoader.js';
import { formatRunTimestamp } from './lib/formatTime.js';

export type ArchTab =
  | 'all'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'api'
  | 'security'
  | 'systemdesign'
  | 'docs'
  | 'archco'
  | 'agentteam';

/** Tabs that render the architecture canvas (vs. the Database and System Design surfaces). */
export type CanvasFilter = 'all' | 'frontend' | 'backend' | 'api' | 'security';

function isNodeVisibleInCanvasTab(
  node: CanvasNode,
  tab: ArchTab,
  graph: CanvasGraph,
  diagnostics: Diagnostic[],
): boolean {
  if (tab === 'all') return true;
  if (tab === 'frontend') return node.lane === 'frontend';
  if (tab === 'backend') return node.lane === 'backend' || node.lane === 'external';
  if (tab === 'api') {
    if (node.kind === 'route' || node.kind === 'endpoint') return true;
    return graph.edges.some((edge) => {
      if (edge.source === node.id) {
        const target = graph.nodes.find((n) => n.id === edge.target);
        return target?.kind === 'route' || target?.kind === 'endpoint';
      }
      if (edge.target === node.id) {
        const source = graph.nodes.find((n) => n.id === edge.source);
        return source?.kind === 'route' || source?.kind === 'endpoint';
      }
      return false;
    });
  }
  if (tab === 'security') {
    const securityIds = new Set<string>();
    for (const d of diagnostics) {
      if (d.step === 'security-checks' || d.severity === 'critical' || d.severity === 'high') {
        for (const id of d.relatedNodeIds) securityIds.add(id);
      }
    }
    if (node.kind === 'auth' || node.kind === 'middleware' || securityIds.has(node.id)) return true;
    return graph.edges.some((edge) => {
      const neighborId = edge.source === node.id ? edge.target : edge.target === node.id ? edge.source : null;
      if (!neighborId) return false;
      const neighbor = graph.nodes.find((n) => n.id === neighborId);
      return Boolean(
        neighbor &&
          (neighbor.kind === 'auth' || neighbor.kind === 'middleware' || securityIds.has(neighbor.id)),
      );
    });
  }
  return false;
}

export function App() {
  const {
    state,
    reanalyzeProject,
    runChecks,
    runAgentTeam,
    stopAgentTeam,
    requestAgentRuns,
    onTerminalData,
    createTerminal,
    closeTerminal,
    focusTerminal,
    sendTerminalInput,
    resizeTerminal,
  } = useArchLab();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Security tab: which pipeline step the findings panel is filtered to (if any).
  const [securityStep, setSecurityStep] = useState<PipelineStepId | null>(null);
  // System Design owns its sub-mode display; we only need the setter to keep the
  // child in sync. The value no longer gates sidebars — they never render on the
  // System Design tab regardless of sub-mode.
  const [, setSystemDesignMode] = useState<TabMode>('visual');
  // Launch lock (Layer 1). `null` until we know the status, then gates the app.
  const [access, setAccess] = useState<BrainAccessStatus | null>(null);

  useEffect(() => {
    fetchAccessStatus().then(setAccess).catch(() => setAccess(null));
  }, []);
  const [brainOpen, setBrainOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [apiKeysOpen, setApiKeysOpen] = useState(false);
  // Whether an Anthropic key is configured — drives Agent Team nudges in the
  // Enterprise Audit. Re-checked whenever the API Keys modal closes.
  const [hasApiKey, setHasApiKey] = useState(false);
  // Full key set (Anthropic/OpenAI/Gemini) for ArchCo's multi-provider AI.
  const [apiKeys, setApiKeys] = useState<{ anthropic?: string; openai?: string; gemini?: string }>({});
  useEffect(() => {
    if (apiKeysOpen) return; // re-check after the modal closes (key may have changed)
    let cancelled = false;
    fetch(`http://127.0.0.1:${PORTS.backend}/api/keys`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.ok) {
          setHasApiKey(Boolean(data.keys?.anthropic || data.keys?.openai || data.keys?.gemini));
          setApiKeys(data.keys ?? {});
        }
      })
      .catch(() => {
        /* backend not ready; treat as no key */
      });
    return () => {
      cancelled = true;
    };
  }, [apiKeysOpen]);
  // Transient "report saved to project root" toast, mirrored from agent state.
  const [reportToast, setReportToast] = useState<string | null>(null);
  const reportSavedPath = state.agentTeam.reportSavedPath;
  useEffect(() => {
    if (!reportSavedPath) return;
    setReportToast(reportSavedPath);
    const id = setTimeout(() => setReportToast(null), 4000);
    return () => clearTimeout(id);
  }, [reportSavedPath]);
  const [bottomHeight, setBottomHeight] = useState(200);
  // One-shot command pushed into the active terminal (e.g. cd into a chosen folder).
  const [termCommand, setTermCommand] = useState<{ id: number; text: string } | null>(null);
  const [choosingFolder, setChoosingFolder] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [tab, setTab] = useState<ArchTab>('all');

  // "Choose Folder": open the native picker, analyze the canvas, and cd the
  // terminal into it (the focused terminal's cwd also drives the canvas).
  const chooseFolder = async () => {
    if (choosingFolder) return;
    setChoosingFolder(true);
    setFolderError(null);
    try {
      const res = await fetch(`http://127.0.0.1:${PORTS.backend}/api/pick-folder`, { method: 'POST' });
      const data = await res.json();
      let folder = data?.ok && data.path ? String(data.path) : '';
      if (!folder) {
        folder = window.prompt('Paste the absolute path to your project folder:')?.trim() ?? '';
      }
      if (!folder) {
        setFolderError('No folder selected.');
        return;
      }
      const quotedFolder = folder.replace(/"/g, '\\"');
      setTermCommand({ id: Date.now(), text: `cd "${quotedFolder}"\n` });
      fetch(`http://127.0.0.1:${PORTS.backend}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootPath: folder }),
      }).catch(() => {});
    } catch (err) {
      const folder = window.prompt('Folder picker is unavailable. Paste the absolute project path:')?.trim() ?? '';
      if (!folder) {
        setFolderError('Folder picker is unavailable. Try again or paste a project path.');
        return;
      }
      const quotedFolder = folder.replace(/"/g, '\\"');
      setTermCommand({ id: Date.now(), text: `cd "${quotedFolder}"\n` });
      fetch(`http://127.0.0.1:${PORTS.backend}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootPath: folder }),
      }).catch(() => {
        setFolderError('Could not analyze that folder.');
      });
    } finally {
      setChoosingFolder(false);
    }
  };
  // Architecture canvas tabs map straight to a canvas filter; others fall to all.
  const filter: CanvasFilter =
    tab === 'frontend' || tab === 'backend' || tab === 'api' || tab === 'security' ? tab : 'all';
  // Collapsible panels. Left sidebar and bottom panel persist across refreshes.
  const [showLeftSidebar, , toggleLeftSidebar] = usePersistentBoolean('archlab:leftSidebar', true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [bottomCollapsed, , toggleBottom] = usePersistentBoolean('archlab:bottomCollapsed', false);
  // The Code Intelligence Panel: which locked node (with a source file) it shows.
  const [codeNodeId, setCodeNodeId] = useState<string | null>(null);
  // Failure simulation: whether the mode is armed, and the latest result.
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  // Resizable panel widths, persisted between sessions.
  const [codeWidth, setCodeWidth] = usePersistentNumber('archlab:codeWidth', 480, 300, 800);
  const [rightWidth, setRightWidth] = usePersistentNumber('archlab:rightWidth', 340, 200, 500);

  // Keyboard shortcuts: L toggles left sidebar, R toggles right sidebar, B toggles bottom panel, 1-9 switches tabs.
  // Ignored while typing into the terminal or any text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // Escape unwinds the currently open UI surface. Child controls such as
      // the code finder handle Escape first and mark the event as handled.
      if (e.key === 'Escape') {
        if (e.defaultPrevented) return;
        if (brainOpen) setBrainOpen(false);
        else if (shortcutsOpen) setShortcutsOpen(false);
        else if (apiKeysOpen) setApiKeysOpen(false);
        else if (codeNodeId) setCodeNodeId(null);
        else if (simulationMode || simulationResult) {
          setSimulationMode(false);
          setSimulationResult(null);
        } else if (showRightSidebar) setShowRightSidebar(false);
        else if (selectedNodeId) setSelectedNodeId(null);
        else return;
        e.preventDefault();
        return;
      }

      // 1. Modifier-based shortcuts (should work even inside inputs/terminal)
      if (isMod) {
        if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          toggleBottom();
          return;
        } else if (e.key.toLowerCase() === 'j') {
          e.preventDefault();
          toggleBottom();
          return;
        }
      }

      // 2. Ignore raw keys when focused inside inputs, textareas, or content-editables
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return;
      
      // 3. Raw-key shortcuts
      if (e.altKey) return;
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        toggleLeftSidebar();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setShowRightSidebar((p) => !p);
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleBottom();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSimulationMode((m) => {
          const next = !m;
          if (!next) setSimulationResult(null);
          return next;
        });
      } else if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1;
        const targetTabs: ArchTab[] = ['all', 'frontend', 'backend', 'api', 'security', 'database', 'systemdesign', 'docs', 'archco'];
        if (targetTabs[index]) {
          e.preventDefault();
          setTab(targetTabs[index]);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    apiKeysOpen,
    brainOpen,
    codeNodeId,
    selectedNodeId,
    shortcutsOpen,
    showRightSidebar,
    simulationMode,
    simulationResult,
    toggleLeftSidebar,
    toggleBottom,
  ]);

  const selectedNode = useMemo(
    () => state.canvas.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [state.canvas.nodes, selectedNodeId],
  );

  // Stable terminal API for xterm.js (identity must not change between renders).
  const terminalApi = useMemo(
    () => ({
      onData: onTerminalData,
      createTerminal: (id: string) => createTerminal(id, state.projectPath || undefined),
      closeTerminal,
      focusTerminal,
      sendInput: sendTerminalInput,
      resize: resizeTerminal,
    }),
    [onTerminalData, createTerminal, state.projectPath, closeTerminal, focusTerminal, sendTerminalInput, resizeTerminal],
  );

  // The architecture canvas tabs: the only surfaces with node counts and
  // findings that make the left (Canvas Status) and right (Findings) sidebars
  // meaningful. Database and System Design each render their own
  // full-width layout, so the sidebars are not rendered at all there — they
  // would only steal width and show irrelevant information.
  const isCanvasTab =
    tab === 'all' || tab === 'frontend' || tab === 'backend' || tab === 'api' || tab === 'security';
  const isArchitecture = isCanvasTab;

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
  const showCodePanel = isArchitecture && Boolean(codeNode);

  // Single click only updates the right-hand node details panel + locks the
  // highlight. It no longer opens the Code Intelligence Panel.
  const handleSelectNode = (id: string | null) => {
    setSelectedNodeId(id);
  };

  // Double click on a node opens the Code Intelligence Panel for its source file.
  // Always open it (even without a file) so the panel can explain why it cannot
  // load the source, including the full path it attempted.
  const handleOpenCode = (id: string) => {
    const node = state.canvas.nodes.find((n) => n.id === id);
    if (node && !isNodeVisibleInCanvasTab(node, tab, state.canvas, state.diagnostics)) {
      setTab('all');
    }
    setSelectedNodeId(id);
    setCodeNodeId(id);
  };

  // Run a failure simulation from a node and persist it to the brain.
  const runSim = (scenario: SimulationScenario) => {
    const result = runSimulation(scenario, state.canvas.nodes, state.canvas.edges, state.diagnostics);
    setSimulationResult(result);
    if (state.projectName) {
      fetch(`http://127.0.0.1:${PORTS.backend}/brain/simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: state.projectName, result }),
      }).catch(() => {
        /* brain persistence is best-effort */
      });
    }
  };
  const resetSimulation = () => setSimulationResult(null);
  const openFindingsPanel = () => {
    setShowRightSidebar(true);
    window.setTimeout(() => {
      document.getElementById('findings-panel-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  // What the right sidebar shows while simulating: the report once a run exists,
  // otherwise the control panel for the selected node.
  const simulationContent = simulationResult ? (
    <SimulationReport result={simulationResult} nodes={state.canvas.nodes} onReset={resetSimulation} />
  ) : simulationMode && selectedNode ? (
    <SimulationPanel node={selectedNode} onRun={runSim} />
  ) : null;

  // True whenever a full-screen overlay is showing. The bottom-panel toggle is
  // hidden while this is true so it never floats on top of a modal.
  const isAnyModalOpen = brainOpen || shortcutsOpen || apiKeysOpen;

  // Confidence context: has the Agent Team run, and when. Shared app-wide so
  // every surface can show honest static-vs-AI indicators without prop drilling.
  const agentTeamHasRun = state.agentTeam.runs.length > 0;
  const lastAgentRunAt = state.agentTeam.runs[0]?.at ?? null;
  const apiKeyContextValue = useMemo(
    () => ({
      hasApiKey,
      agentTeamHasRun,
      lastAgentRunAt,
      openAgentTeam: () => setTab('agentteam'),
      openApiKeys: () => setApiKeysOpen(true),
    }),
    [hasApiKey, agentTeamHasRun, lastAgentRunAt],
  );

  const securitySidebarContent =
    tab === 'security' ? (
      <section className="panel-block security-sidebar-panel">
        <h3 className="panel-title">Security Controls</h3>
        <div className="security-sidebar-actions">
          <button
            className="btn btn-sm"
            disabled={!state.projectId || !state.connected || state.reanalyzing}
            onClick={reanalyzeProject}
            title="Force a fresh full scan of the current project"
          >
            {state.reanalyzing ? (
              <>
                <FlickerLoader size={13} /> Re-analyzing...
              </>
            ) : (
              'Re-analyze'
            )}
          </button>
          <button
            className="btn btn-sm"
            disabled={!state.projectId || !state.connected}
            onClick={runChecks}
          >
            Run Checks
          </button>
        </div>

        <div className="security-sidebar-nudge">
          {!hasApiKey ? (
            <NudgeText tone="amber" onClick={() => setTab('agentteam')}>
              Static analysis only. Run Agent Team for AI-powered findings
            </NudgeText>
          ) : !agentTeamHasRun ? (
            <NudgeText tone="muted" onClick={() => setTab('agentteam')}>
              Run Agent Team for deeper analysis
            </NudgeText>
          ) : (
            <NudgeText tone="green">
              AI-enhanced. Last run {formatRunTimestamp(lastAgentRunAt)}
            </NudgeText>
          )}
        </div>

        <PipelineTags
          isVertical
          steps={state.steps}
          diagnostics={state.diagnostics}
          activeStep={securityStep}
          onSelect={setSecurityStep}
        />
      </section>
    ) : null;

  // Layer 1: a locked brain blocks the entire app at launch until unlocked.
  if (access?.locked) {
    return <LockScreen onUnlocked={setAccess} />;
  }

  return (
    <ApiKeyContext.Provider value={apiKeyContextValue}>
    <div
      className="app-shell"
      style={{ gridTemplateRows: `48px 1fr ${bottomCollapsed ? 0 : bottomHeight}px` }}
    >
      <TopBar
        connected={state.connected}
        projectName={state.projectName ?? ''}
        hasProject={Boolean(state.projectId)}
        tab={tab}
        findingsCount={state.diagnostics.length}
        hasApiKey={hasApiKey}
        onOpenKeys={() => setApiKeysOpen(true)}
        onOpenFindings={openFindingsPanel}
        onChooseFolder={chooseFolder}
        choosingFolder={choosingFolder}
      />

      <div className="app-body">
        {showLeftSidebar && (
          <Sidebar
            tab={tab}
            onTabChange={setTab}
            projectName={state.projectName ?? ''}
            hasProject={Boolean(state.projectId)}
            analyzedAt={state.analyzedAt}
            findingsCount={state.diagnostics.length}
            isolatedCount={isolatedCount}
            onOpenAgentTeam={() => setTab('agentteam')}
            agentTeamActive={tab === 'agentteam'}
            onOpenArchCo={() => setTab('archco')}
            onOpenBrain={() => setBrainOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            onOpenKeys={() => setApiKeysOpen(true)}
            onToggle={toggleLeftSidebar}
          />
        )}

        <main className="app-center">
          {/* When a sidebar is collapsed, a slim reveal tab sits on the screen
              edge so the user can bring it back. These belong to the edges, not
              the canvas surface. */}
          {!showLeftSidebar && (
            <button
              className="panel-reveal-tab on-left"
              onClick={toggleLeftSidebar}
              title="Show navigation (L)"
            >
              ▶
            </button>
          )}
          {isCanvasTab && !showRightSidebar && (
            <button
              className={`panel-reveal-tab on-right${showCodePanel ? ' beside-code-panel' : ''}`}
              style={showCodePanel ? { right: codeWidth } : undefined}
              onClick={() => setShowRightSidebar((p) => !p)}
              title="Show right sidebar (R)"
            >
              ◀
            </button>
          )}

          {tab === 'systemdesign' ? (
            <SystemDesign
              infra={state.infra}
              hasProject={Boolean(state.projectId)}
              findings={state.diagnostics}
              dependencies={state.dependencies}
              inferredSql={state.inferredSql}
              hasApiKey={hasApiKey}
              onOpenAgentTeam={() => setTab('agentteam')}
              onOpenApiKeys={() => setApiKeysOpen(true)}
              onSubModeChange={setSystemDesignMode}
            />
          ) : tab === 'docs' ? (
            <Docs hasApiKey={hasApiKey} apiKeys={apiKeys} />
          ) : tab === 'database' ? (
            <DatabaseDesigner inferredSql={state.inferredSql} hasProject={Boolean(state.projectId)} />
          ) : tab === 'archco' ? (
            <TeamReview
              embedded
              diagnostics={state.diagnostics}
              apiKeys={apiKeys}
              projectContext={state.projectName ?? ''}
              brainInsights={state.brain.insights.map((i) => i.message)}
            />
          ) : tab === 'agentteam' ? (
            <AgentTeam
              embedded
              team={state.agentTeam}
              projectName={state.projectName}
              hasProject={Boolean(state.projectId)}
              onRun={runAgentTeam}
              onStop={stopAgentTeam}
              onRequestRuns={requestAgentRuns}
              onClose={() => setTab('all')}
            />
          ) : (
            <ReactFlowProvider>
              {state.projectId && tab === 'security' && (
                <button className="agent-team-promo" onClick={() => setTab('agentteam')}>
                  <span className="agent-team-promo-glyph">⬡</span>
                  Agent Team available — run AI-powered deep analysis
                  <span className="agent-team-promo-cta">Open →</span>
                </button>
              )}



              <Canvas
                graph={state.canvas}
                diagnostics={state.diagnostics}
                onSelectNode={handleSelectNode}
                onOpenCode={handleOpenCode}
                selectedNodeId={selectedNodeId}
                filter={filter}
                simulationMode={simulationMode}
                simulationResult={simulationResult}
                onResetSimulation={resetSimulation}
                hasProject={Boolean(state.projectId)}
                projectName={state.projectName}
                techStack={state.techStack}
                missingPatterns={state.missingPatterns}
                onRunPrompt={(text) => setTermCommand({ id: Date.now(), text })}
              />
            </ReactFlowProvider>
          )}
        </main>

        {isCanvasTab && showRightSidebar && (
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
            stepFilter={tab === 'security' ? securityStep : null}
            onClearStepFilter={() => setSecurityStep(null)}
            headerContent={securitySidebarContent}
            simulationContent={simulationContent}
            onOpenCode={handleOpenCode}
            enrichment={state.enrichment}
            infra={state.infra}
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

      {bottomCollapsed && (
        <button
          className="bottom-reveal-btn"
          onClick={toggleBottom}
          title="Show bottom panel (B)"
          style={isAnyModalOpen ? { display: 'none' } : undefined}
        >
          ▲
        </button>
      )}

      {/* The bottom panel is NEVER unmounted — collapsing only hides it with CSS
          so every terminal's PTY session, scrollback, cwd, and running processes
          survive collapse and tab switches. */}
      <BottomPanel
        logs={state.logs}
        terminalApi={terminalApi}
        height={bottomHeight}
        onResize={setBottomHeight}
        onCollapse={toggleBottom}
        toggleHidden={isAnyModalOpen}
        hidden={bottomCollapsed}
        runCommand={termCommand}
      />

      {brainOpen && (
        <BrainPanel
          brain={state.brain}
          persistentIssues={state.agentTeam.persistentIssues}
          onClose={() => setBrainOpen(false)}
        />
      )}

      {reportToast && (
        <div className="report-toast" role="status">
          ✓ Report saved to project root
          <span className="report-toast-path">{reportToast.split('/').pop()}</span>
        </div>
      )}
      {folderError && (
        <div className="report-toast folder-error-toast" role="status">
          {folderError}
          <button type="button" onClick={() => setFolderError(null)} aria-label="Dismiss folder error">
            ✕
          </button>
        </div>
      )}
      {shortcutsOpen && <ShortcutsPanel onClose={() => setShortcutsOpen(false)} />}
      {apiKeysOpen && <ApiKeysModal onClose={() => setApiKeysOpen(false)} />}
    </div>
    </ApiKeyContext.Provider>
  );
}
