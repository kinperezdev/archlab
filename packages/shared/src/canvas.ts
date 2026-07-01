/**
 * Canvas domain types.
 *
 * The canvas is always generated from real parsed code, never drawn by hand.
 * These types describe the nodes and edges the backend emits and the frontend
 * renders with React Flow.
 */

/** Every kind of thing ArchLab can detect in a project and place on the canvas. */
export type NodeKind =
  | 'component' // frontend UI component
  | 'route' // frontend route / page
  | 'endpoint' // backend API endpoint / handler
  | 'middleware' // backend middleware
  | 'auth' // authentication / authorization layer
  | 'database' // database connection or model
  | 'external-service' // third party API / service
  | 'config' // configuration / env surface
  | 'mcp' // Model Context Protocol server / client
  | 'unknown';

/** Which swim lane a node belongs to on the canvas. */
export type Lane = 'frontend' | 'backend' | 'external';

/** Live animation state a node can be driven into during the check pipeline. */
export type NodeAnimationState =
  | 'idle'
  | 'processing' // soft pulsing glow
  | 'scanning' // packet-trace highlight
  | 'error' // flashes then holds red
  | 'stress' // green -> yellow -> red under simulated load
  | 'success'; // brief green glow then back to idle

/** A single canvas node, color coded by `kind`, positioned inside a `lane`. */
export interface CanvasNode {
  id: string;
  kind: NodeKind;
  lane: Lane;
  /** Human readable label shown on the node. */
  label: string;
  /** Absolute or project-relative source file this node was derived from. */
  filePath?: string;
  /** Free-form details surfaced in the node-details panel. */
  meta?: Record<string, string | number | boolean>;
  /** Current animation state, mutated live by the pipeline. */
  animation: NodeAnimationState;
  /** Layout position. Auto-computed by the backend layout pass. */
  position: { x: number; y: number };
  /** Third-party tools/services detected in this node's source file. */
  detectedTools?: DetectedToolSummary[];
}

/** A compact view of a detected third-party tool, attached to a canvas node. */
export interface DetectedToolSummary {
  id: string;
  name: string;
  color: string;
  /** Lucide icon name. */
  icon: string;
  isInternetConnected: boolean;
  connectionType: string;
  category: string;
  mcpServerUrl?: string;
  mcpDocsUrl?: string;
  securityNotes?: string;
  latestVersionCheck?: string;
}

/** A real data-flow connection found in the code, labeled with what travels it. */
export interface CanvasEdge {
  id: string;
  source: string; // CanvasNode.id
  target: string; // CanvasNode.id
  /** What data is being passed along this edge, e.g. "JWT", "user payload". */
  label?: string;
  /** Animated flowing-dash effect when this edge is part of an active trace. */
  animated: boolean;
}

/** The full canvas graph for one analyzed project. */
export interface CanvasGraph {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}
