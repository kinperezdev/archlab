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
import type { PipelineStepId } from '@archlab/shared';
import { PORTS } from '@archlab/shared';
import { TopBar } from './components/TopBar.js';
import { LeftSidebar } from './components/LeftSidebar.js';
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
import { IdeasCanvas } from './ideas/IdeasCanvas.js';
import { Docs } from './docs/Docs.js';
import { ShortcutsPanel } from './components/ShortcutsPanel.js';
import { ApiKeysModal } from './components/ApiKeysModal.js';
import { ApiKeyContext } from './state/apiKeyContext.js';
import { NudgeText } from './components/ConfidenceNudge.js';
import { formatRunTimestamp } from './lib/formatTime.js';

export type ArchTab =
  | 'all'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'api'
  | 'security'
  | 'systemdesign'
  | 'blueprint'
  | 'docs';

/** Tabs that render the architecture canvas (vs. the Database/Blueprint surfaces). */
export type CanvasFilter = 'all' | 'frontend' | 'backend' | 'api' | 'security';

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
  const [agentTeamOpen, setAgentTeamOpen] = useState(false);
  const [teamReviewOpen, setTeamReviewOpen] = useState(false);
  // Whether an Anthropic key is configured — drives Agent Team nudges in the
  // Enterprise Audit. Re-checked whenever the API Keys modal closes.
  const [hasApiKey, setHasApiKey] = useState(false);
  useEffect(() => {
    if (apiKeysOpen) return; // re-check after the modal closes (key may have changed)
    let cancelled = false;
    fetch(`http://127.0.0.1:${PORTS.backend}/api/keys`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.ok) setHasApiKey(Boolean(data.keys?.anthropic));
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

  // Keyboard shortcuts: B toggles left sidebar, R toggles right sidebar, M toggles bottom panel, 1-8 switches tabs.
  // Ignored while typing into the terminal or any text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // 1. Modifier-based shortcuts (should work even inside inputs/terminal)
      if (isMod) {
        if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          toggleLeftSidebar();
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
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleLeftSidebar();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setShowRightSidebar((p) => !p);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleBottom();
      } else if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1;
        const targetTabs: ArchTab[] = ['all', 'frontend', 'backend', 'database', 'api', 'security', 'systemdesign', 'blueprint', 'docs'];
        if (targetTabs[index]) {
          e.preventDefault();
          setTab(targetTabs[index]);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleLeftSidebar, toggleBottom, setShowRightSidebar, setTab]);

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
  // meaningful. Database, System Design, and Blueprint each render their own
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
    setCodeNodeId(id);
  };

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
      openAgentTeam: () => setAgentTeamOpen(true),
      openApiKeys: () => setApiKeysOpen(true),
    }),
    [hasApiKey, agentTeamHasRun, lastAgentRunAt],
  );

  // Layer 1: a locked brain blocks the entire app at launch until unlocked.
  if (access?.locked) {
    return <LockScreen onUnlocked={setAccess} />;
  }

  return (
    <ApiKeyContext.Provider value={apiKeyContextValue}>
    <div
      className="app-shell"
      style={{ gridTemplateRows: `44px 1fr ${bottomCollapsed ? 0 : bottomHeight}px` }}
    >
      <TopBar
        connected={state.connected}
        projectName={state.projectName ?? ''}
        hasProject={Boolean(state.projectId)}
        brainProjectCount={state.brain.projectCount}
        analyzedAt={state.analyzedAt}
        onOpenBrain={() => setBrainOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenKeys={() => setApiKeysOpen(true)}
        onOpenAgentTeam={() => setAgentTeamOpen((o) => !o)}
        agentTeamActive={agentTeamOpen}
        onOpenTeamReview={() => setTeamReviewOpen((o) => !o)}
        teamReviewActive={teamReviewOpen}
        tab={tab}
        onTabChange={setTab}
      />

      <div className="app-body">
        {isCanvasTab && showLeftSidebar && (
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
          {isCanvasTab && !showLeftSidebar && (
            <button
              className="panel-reveal-tab on-left"
              onClick={toggleLeftSidebar}
              title="Show left sidebar (B)"
            >
              ▶
            </button>
          )}
          {isCanvasTab && !showRightSidebar && (
            <button
               className="panel-reveal-tab on-right"
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
              hasApiKey={hasApiKey}
              onOpenAgentTeam={() => setAgentTeamOpen(true)}
              onOpenApiKeys={() => setApiKeysOpen(true)}
              onSubModeChange={setSystemDesignMode}
            />
          ) : tab === 'blueprint' ? (
            <IdeasCanvas />
          ) : tab === 'docs' ? (
            <Docs hasApiKey={hasApiKey} />
          ) : tab === 'database' ? (
            <DatabaseDesigner inferredSql={state.inferredSql} hasProject={Boolean(state.projectId)} />
          ) : (
            <ReactFlowProvider>
              <div className="canvas-left-overlay">
                {tab === 'security' && (
                  <div className="security-pipeline-overlay">
                    {/* Single flat row: ghost action buttons then the 7 step pills. */}
                    <div className="security-pipeline-actions">
                      <button
                        className="btn btn-sm"
                        disabled={!state.projectId || !state.connected || state.reanalyzing}
                        onClick={reanalyzeProject}
                        title="Force a fresh full scan of the current project"
                      >
                        {state.reanalyzing ? (
                          <>
                            <span className="btn-spinner" aria-hidden="true" /> Re-analyzing…
                          </>
                        ) : (
                          '▶ Re-analyze'
                        )}
                      </button>
                      <button
                        className="btn btn-sm"
                        disabled={!state.projectId || !state.connected}
                        onClick={runChecks}
                      >
                        ✔ Run Checks
                      </button>

                      <span className="pipeline-confidence-nudge">
                        {!hasApiKey ? (
                          <NudgeText tone="amber" onClick={() => setAgentTeamOpen(true)}>
                            Static analysis only · ⚡ Run Agent Team for AI-powered findings
                          </NudgeText>
                        ) : !agentTeamHasRun ? (
                          <NudgeText tone="muted" onClick={() => setAgentTeamOpen(true)}>
                            ⚡ Run Agent Team for deeper analysis
                          </NudgeText>
                        ) : (
                          <NudgeText tone="green">
                            ✓ AI-enhanced · last run {formatRunTimestamp(lastAgentRunAt)}
                          </NudgeText>
                        )}
                      </span>
                    </div>

                    <PipelineTags
                      steps={state.steps}
                      diagnostics={state.diagnostics}
                      activeStep={securityStep}
                      onSelect={setSecurityStep}
                    />
                  </div>
                )}

                {/* Status: Findings & Isolated */}
                <div className="flat-section">
                  <span className="flat-section-title">Canvas Status</span>
                  <div className="flat-status-list">
                    <div className="flat-status-item" title="Diagnostics / architectural issues">
                      <span className="flat-status-icon">⚠️</span>
                      <span className="flat-status-label">Findings</span>
                      <span className="flat-status-count">{state.diagnostics.length}</span>
                    </div>
                    <div className="flat-status-item" title="Nodes with no connections">
                      <span className="flat-status-icon">📦</span>
                      <span className="flat-status-label">Isolated</span>
                      <span className="flat-status-count">{isolatedCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {state.projectId && tab === 'security' && !agentTeamOpen && (
                <button className="agent-team-promo" onClick={() => setAgentTeamOpen(true)}>
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
              />
            </ReactFlowProvider>
          )}
        </main>

        {teamReviewOpen && (
          <TeamReview
            diagnostics={state.diagnostics}
            onClose={() => setTeamReviewOpen(false)}
          />
        )}

        {agentTeamOpen && (
          <AgentTeam
            team={state.agentTeam}
            projectName={state.projectName}
            hasProject={Boolean(state.projectId)}
            onRun={runAgentTeam}
            onStop={stopAgentTeam}
            onRequestRuns={requestAgentRuns}
            onClose={() => setAgentTeamOpen(false)}
          />
        )}

        {!agentTeamOpen && isCanvasTab && showRightSidebar && (
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
          title="Show bottom panel (M)"
          style={isAnyModalOpen ? { display: 'none' } : undefined}
        >
          ▲ Pipeline &amp; Terminal
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
      {shortcutsOpen && <ShortcutsPanel onClose={() => setShortcutsOpen(false)} />}
      {apiKeysOpen && <ApiKeysModal onClose={() => setApiKeysOpen(false)} />}
    </div>
    </ApiKeyContext.Provider>
  );
}
