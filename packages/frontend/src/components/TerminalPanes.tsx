/**
 * Renders a terminal tab's split-tree. Splits become flex row/col containers;
 * leaves render an independent xterm Terminal. The split/close controls live in
 * the shared tab bar (BottomPanel) and act on whichever pane is focused, so
 * there is no extra per-pane header bar cluttering the surface.
 */

import { lazy, Suspense } from 'react';
import type { TerminalApi } from './Terminal.js';
import { paneKey, type PaneNode } from './terminalLayout.js';

const Terminal = lazy(() => import('./Terminal.js').then((m) => ({ default: m.Terminal })));

interface TerminalPanesProps {
  node: PaneNode;
  api: TerminalApi;
  /** Focused leaf id within this tab (drives the canvas cd + highlight). */
  activePaneId: string;
  onFocusPane: (id: string) => void;
}

export function TerminalPanes(props: TerminalPanesProps) {
  const { node } = props;

  // A split renders its two children as keyed cells. A lone leaf is wrapped in
  // the SAME term-split > term-split-cell shell so that when a 2-pane split
  // collapses to one pane, React only removes the closed cell and reconciles the
  // surviving cell (and its live Terminal) in place — it is never unmounted and
  // remounted, which would recreate xterm and replay the saved buffer at the
  // wrong width (the source of the garbled, "unwrapped" terminal).
  if (node.kind === 'split') {
    return (
      <div className={`term-split term-split-${node.dir}`}>
        <PaneCell {...props} key={paneKey(node.a)} node={node.a} />
        <PaneCell {...props} key={paneKey(node.b)} node={node.b} />
      </div>
    );
  }

  return (
    <div className="term-split term-split-row term-split-solo">
      <PaneCell {...props} key={paneKey(node)} node={node} />
    </div>
  );
}

/** One split cell: either a nested split or a single terminal leaf. */
function PaneCell(props: TerminalPanesProps) {
  const { node } = props;
  if (node.kind === 'split') {
    return (
      <div className="term-split-cell">
        <TerminalPanes {...props} node={node} />
      </div>
    );
  }

  const { api, activePaneId, onFocusPane } = props;
  const id = node.id;
  const isActive = id === activePaneId;
  return (
    <div className="term-split-cell">
      <div
        className={`term-pane${isActive ? ' term-pane-active' : ''}`}
        onMouseDownCapture={() => onFocusPane(id)}
      >
        <div className="term-pane-body">
          <Suspense fallback={<div className="terminal-loading">Starting terminal…</div>}>
            <Terminal id={id} api={api} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
