/**
 * Renders a terminal tab's split-tree. Splits become flex row/col containers;
 * leaves render an independent xterm Terminal. The split/close controls live in
 * the shared tab bar (BottomPanel) and act on whichever pane is focused, so
 * there is no extra per-pane header bar cluttering the surface.
 */

import { lazy, Suspense, useRef, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import type { TerminalApi } from './Terminal.js';
import { leafCount, paneKey, type PaneNode } from './terminalLayout.js';

const Terminal = lazy(() => import('./Terminal.js').then((m) => ({ default: m.Terminal })));

interface TerminalPanesProps {
  node: PaneNode;
  api: TerminalApi;
  /** Focused leaf id within this tab (drives the canvas cd + highlight). */
  activePaneId: string;
  onFocusPane: (id: string) => void;
  onClosePane: (id: string) => void;
  onResizeSplit: (splitId: string, ratio: number) => void;
  canClosePanes?: boolean;
}

export function TerminalPanes(props: TerminalPanesProps) {
  const { node } = props;
  const canClosePanes = props.canClosePanes ?? leafCount(node) > 1;
  const childProps = { ...props, canClosePanes };

  // A split renders its two children as keyed cells. A lone leaf is wrapped in
  // the SAME term-split > term-split-cell shell so that when a 2-pane split
  // collapses to one pane, React only removes the closed cell and reconciles the
  // surviving cell (and its live Terminal) in place — it is never unmounted and
  // remounted, which would recreate xterm and replay the saved buffer at the
  // wrong width (the source of the garbled, "unwrapped" terminal).
  if (node.kind === 'split') {
    const ratio = Math.min(0.82, Math.max(0.18, node.ratio ?? 0.5));
    return (
      <div className={`term-split term-split-${node.dir}`}>
        {/* Each cell gives up half the divider's 6px so the row sums to 100%
            exactly; a bare percentage basis overflows the tab by 6px. */}
        <PaneCell {...childProps} key={paneKey(node.a)} node={node.a} basis={`calc(${ratio * 100}% - 3px)`} />
        <SplitDivider split={node} onResizeSplit={childProps.onResizeSplit} />
        <PaneCell {...childProps} key={paneKey(node.b)} node={node.b} basis={`calc(${(1 - ratio) * 100}% - 3px)`} />
      </div>
    );
  }

  return (
    <div className="term-split term-split-row term-split-solo">
      <PaneCell {...childProps} key={paneKey(node)} node={node} />
    </div>
  );
}

function SplitDivider({
  split,
  onResizeSplit,
}: {
  split: Extract<PaneNode, { kind: 'split' }>;
  onResizeSplit: (splitId: string, ratio: number) => void;
}) {
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const onMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const parent = dividerRef.current?.parentElement;
    if (!parent) return;
    document.body.classList.add('is-resizing', 'is-resizing-split');
    const onMove = (moveEvent: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const raw =
        split.dir === 'row'
          ? (moveEvent.clientX - rect.left) / Math.max(1, rect.width)
          : (moveEvent.clientY - rect.top) / Math.max(1, rect.height);
      onResizeSplit(split.id, Math.min(0.82, Math.max(0.18, raw)));
    };
    const onUp = () => {
      document.body.classList.remove('is-resizing', 'is-resizing-split');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      ref={dividerRef}
      className={`term-split-divider term-split-divider-${split.dir}`}
      role="separator"
      aria-orientation={split.dir === 'row' ? 'vertical' : 'horizontal'}
      onMouseDown={onMouseDown}
      title="Drag to resize split"
    />
  );
}

/** One split cell: either a nested split or a single terminal leaf. */
function PaneCell(props: TerminalPanesProps & { basis?: string }) {
  const { node, basis } = props;
  const style: CSSProperties | undefined = basis ? { flex: `0 0 ${basis}` } : undefined;
  if (node.kind === 'split') {
    return (
      <div className="term-split-cell" style={style}>
        <TerminalPanes {...props} node={node} />
      </div>
    );
  }

  const { api, activePaneId, onFocusPane, onClosePane, canClosePanes } = props;
  const id = node.id;
  const isActive = id === activePaneId;
  return (
    <div className="term-split-cell" style={style}>
      <div
        className={`term-pane${isActive ? ' term-pane-active' : ''}`}
        onMouseDownCapture={(event) => {
          // The close button must not focus the pane it is about to close;
          // capture-phase focus here would override closePane's focus logic.
          if ((event.target as HTMLElement).closest('.term-pane-close')) return;
          onFocusPane(id);
        }}
      >
        {canClosePanes && (
          <button
            type="button"
            className="term-pane-close"
            title="Close this pane"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              onClosePane(id);
            }}
          >
            ✕
          </button>
        )}
        <div className="term-pane-body">
          <Suspense fallback={<div className="terminal-loading">Starting terminal…</div>}>
            <Terminal id={id} api={api} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
